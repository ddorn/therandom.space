#!/usr/bin/env python

import random
from collections import defaultdict

SEP = "#"
EMPTY = "%"

__all__ = ["gen", "load_preproc"]


def load_preproc(file):
    """Load a occurence table from an open file."""

    occ = defaultdict(dict)
    for line in file:
        *prefix, last, freq = line.strip("\n").split(SEP)
        occ[tuple(prefix)][last] = float(freq)
    return occ


def gen(occ):
    """Generate a random sentence from an occurence table."""
    depth = len(next(iter(occ)))

    word = [EMPTY] * depth
    while word[-1] != EMPTY or len(word) == depth:
        probas = occ[tuple(word[-depth:])]
        occ_total = sum(probas.values())
        occ_cum = 0
        cutoff = random.random() * occ_total
        for w, p in probas.items():
            occ_cum += p
            if occ_cum >= cutoff:
                word.append(w)
                break

    word = word[depth:-1]
    if all(len(t) == 1 for t in word):
        sep = ""
    else:
        sep = " "
    return sep.join(word).capitalize()
