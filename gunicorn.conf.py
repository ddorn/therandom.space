bind = "0.0.0.0:8080"
# Likes live in memory, so there must be exactly one process. Threads are fine.
workers = 1
worker_class = "gthread"
threads = 8
accesslog = "-"
