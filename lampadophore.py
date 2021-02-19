#!/usr/bin/env python

"""
Module to generate N-grams and random strings from those N-grams.
"""


import random
from collections import defaultdict
from typing import Dict, Tuple, Union

import click

SEP = "#"
EMPTY = "%"


class NGram:
    """A probability table for the N+1th gram."""

    def __init__(self, depth=2):
        """N-grams that gives the probability for the depth+1 grams."""
        self.depth = depth
        self.occ: Dict[Tuple[str, ...], Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    def __str__(self):
        s = ''
        for key in sorted(self.occ):
            probas = self.occ[key]
            s += '\t'.join(key)
            if len(probas) == 1:
                k, v = next(iter(probas.items()))
                s += f'\t{k} => {v}\n'
            else:
                s += '\n'
                for k, v in probas.items():
                    s += '\t' * self.depth + f'{k} => {v}\n'
        return s

    def __getitem__(self, key) -> Union[float, Dict[str, float]]:
        """Get the value in the occurence table. Key is a D-tuple or D+1-tuple."""
        if isinstance(key[0], tuple):
            key, last = key
        elif len(key) == self.depth:
            return self.occ[tuple(key)]
        else:
            *key, last = key
        return self.occ[tuple(key)][last]

    def __setitem__(self, key, value):
        """Set the value in the occurence table. Key is a D+1-tuple."""
        if isinstance(key[0], tuple):
            key, last = key
        else:
            *key, last = key
        assert len(key) == self.depth
        self.occ.setdefault(tuple(key), {})[last] = value

    def __delitem__(self, key):
        """Delete a key the occurence table. Key is a D+1-tuple."""
        if isinstance(key[0], tuple):
            key, last = key
            key = tuple(key)
        else:
            *key, last = key
        del self.occ[key][last]
        if not self.occ[key]:
            del self.occ[key]

    def __iter__(self):
        return iter(self.occ)

    def __len__(self):
        return sum(map(len, self.occ.values()))

    def bifurcations(self, _occ=None):
        tot = 0
        for k in self:
            tot += len(self[k]) - 1
        return tot

    def save(self, file):
        """Save a multi-dimensional occurence table to an open file.

        Return the number of lines written."""

        for key in self:
            for last, proba in self[key].items():
                print(*key, last, proba, file=file, sep=SEP)

        return len(self)

    @classmethod
    def from_expressions(cls, expressions, depth=2):
        """Create an occ from a list of pair (count, expr)."""

        # Compute all N-grams
        occ = cls(depth)
        for count, expr in expressions:
            w = [EMPTY] * depth
            for c in expr:
                occ[w][c] = occ[w][c] + count
                w.pop(0)
                w.append(c)
            # End of word
            occ[w][EMPTY] += count

        # Remove all expression that did not create branches
        for count, expr in expressions:
            w = [EMPTY] * depth
            path = []
            for i, c in enumerate(expr):
                w.append(c)
                path.append(w[:])
                w.pop(0)
                # Branches with i <= depth are not real branches
                # as the depth first words are always in a proverb
                if len(occ[w]) > 1 and i > depth:
                    break  # We stop when there is a branch
            else:  # If no branch, decrease the count
                for i, (*key, c) in enumerate(path):
                    occ[key][c] -= count

        # Remove in to step, so size doesn't change during iteration
        to_remove = []
        for k in occ:
            for c, proba in occ[k].items():
                # Branches to cut have probability 0, but it is a float
                if proba < 0.00001:
                    to_remove.append((k, c))
        for k, c in to_remove:
            del occ[k, c]

        return occ

    @classmethod
    def load(cls, file):
        """Load a occurence table from an open file."""
        depth = file.readline().count("#") - 1
        file.seek(0)

        occ = cls(depth)
        for line in file:
            *prefix, freq = line.strip("\n").split(SEP)
            occ[prefix] = float(freq)

        return occ

    def gen(self):
        word = [EMPTY] * self.depth
        while word[-1] != EMPTY or len(word) == self.depth:
            probas = self[word[-self.depth:]]
            assert probas
            occ_total = sum(probas.values())
            occ_cum = 0
            cutoff = random.random() * occ_total
            for w, p in probas.items():
                occ_cum += p
                if occ_cum >= cutoff:
                    word.append(w)
                    break

        word = word[self.depth:-1]  # Remove the EMPTYs

        if all(len(t) == 1 for t in word):
            sep = ""
        else:
            sep = " "
        # Capitalize all sentences
        return '. '.join(map(str.capitalize, sep.join(word).split('. ')))


def valid_word(word):
    for c in word:
        if 0xa0 > ord(c) > ord("z") \
            or SEP in word \
            or not c.isalpha() and not c in ".,-'’!?;: ":
            return False
    return True


def preproc_words(file_, depth=2, verbose=False):
    """Create an OCC from a file with 'count word' on each line."""

    ignored = 0
    expressions = []
    for line in file_:
        count, _, word = line.partition(" ")
        count = float(count)
        word = word.strip().lower()
        if valid_word(word):
            expressions.append((count, word))
        else:
            if verbose:
                print("×", word)
            ignored += 1

    print("Ignored:", ignored)
    print("Used:", len(expressions))
    return NGram.from_expressions(expressions, depth)


def preproc_sentences(file_, depth, verbose=False):
    """Create an OCC from a file with 'count sentence' on each line."""

    ignored = 0
    expressions = []
    for line in file_:
        count, _, sentence = line.partition(" ")
        count = float(count)
        words = sentence.lower().strip().split()
        for word in words:
            if not valid_word(word):
                ignored += 1
                if verbose:
                    print("×", sentence.strip(), "=>", word)
                break
        else:
            expressions.append((count, words))

    print("Ignored:", ignored)
    print("Used:", len(expressions))
    return NGram.from_expressions(expressions, depth)


@click.group()
def cli():
    """Generate random strings according to N-grams."""


@cli.command()
@click.argument("input", type=click.File("r"))
@click.argument("output", type=click.File("w"))
@click.option("-d", "--depth", default=2, help="Number of previous tokens that influence the next.")
@click.option("-S", "--sentences", is_flag=True, default=False, help="Generate sentences instead of words")
@click.option('-v', '--verbose', is_flag=True)
def proc(input, output, depth, sentences, verbose):
    """Process a file with word frequencies for the generate command.

    Each line must be in the format 'FREQUENCY WORD'.
    The frequency is the ponderation for a given word."""

    if sentences:
        occ = preproc_sentences(input, depth, verbose)
    else:
        occ = preproc_words(input, depth, verbose)
    print("Generated with", occ.bifurcations(), "bifurcations.")

    lines = occ.save(output)
    print(lines, "lines written.")


@cli.command("gen")
@click.argument("probas", type=click.File("r"))
@click.option("-n", "--count", default=1, help="Number of words to generate")
def gen_cmd(probas, count):
    """Generate random words/sentences from a proc file."""

    occ = NGram.load(probas)
    for i in range(count):
        print(occ.gen())


if __name__ == "__main__":
    cli()
