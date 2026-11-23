# A named stage rather than COPY --from=<image>, so that Dependabot updates it.
FROM ghcr.io/astral-sh/uv:0.13 AS uv

FROM python:3.15-slim

COPY --from=uv /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev

COPY data/citations.proc2 data/alsa.proc3 data/films.proc5 data/
COPY app.py helper.py lampadophore.py gunicorn.conf.py ./
COPY static static
COPY templates templates

EXPOSE 8080
CMD ["gunicorn", "app:app"]
