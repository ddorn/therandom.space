import json
import os
import random
import threading
from functools import cache
from operator import itemgetter
from pathlib import Path

from lampadophore import EMPTY, NGram

DATA = Path(__file__).parent / "data"
LIKE_FILE = Path(os.environ.get("LIKES_FILE", DATA / "like_file"))

PROVERB = "proverb"
ALSACE = "alsace"
FILM = "film"
KINDS = (PROVERB, ALSACE, FILM)

KIND_TO_PROCFILE = {
    PROVERB: DATA / "citations.proc2",
    ALSACE: DATA / "alsa.proc3",
    FILM: DATA / "films.proc5",
}
KIND_LEN_BOUNDS = {
    PROVERB: (4, 16),
    ALSACE: (5, 9999),
    FILM: (3, 9999),
}

# One generation in SERVE_BESTOF_ONE_IN is replaced by a liked quote of the same kind.
SERVE_BESTOF_ONE_IN = 16
MAX_QUOTE_LENGTH = 300
MAX_LIKED_QUOTES = 10_000


class Likes:
    """Like counts per quote, kept in memory and persisted to a JSON file.

    The in-memory copy is the source of truth, so the app must run in a single process.
    """

    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()
        try:
            self.data: dict[str, dict] = json.loads(path.read_text())
        except FileNotFoundError:
            self.data = {}

    def get(self, quote: str) -> int:
        return self.data.get(quote, {}).get("likes", 0)

    def __contains__(self, quote: str) -> bool:
        return quote in self.data

    def __len__(self) -> int:
        return len(self.data)

    def random_quote(self, kind: str) -> str | None:
        with self.lock:
            quotes = [quote for quote, d in self.data.items() if d["kind"] == kind]
        return random.choice(quotes) if quotes else None

    def add(self, quote: str, kind: str, delta: int) -> dict:
        """Change the like count of a quote by delta. Quotes reaching 0 are forgotten."""
        with self.lock:
            entry = self.data.get(quote)
            if entry is None:
                if delta <= 0:
                    return {"kind": kind, "likes": 0}
                entry = self.data[quote] = {"kind": kind, "likes": 0}
            entry["likes"] += delta
            if entry["likes"] <= 0:
                del self.data[quote]
            self._save()
            return dict(entry)

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_name(self.path.name + ".tmp")
        tmp.write_text(json.dumps(self.data))
        tmp.replace(self.path)

    def ranked(self, kind: str | None = None) -> list[tuple[str, int, str]]:
        """All liked quotes as (quote, likes, kind), most liked first."""
        with self.lock:
            bests = [
                (quote, d["likes"], d["kind"])
                for quote, d in self.data.items()
                if kind is None or d["kind"] == kind
            ]
        bests.sort(key=itemgetter(1), reverse=True)
        return bests


@cache
def ngram(kind: str) -> NGram:
    with open(KIND_TO_PROCFILE[kind]) as f:
        return NGram.load(f)


def length(w: str, kind: str) -> int:
    if kind == PROVERB:
        return len(w.split())
    return len(w)


def in_bounds(quote: str, kind: str) -> bool:
    mini, maxi = KIND_LEN_BOUNDS[kind]
    return mini <= length(quote, kind) <= maxi


def generable(quote: str, kind: str) -> bool:
    """Whether gen_clean could have produced this quote from the kind's model."""
    if not in_bounds(quote, kind):
        return False
    occ = ngram(kind)
    text = quote.lower()  # NGram.gen only capitalizes sentences
    tokens = list(text) if kind != PROVERB else text.split(" ")
    window = (EMPTY,) * occ.depth
    for token in tokens + [EMPTY]:
        if token not in occ.occ.get(window, {}):
            return False
        window = window[1:] + (token,)
    return True


def gen_clean(kind: str, likes: Likes) -> str:
    if random.randrange(SERVE_BESTOF_ONE_IN) == 0:
        best = likes.random_quote(kind)
        if best is not None and in_bounds(best, kind):
            return best

    occ = ngram(kind)
    while True:
        w = occ.gen()
        if in_bounds(w, kind):
            return w
