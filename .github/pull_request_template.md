## Provider

<!-- Which CLI does it drive, and where can a reviewer install that CLI? -->

## Checklist

- [ ] `npx autodev-provider-kit check` passes on captures recorded from the real CLI (`autodev providers capture`), not written by hand.
- [ ] One real AutoDev thread turn by this provider: a screenshot, or the `thread.jsonl` line it posted.
- [ ] My own tests in `test/` pass and cover at least 80% of the lines in `src/`.
- [ ] `provider.mjs` is the output of `npx autodev-provider-kit build` on `src/index.ts`, never edited by hand.
- [ ] `meta.json` is filled in: description, author, homepage.
- [ ] `npm run index` was run, and `index.json` is part of this pull request.

## For the reviewer

Read the argv this provider builds, in full: every flag it passes to the CLI. That is the one thing
a provider can still get wrong after every check above is green.
