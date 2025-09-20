run:
	uv run --frozen gunicorn app:app -b 0.0.0.0:8100
