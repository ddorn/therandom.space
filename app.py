"""
"""
from logging.config import dictConfig
from typing import Dict

from flask import abort, Flask, redirect, render_template, request, Response, url_for
from flask_restful import Api, reqparse, Resource

try:
    from helper import *
except ImportError:
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
likes: Dict[str, Dict] = load_likes()

quote_parser = reqparse.RequestParser()
quote_parser.add_argument("quote")


# ####################### Word/Sentence pages ####################### #
def word_page(kind):
    word = gen_clean(kind)
    like = likes.get(word, {}).get('likes', 0)
    return render_template("word.html", likes=like, bled=word, title=kind.title())


@app.route("/")
def home(): return redirect(url_for("proverb"))


@app.route("/proverb")
def proverb(): return word_page(PROVERB)


@app.route("/alsace")
def alsace(): return word_page(ALSACE)


@app.route("/film")
def film(): return word_page(FILM)


# ####################### Complex pages ####################### #
@app.route("/bestof")
def bestof():
    bests = [(quote, like) for quote, like, kind in flat_bestof(likes) if kind == PROVERB]
    return render_template("bestof.html", title="Best of", bests=bests)


@app.route("/about")
def about():
    # TODO: add API description
    return render_template("about.html", title="About")


@app.errorhandler(404)
def page_not_found(_):
    return render_template('404.html'), 404


# ####################### Hidden Pages ^^ ####################### #

@app.route("/showcase")
def showcase():
    return render_template('showcase.html', title="Showcase")


@app.route("/anim")
def anim():
    return render_template('animation.html', title="Animation")

@app.route("/list")
def listpage():
    return render_template('list.html', title="Liste de course")

# ####################### API ####################### #

class Generate(Resource):
    def get(self, kind):
        if kind not in (ALSACE, PROVERB, FILM):
            return abort(404)

        quote = gen_clean(kind)
        if request.args.get("raw", type=bool):
            return Response(quote)

        like = likes.get(quote, {}).get('likes', 0)
        return {
            'quote': quote,
            'likes': like
        }


class Like(Resource):
    def post(self, kind):
        if not valid_kind(kind):
            return abort(404)
        args = quote_parser.parse_args(strict=1)
        quote = args['quote']

        d = likes.setdefault(quote, {'kind': kind, 'likes': 0})
        d['likes'] += 1
        save_likes(likes)

        return dict(quote=quote, **d)

    def delete(self, kind):
        if not valid_kind(kind):
            return abort(404)
        args = quote_parser.parse_args(strict=1)
        quote = args['quote']

        if quote in likes:
            d = likes[quote]
            d['likes'] -= 1
            if d['likes'] == 0:
                del likes[quote]
            save_likes(likes)
        else:
            d = {'kind': kind, 'likes': 0}

        return dict(quote=quote, **d)


class BestOf(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument("raw", type=bool)
    parser.add_argument("kind", type=kind_arg_type)

    def get(self):
        args = self.parser.parse_args(strict=True)
        filter_ = args['kind'] or ''

        if args['raw']:
            return Response('\n'.join(
                f"{like} {quote}"
                for quote, like, _ in flat_bestof(likes)
            ))

        return {
            i: {
                'quote': quote,
                'likes': like,
                'kind': kind
            } for i, (quote, like, kind) in enumerate(flat_bestof(likes))
            if filter_ in kind
        }


api.add_resource(Generate, '/api/<kind>')
api.add_resource(Like, '/api/like/<kind>')
api.add_resource(BestOf, '/api/bestof', endpoint='apibestof')

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
