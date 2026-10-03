# content/docs — synced product documentation

Each `<product>/` folder here is a copy of the user-facing Markdown files in that product's own
`docs/` folder (`docs/site.md` excluded — it becomes `content/projects/<product>.md`). Do not edit these
files in this repository: the next sync overwrites them. Change the docs in the product
repository instead.

| Folder | Source |
| --- | --- |
| `rtok/` | [`pyrlyn/rtok` `docs/`](https://github.com/pyrlyn/rtok/tree/main/docs) |
| `cox/` | [`pyrlyn/cox` `docs/`](https://github.com/pyrlyn/cox/tree/main/docs) |
| `ketch/` | [`pyrlyn/ketch` `docs/`](https://github.com/pyrlyn/ketch/tree/main/docs) |

## How files arrive

The same `.github/workflows/sync-docs.yml` that syncs `docs/site.md` (see
`content/projects/README.md`) mirrors `docs/**/*.md` into `content/docs/<repo name>/` with
`rsync --delete --delete-excluded`, so renamed and deleted docs disappear here too, and writes
`content/docs/<repo name>/_source.json`:

```json
{ "repo": "pyrlyn/rtok", "sha": "<full commit sha>", "ref": "main" }
```

The site uses `sha` to point links at files outside `docs/` (source code, excluded docs,
images) to GitHub at exactly the synced commit. The sync commits only when a Markdown file
changed.

## What is not synced

Internal pages stay in the product repository: the workflow's rsync filter leaves out plans,
to-do and done lists, roadmap notes, research, proposals, QA audits, ADRs and design notes,
maintainer runbooks (release, SonarCloud), agent instructions (`AGENTS.md`, `CLAUDE.md`) and
asset notes, plus a short per-product list. `--delete-excluded` removes any copy of them from
here on the next sync. Links from a published page to one of them point to GitHub.

## What becomes a page

`src/data/docs-nav.json` decides the navigation order, tab titles and groups, and lists the
files that intentionally have no page (`exclude`, with a reason). A synced file that is in
neither list still gets a page under a trailing "More" group, and `npm run check:docs` warns
about it, so new docs are never silently dropped. Every page is
`<base><product>/docs/<slug>/`, where the slug is the file path without `.md`, lower-cased,
with `/` turned into `-` (`design/loop.md` → `design-loop`).

This `README.md` is not a product folder.
