from collections import Counter
from pathlib import Path

DATA = Path(__file__).parent / "data"
LIKE_FILE = DATA / "like_file"


def load_likes():
    LIKE_FILE.touch()
    likes = Counter()
    for line in LIKE_FILE.open():
        line = line.strip()
        if line:
            kind, _, rest = line.partition(" ")
            like, _, what = rest.partition(" ")
            likes[kind, what] += int(like)
    return likes


def save_likes(likes: Counter):
    with open(LIKE_FILE, "w") as f:
        for (kind, what), like in likes.items():
            print(kind, like, what, file=f)
