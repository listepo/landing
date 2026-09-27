# content/projects — synced project pages

Each `<name>.md` here is a copy of `docs/site.md` from the project's own repository. Do not edit
these files in this repository: the next sync overwrites them. Change `docs/site.md` in the
source repository instead.

| File | Source |
| --- | --- |
| `rtok.md` | [`listepo/rtok` `docs/site.md`](https://github.com/listepo/rtok/blob/main/docs/site.md) |
| `cox.md` | [`listepo/cox` `docs/site.md`](https://github.com/listepo/cox/blob/main/docs/site.md) |
| `ketch.md` | [`listepo/ketch` `docs/site.md`](https://github.com/listepo/ketch/blob/main/docs/site.md) |

## How files arrive

`.github/workflows/sync-docs.yml` in each source repository runs on a push to `main` that changes
`docs/site.md`, on every `v*` tag, and by hand (`workflow_dispatch`). It copies `docs/site.md` to
`content/projects/<repo name>.md` on this repository's default branch and commits as
`github-actions[bot]` only when the file changed. It authenticates with a write-enabled deploy key
(`docs-sync`) on this repository; each source repository holds the private half as the
`SITE_DEPLOY_KEY` secret. On a tag push the `version:` field is set from the tag (`v1.2.3` →
`1.2.3`).

## Front matter

| Field | Type | Meaning |
| --- | --- | --- |
| `title` | string | Project name as the repository spells it (`rtok`, `cox`, `ketch`) |
| `tagline` | string, at most 160 characters | One-sentence pitch |
| `repo` | URL | `https://github.com/listepo/<name>` |
| `homepage` | URL | The project's own documentation site |
| `install` | string | Primary install command, one line |
| `install_alternatives` | list of strings, optional | Other install commands, in the order the README lists them |
| `version` | string, semver without `v` | Latest published release |
| `accent` | `#RRGGBB` | Suggested accent colour, the dark-theme accent of the project's own site |

## Body

An HTML comment naming the source, then these H2 sections in this order:

1. `## Overview` — one or two paragraphs, including any status caveat.
2. `## Features` — bullets, each starting with a bold name.
3. `## Install` — primary command first, then alternatives, in fenced code blocks.
4. `## Usage examples` — fenced blocks of real commands, checked against the project's CLI.
5. `## Links` — repository, documentation, releases, and the license.

This `README.md` is not a project page; a content loader globbing `*.md` here must exclude it.
