"""
"""
import json
from logging.config import dictConfig
from operator import itemgetter

from flask import Flask, redirect, render_template, request, url_for, abort
from flask_restful import Resource, Api, reqparse
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
api = Api(app)
likes = load_likes()

parser = reqparse.RequestParser()
parser.add_argument("quote")


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


######################## Word/Sentence pages ########################
def word_page(kind):
    word = gen_clean(kind)
    return render_template("word.html", bled=word, title=kind.title())


@app.route("/")
def home(): return redirect(url_for("proverb"))

@app.route("/proverb")
def proverb(): return word_page(PROVERB)

@app.route("/alsace")
def alsace(): return word_page(ALSACE)

@app.route("/film")
def film(): return word_page(FILM)


######################## Complex pages ########################
@app.route("/bestof")
def bestof():
    likes = load_likes()
    bests = [(quote, like) for quote, like, kind in flat_bestof(likes) if kind == PROVERB]
    return render_template("bestof.html", title="Best of", bests=bests)


@app.route("/about")
def about():
    # TODO: add API description
    return render_template("about.html", title="About")


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


######################## API ########################

class Generate(Resource):
    def get(self, kind):
        if kind not in (ALSACE, PROVERB, FILM):
            return abort(404)

        quote = gen_clean(kind)
        if request.args.get("raw", type=bool):
            return quote

        like = likes.get(quote, {}).get('likes', 0)
        return {
            'quote': quote,
            'likes': like
        }

class Like(Resource):
    def post(self, kind):
        if kind not in (ALSACE, PROVERB, FILM):
            return abort(404)

        args = parser.parse_args(strict=1)
        quote = args['quote']
        d = likes.get(quote, {'kind': kind, 'likes': 0})
        d['likes'] += 1
        likes[quote] = d
        save_likes(likes)

        return dict(quote=quote, **d)

class BestOf(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument("raw", type=bool)
    parser.add_argument("kind", type=kind_arg_type)

    def get(self):

        args = self.parser.parse_args(strict=True)
        filter = args['kind'] or ''

        if args['raw']:
            return '\n'.join(
                f"{like} {quote}"
                for quote, like, _ in flat_bestof(likes)
            )

        return {
            i: {
                'quote': quote,
                'likes': like,
                'kind': kind
            } for i, (quote, like, kind) in enumerate(flat_bestof(likes))
            if filter in kind
        }

api.add_resource(Generate, '/api/<kind>')
api.add_resource(Like, '/api/like/<kind>')
api.add_resource(BestOf, '/api/bestof', endpoint='apibestof')


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
