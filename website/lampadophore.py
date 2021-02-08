#!/usr/bin/env python

import random
from collections import defaultdict

SEP = "#"
EMPTY = "%"


__all__ = ["gen", "load_preproc"]


def empty_occ(depth=2):
    def r(d):
        return (lambda: defaultdict(d))

    d = float
    for i in range(depth):
        d = r(d)
    return defaultdict(d)


def get(occ, *indices):
    """Get the value in the occurence table recursively"""
    for i in indices:
        occ = occ[i]
    return occ


def set(occ, value, *indices):
    """Set a value in the occurence table recursively"""
    if len(indices) == 1:
        occ[indices[0]] = value
        return

    *rest, last = indices
    d = get(occ, *rest)
    d[last] = value


def get_depth(occ):
    if isinstance(occ, float):
        return -1
    return 1 + get_depth(occ[next(iter(occ))])


def load_preproc(file):
    """Load a occurence table from an open file."""
    depth = file.readline().count("#") - 1
    file.seek(0)

    occ = empty_occ(depth)
    for line in file:
        *prefix, freq = line.strip("\n").split(SEP)
        freq = float(freq)
        set(occ, freq, *prefix)

    return occ


def gen(occ):
    depth = get_depth(occ)

    word = [EMPTY] * depth
    while word[-1] != EMPTY or len(word) == depth:
        probas = get(occ, *word[-depth:])
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
