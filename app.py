from flask import Flask, Response, abort, jsonify, make_response, redirect, render_template, request, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

from helper import (
    ALSACE, FILM, KINDS, LIKE_FILE, MAX_LIKED_QUOTES, MAX_QUOTE_LENGTH, PROVERB, Likes, gen_clean, generable, ngram,
)

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)  # TLS ends at fly's proxy
app.json.sort_keys = False  # Keep the best of ranked
app.json.ensure_ascii = False
likes = Likes(LIKE_FILE)

for _kind in KINDS:
    ngram(_kind)


@app.before_request
def redirect_www():
    if request.host.startswith("www."):
        url = request.url.replace("://www.", "://", 1)
        return redirect(url, code=308)  # Permanent, and keeps the method


def wants_raw() -> bool:
    return request.args.get("raw", "").lower() not in ("", "0", "false", "no")


def check_kind(kind: str):
    if kind not in KINDS:
        abort(make_response({"message": f"{kind} is not a valid kind. Try {', '.join(KINDS)}."}, 404))


# ####################### Word/Sentence pages ####################### #
def word_page(kind):
    word = gen_clean(kind, likes)
    return render_template("word.html", likes=likes.get(word), bled=word, title=kind.title())


@app.route("/")
def home():
    return redirect(url_for("proverb"))


@app.route("/proverb")
def proverb():
    return word_page(PROVERB)


@app.route("/alsace")
def alsace():
    return word_page(ALSACE)


@app.route("/film")
def film():
    return word_page(FILM)


# ####################### Complex pages ####################### #
@app.route("/bestof")
def bestof():
    bests = [(quote, like) for quote, like, _ in likes.ranked(PROVERB)]
    return render_template("bestof.html", title="Best of", bests=bests)


@app.route("/about")
def about():
    return render_template("about.html", title="About")


@app.get("/google<token>.html")
def google_site_verification(token):
    return app.send_static_file(f"google{token}.html")


@app.errorhandler(404)
def page_not_found(_):
    return render_template("404.html"), 404


# ####################### Hidden Pages ^^ ####################### #
@app.route("/showcase")
def showcase():
    return render_template("showcase.html", title="Showcase")


@app.route("/anim")
def anim():
    return render_template("animation.html", title="Animation")


# ####################### API ####################### #
@app.get("/api/<kind>")
def generate(kind):
    check_kind(kind)
    quote = gen_clean(kind, likes)
    if wants_raw():
        return Response(quote, mimetype="text/plain")
    return {"quote": quote, "likes": likes.get(quote)}


@app.route("/api/like/<kind>", methods=["POST", "DELETE"])
def like(kind):
    check_kind(kind)
    body = request.get_json(silent=True)
    quote = body.get("quote") if isinstance(body, dict) else None
    if not isinstance(quote, str) or not quote.strip() or len(quote) > MAX_QUOTE_LENGTH:
        return {"message": f"Expected a JSON body {{'quote': <non-empty string of at most {MAX_QUOTE_LENGTH} chars>}}."}, 400

    # New entries must come from the generator, so the best of can't be used to publish arbitrary text.
    if request.method == "POST" and quote not in likes:
        if not generable(quote, kind):
            return {"message": f"This is not a {kind} that therandom.space could generate."}, 400
        if len(likes) >= MAX_LIKED_QUOTES:
            return {"message": "The best of is full."}, 507

    entry = likes.add(quote, kind, 1 if request.method == "POST" else -1)
    return {"quote": quote, **entry}


@app.get("/api/bestof")
def api_bestof():
    kind = request.args.get("kind") or None
    if kind is not None and kind not in KINDS:
        return {"message": f"{kind} is not a valid kind. Try {', '.join(KINDS)}."}, 400
    bests = likes.ranked(kind)

    if wants_raw():
        return Response("\n".join(f"{like} {quote}" for quote, like, _ in bests), mimetype="text/plain")

    return jsonify({
        str(i): {"quote": quote, "likes": like, "kind": kind}
        for i, (quote, like, kind) in enumerate(bests)
    })
