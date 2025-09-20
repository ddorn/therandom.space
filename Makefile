.PHONY: run
run:
	uv run --frozen gunicorn app:app -b 0.0.0.0:8100


REMOTE=pine
REMOTE_DIR=/srv/therandom.space
SERVICE=therandomspace

.PHONY: deploy
deploy:
	git ls-files | rsync -avz --files-from=- . $(REMOTE):$(REMOTE_DIR)
	ssh $(REMOTE) "systemctl restart $(SERVICE) && journalctl -u $(SERVICE) -f -n 30"
