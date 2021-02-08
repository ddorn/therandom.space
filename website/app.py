"""
"""
import json
from logging.config import dictConfig

from flask import Flask, redirect, render_template, request, url_for
from markupsafe import Markup

try:
    from lampadophore import gen, load_preproc
    from helper import *
except ImportError:
    from .lampadophore import gen, load_preproc
    from .helper import *



dictConfig(
    {
        "version": 1,
        "formatters": {
            "default": {
                "format": "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
            }
        },
        "handlers": {
            "wsgi": {
                "class": "logging.StreamHandler",
                "stream": "ext://flask.logging.wsgi_errors_stream",
                "formatter": "default",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "default",
                "filename": "log",
                "maxBytes": 1024,
            },
        },
        "root": {"level": "INFO", "handlers": ["wsgi", "file"]},
    }
)

app = Flask(__name__)


def word_page(proc_path, title, min_len=1, max_len=999999):
    occ = load_preproc(open(proc_path))
    w = ""
    while len(w.split()) < min_len or len(w.split()) > max_len:
        w = gen(occ)
    return render_template("word.html", bled=w, title=title)

@app.route("/")
def home():
    return redirect(url_for("proverb"))


@app.route("/proverb")
def proverb():
    return word_page("data/citations.proc2", "Proverb", 4, 16)


@app.route("/french-word")
def french_word ():
    return word_page("data/fr.proc2", "French Word", 4)


@app.route("/alsace")
def alsace():
    return word_page("data/alsa.proc2", "Alsace", 5)

@app.route("/film")
def film():
    return word_page("data/films.proc5", "Film", 3)

@app.route("/bestof")
def bestof():
    likes = load_likes()
    flat = [(l, p) for (k, p), l in likes.items() if k == "proverb"]
    bests = [
        (proverb, like)
        for like, proverb in sorted(flat, reverse=True)
    ]

    return render_template("bestof.html", title="Best of", bests=bests)

@app.route("/about")
def about():
    return render_template("about.html", title="About")


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.route("/<kind>/like", methods=["POST"])
def like(kind):
    if kind not in ("alsace", "proverb", "film"):
        return "error"

    d = json.loads(request.get_data())
    print(d)
    what = Markup(d["what"]).unescape()

    # what = request.form["what"]
    likes = load_likes()
    likes[kind, what] += 1
    save_likes(likes)

    like = likes[kind, what]
    return str(like)


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
