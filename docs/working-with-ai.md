# Working with AI in this repo

The rules are in `CLAUDE.md`, kept short because that file is loaded into every session and
every turn pays for it. This is the reasoning behind them.

## Why more code is the default, and why that is the problem

Two forces push an AI-assisted codebase toward growth.

The first is economic. When the cost of building a feature falls, the number of features worth
building rises — often faster than the price falls, so total spend goes *up* rather than down.
This is Jevons' paradox, and it applies cleanly to software: cheaper features means more
features, not a cheaper backlog.

The second is mechanical. A language model predicts tokens and is billed by them. Paying for
output by the token is the same mistake as paying a programmer by the line: it rewards exactly
the behaviour you do not want. Nobody has to intend this for it to happen — it is the default
gradient, and it has to be corrected against deliberately.

Both point the same way: an AI-assisted codebase grows faster than a hand-written one, and
grows in the direction of more code rather than better code.

That matters because **every line is a long-term liability**. It is a line to read, to keep
correct, to migrate, and to hold in a context window later. The good engineers at large
codebases have always known this; some of them count lines deleted as their real output. Code
is the cost of the feature, not the evidence of it.

## Why a larger context window does not rescue it

The obvious response is to give the model more context. It does not work, for three reasons.

**Lost in the middle.** The model does not see a structured codebase. It sees one flat sequence
of tokens, start to finish. Retrieval across that sequence is U-shaped: what sits at the
beginning and the end is attended to well, and what sits in the middle is where detail goes
quietly. A critical fact does not have to fall outside the window to be missed — being buried
mid-sequence is enough.

**Cost.** Attention compares every token against every token before it, so the work scales with
the square of the window. Double the context, roughly quadruple the work — repeated on every
single turn.

**The alternatives leak.** Sparse attention only compares a chosen subset of pairs, so a real
dependency can be missed inside the window. Retrieval — indexing the codebase and pulling in
what looks relevant — only finds what something in view textually refers to. Coupling that
flows through a database, an HTTP path or a file format has no reference to search for.

## Hidden cross-links

This is the failure worth internalising, because it is invisible in review.

An agent verifies what it has loaded. Everything else it infers from training — fluently, and
sometimes wrongly. A function whose return shape it cannot see gets a guessed shape. A helper
it cannot see gets assumed cheap, and a linear-looking loop calling an unseen linear helper is
quietly quadratic. Neither failure looks like a mistake on the page; both compile.

The sharpest version has no code link at all on either side. A module writes totals and
discounts to a table; a nightly report elsewhere reads that table directly and subtracts the
discounts itself. Change the writer to pre-apply discounts and the report now subtracts them
twice. There is no reference between the two — nothing to grep for, nothing an index returns.
The only defence is knowing the channels where this repo couples without referring to itself,
which is why `CLAUDE.md` lists them explicitly.

A live one: `/api/ask` and `/api/contact` are called from `src/` and implemented in `api/`, but
neither is mirrored in the Vite dev middleware in `vite.config.ts`, so both 404 under
`npm run dev`. Nothing in `src/` mentions `vite.config.ts`. No search starting from the calling
code would find it.

## What this asks of a reviewer

Judge the diff by what it costs to keep, not by how much arrived. Ask what was deleted. Ask
which callers were checked, and how — a claim that nothing else uses a function is only worth
the search behind it. For a change to a shared shape, ask who reads it, including the readers
that never name it.
