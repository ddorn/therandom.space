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


@app.route("/")
def home():
    occ = load_preproc(open("data/alsa.proc2"))
    w = ""
    while len(w) < 5:
        w = gen(occ)
    return render_template("home.html", bled=w, title="Alsace")


@app.route("/about")
def about():
    return render_template("about.html", title="About")


# @app.errorhandler(404)
# def page_not_found(e):
#     # note that we set the 404 status explicitly
#     return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
