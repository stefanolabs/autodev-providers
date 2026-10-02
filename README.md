# AutoDev community providers

[AutoDev](https://autodev.stefanolabs.com) runs the agent CLIs you already use (claude, codex,
antigravity) on a shared thread. A **provider** is what teaches AutoDev to drive one more CLI. This
repository is the community list AutoDev searches: one folder per provider, and an `index.json`
that names each provider's file and its SHA-256.

## Installing a provider

From a terminal:

```bash
autodev providers search            # what is listed
autodev providers add template-codex
```

Or open the AutoDev panel in VS Code, go to the CLIs stage and press **Browse community
providers**. Either way, AutoDev shows you what you are agreeing to and asks before it installs.

A provider installs as one file. AutoDev downloads it over https, refuses it unless its SHA-256
matches `index.json`, and keeps it under `~/.autodev/providers/<name>/`. There is no npm package to
install and no install script runs.

## What "listed" means

A provider is listed when it passes the provider contract on captures recorded from the real CLI,
passes its own tests, and is built in CI from the source in its folder. Listed does **not** mean
the author of AutoDev maintains it: each provider belongs to the person who wrote it.

## What a provider cannot do

- **Reach the network.** A provider file imports nothing and has no `fetch`, no `process`, no
  `require`. AutoDev checks the file before it loads it and runs it in a sandbox that has none of
  those, so the check is not the only thing stopping it.
- **Run anything but its CLI.** It starts only the program it declares, through AutoDev's runner.
  That program keeps its own login; the provider never sees your credentials.

The CLI a provider drives can still do whatever that CLI does. Install a provider for a CLI you
would run yourself.

## Writing one

Start from [`providers/template-codex`](providers/template-codex) and follow
[CONTRIBUTING.md](CONTRIBUTING.md). The full guide is at
https://autodev.stefanolabs.com/docs/write-a-provider.

## License

MIT. See [LICENSE](LICENSE).
