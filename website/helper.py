import json
from _operator import itemgetter
from pathlib import Path

from lampadophore import gen, load_preproc

DATA = Path(__file__).parent / "data"
LIKE_FILE = DATA / "like_file"

PROVERB = "proverb"
ALSACE = "alsace"
FILM = "film"

KIND_TO_PROCFILE = {
    PROVERB: "data/citations.proc2",
    ALSACE: "data/alsa.proc3",
    FILM: "data/films.proc5",
}
KIND_LEN_BOUNDS = {
    PROVERB: (4, 16),
    ALSACE: (5, 9999),
    FILM: (3, 9999)
}


def valid_kind(kind):
    return kind in (PROVERB, ALSACE, FILM)


def kind_arg_type(s):
    if valid_kind(s):
        return s
    raise ValueError(f'{s} is not a valid kind. Try {PROVERB}, {ALSACE} or {FILM}.')


def load_likes():
    LIKE_FILE.touch()
    likes = json.loads(LIKE_FILE.read_text())
    return likes


def save_likes(likes):
    LIKE_FILE.write_text(
        json.dumps(likes)
    )


def flat_bestof(likes):
    """Return all entries sorted in the bestof as tuples (quotes, likes, kind)."""
    bests = [
        (quote, d['likes'], d['kind'])
        for quote, d in likes.items()
    ]
    bests.sort(key=itemgetter(1), reverse=True)
    return bests


def gen_clean(kind):
    assert kind in KIND_TO_PROCFILE, "Unknown kind"

    mini, maxi = KIND_LEN_BOUNDS[kind]
    occ = load_preproc(open(KIND_TO_PROCFILE[kind]))

    w = ""
    length = -1
    while not (mini <= length <= maxi):
        w = gen(occ)
        if kind == PROVERB:
            length = len(w.split())
        else:
            length = len(w)
    return w


if __name__ == '__main__':
    pass
