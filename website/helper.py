import json
from collections import Counter
from pathlib import Path

DATA = Path(__file__).parent / "data"
LIKE_FILE = DATA / "like_file"


def load_likes():
    LIKE_FILE.touch()
    likes = json.loads(LIKE_FILE.read_text())
    return likes


def save_likes(likes):
    LIKE_FILE.write_text(
        json.dumps(likes)
    )


def load_likes_old():
    LIKE_FILE.touch()
    likes = Counter()
    for line in LIKE_FILE.open():
        line = line.strip()
        if line:
            kind, _, rest = line.partition(" ")
            like, _, what = rest.partition(" ")
            likes[kind, what] += int(like)
    return likes


def migrate():
    likes = load_likes_old()

    j = [
        {
            "quote": quote,
            "likes": like,
            "kind": kind,
        }
        for (kind, quote), like in likes.items()
    ]

    save_likes(j)


def migrate2():
    likes = load_likes()
    j = {
        d['quote']: {
            "likes": d['likes'],
            "kind": d['kind'],
        }
        for d in likes
    }
    save_likes(j)

if __name__ == '__main__':
    migrate()
    migrate2()
