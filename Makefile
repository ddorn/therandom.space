srv-install:
	apt install python3-poetry

run:
	poetry run gunicorn app:app -b 0.0.0.0:8100
