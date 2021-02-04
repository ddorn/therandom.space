"""
"""

import random as _random
from logging.config import dictConfig

from flask import Flask, render_template, request, send_from_directory, Response

try:
    from lampadophore import gen, load_preproc
except ImportError:
    from .lampadophore import gen, load_preproc

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


def word_page(proc_path, title, min_len=1):
    occ = load_preproc(open(proc_path))
    w = ""
    while len(w) < min_len:
        w = gen(occ)
    return render_template("word.html", bled=w, title=title)

@app.route("/")
def home():
    occ = load_preproc(open("data/alsa.proc2"))
    w = ""
    while len(w) < 5:
        w = gen(occ)
    return render_template("word.html", bled=w, title="Alsace")


@app.route("/proverb")
def proverb():
    return word_page("data/citations.proc2", "Proverbe")


@app.route("/french-word")
def french_word ():
    return word_page("data/fr.proc2", "French Word", 4)


@app.route("/alsace")
def alsace():
    return word_page("data/alsa.proc2", "Alsace")

@app.route("/name")
def name():
    return word_page("data/mec.proc2", "Name")

@app.route("/about")
def about():
    return render_template("about.html", title="About")


# @app.errorhandler(404)
# def page_not_found(e):
#     # note that we set the 404 status explicitly
#     return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
