// Copy for each product's docs overview page (/<product>/docs/). Every sentence restates a fact
// from the product's own docs/ or README.md; the `from` notes name the source file so the copy
// can be re-checked when the docs change. Inline Markdown (code spans, bold) is allowed.

export interface Overview {
  eyebrow: string;
  headline: string;
  lead: string;
  /** Real commands for the hero command strip, in order. */
  strip: { label: string; cmd: string }[];
  steps: { title: string; text: string; cmd?: string }[];
  concept: { eyebrow: string; title: string; body: string; code: string; lang: string; caption: string };
  table: { eyebrow: string; title: string; head: [string, string]; rows: [string, string][] };
  notice: { label: string; text: string; kind: "note" | "warning" | "tip" };
  faq: { q: string; a: string }[];
  /** Slugs of the pages the "Next steps" band links to. */
  next: string[];
  from: string[];
}

export const OVERVIEWS: Record<string, Overview> = {
  rtok: {
    eyebrow: "rtok documentation",
    headline: "Less context for your agent, every saving on record.",
    lead: "rtok reduces the context AI coding agents must carry. One Rust binary, three surfaces: Claude Code hooks, an MCP server, and an API proxy. Each reduction is measured; shortened payloads stay retrievable by id.",
    strip: [
      { label: "Install", cmd: "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/pyrlyn/rtok/releases/latest/download/rtok-installer.sh | sh" },
      { label: "Configure", cmd: "rtok config init" },
      { label: "Inspect", cmd: "rtok doctor" },
      { label: "Wire in", cmd: "rtok agents install claude --dry-run" },
    ],
    steps: [
      { title: "Install one binary", text: "Prebuilt binaries for macOS (Apple silicon or Intel) and Linux x86-64. The installer puts `rtok` and `rtok-update` in `~/.cargo/bin`; `ketch install pyrlyn/rtok` works too.", cmd: "ketch install pyrlyn/rtok" },
      { title: "Price what you already run", text: "`rtok doctor` is worth running before you install anything: it prices the hooks and MCP servers you already have, including description tokens re-sent on every turn.", cmd: "rtok doctor" },
      { title: "Wire it into your agent", text: "`--dry-run` prints the hook entries and touches nothing. Install backs up every file it writes, and `uninstall` takes it out again.", cmd: "rtok agents install claude" },
      { title: "Expand anything that was cut", text: "Lossless by default: anything shortened is retrievable by id, and a saving that is not a `Measurement` row does not exist.", cmd: "rtok expand <id>" },
    ],
    concept: {
      eyebrow: "Four invariants",
      title: "The rules every surface keeps.",
      body: "1. **Fail open.** A hook exits 0 in ≤ 10 ms even on error, with unmodified input.\n2. **Lossless by default.** Anything shortened is retrievable via `rtok expand <id>`.\n3. **A saving that is not a `Measurement` row does not exist.**\n4. **Injected context stays under budget and byte-stable**, so it never busts the prompt cache.",
      code: "rtok config init      # writes ~/.rtok/config.toml\nrtok plugins          # id, enabled, surfaces\nrtok doctor           # inspect hooks, MCP servers, proxy chain",
      lang: "bash",
      caption: "First run, from Getting started",
    },
    table: {
      eyebrow: "Where things live",
      title: "Everything rtok keeps, in one place.",
      head: ["Path", "What it holds"],
      rows: [
        ["`~/.rtok/config.toml`", "Configuration (`RTOK_HOME` overrides the directory)"],
        ["`~/.rtok/rtok.db`", "SQLite — measurements, archive index, memory"],
        ["`~/.rtok/archive/`", "Raw payloads, addressed by expand id"],
        ["`<git root>/.rtok.toml`", "Optional per-project overrides"],
      ],
    },
    notice: {
      label: "Caveats",
      kind: "warning",
      text: "Token counts from `rtok stats` are estimates plus real `usage` rows from the proxy; only the proxy rows are the actual bill. The committed A/B bench has only been run offline, so rerun it against live traffic before adopting a configuration on its word.",
    },
    faq: [
      { q: "Does rtok break the prompt cache?", a: "No — measured, not promised. The Prompt cache page reports `hit=97.5%` from `rtok stats` on the maintainer's machine (2026-09-18) and zero recorded prompt-cache busts in `rtok report`. Injection is byte-stable, rewrites stay outside the conversation's working edge, and hooks touch each result once." },
      { q: "What happens if a plugin was compiled out?", a: "The subcommand prints `not implemented` and exits 0, so a stripped or half-installed rtok never blocks the host agent." },
      { q: "Which agents can it wire into?", a: "`rtok agents install <host>` configures Claude Code and other hosts such as `cursor`, `codex` and `opencode`. The Agents page lists, per host, what an install writes and which rtok plugins then reach that app." },
      { q: "Where did a setting come from?", a: "Every CLI flag is a config key in `~/.rtok/config.toml`, and `rtok config show --sources` always tells you where a value came from." },
    ],
    next: ["getting-started", "config", "agents"],
    from: ["docs/getting-started.md", "docs/prompt-cache.md", "docs/config.md", "docs/agents.md"],
  },

  cox: {
    eyebrow: "cox documentation",
    headline: "One event stream behind every surface.",
    lead: "cox is a modular terminal coding agent in Rust. One core state machine turns submissions into typed events; the same stream powers the TUI, headless runs, editor clients (ACP), and MCP.",
    strip: [
      { label: "Build", cmd: "mise exec -- cargo build -p cox" },
      { label: "Check", cmd: "./target/debug/cox doctor" },
      { label: "One turn", cmd: "./target/debug/cox -p \"create hello.txt containing hi\"" },
      { label: "TUI", cmd: "./target/debug/cox" },
    ],
    steps: [
      { title: "Build it", text: "Rust is pinned with mise. Prefer `mise exec -- cargo …` over a global toolchain.", cmd: "git clone https://github.com/pyrlyn/cox && cd cox\nmise exec -- cargo build -p cox" },
      { title: "Add a key and check", text: "Export `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) and run `cox doctor` — green except prices? You are good.", cmd: "./target/debug/cox doctor" },
      { title: "Run a turn", text: "`cox` opens the TUI: `Enter` sends, `Esc` interrupts. `y` / `s` / `n` answer approval prompts, `/model` switches tiers, `/compact` compacts context now.", cmd: "./target/debug/cox" },
      { title: "Script it", text: "`cox run -p` is the headless form. `--output-format stream-json` prints the same `Event` JSON the TUI renders, one object per line.", cmd: "./target/debug/cox run -p \"summarise the diff\" --output-format stream-json" },
    ],
    concept: {
      eyebrow: "How it works",
      title: "Submission in, events out.",
      body: "A `Submission` goes into a pure core state machine, a sequence of `Event`s comes out, and every surface renders that same sequence: the TUI, headless `cox run -p`, the ACP editor server, the MCP server, the JSONL rollout on disk, and the test suite.\n\nEverything the core needs from outside — models, files, shells, stored sessions — arrives through traits (`Provider`, `Tool`, `Store`, `Hook`, `Archive`), which is what makes the loop testable without a model.",
      code: "{\"type\":\"tool_call_requested\",\"call\":{\"name\":\"write\",\"input\":{\"path\":\"hello.txt\",\"content\":\"hi\\n\"}}}\n{\"type\":\"tool_call_done\",\"call_id\":\"…\",\"result\":{\"ok\":true,\"visible\":\"wrote 3 bytes to hello.txt\",\"bytes\":3}}\n{\"type\":\"text_delta\",\"text\":\"Created hello.txt.\"}\n{\"type\":\"turn_done\",\"stop\":\"end_turn\"}",
      lang: "json",
      caption: "The events of one turn, from How it works",
    },
    table: {
      eyebrow: "Scriptable exit codes",
      title: "Headless runs report what happened.",
      head: ["Exit code", "Meaning"],
      rows: [["`0`", "ok"], ["`1`", "error"], ["`2`", "denied — a call the policy would ask about was refused"], ["`3`", "budget"], ["`4`", "interrupted"]],
    },
    notice: {
      label: "Status",
      kind: "warning",
      text: "cox is under active development. APIs, configuration, and install paths are not yet stable. Treat the docs as the current manual, not a frozen release surface.",
    },
    faq: [
      { q: "Can I use cox from my editor?", a: "Yes. `cox acp` serves cox over the Agent Client Protocol on stdio — the same `Event` stream as the TUI, so prompts, tool calls, approvals and diffs show up in Zed, JetBrains or Neovim." },
      { q: "How are approvals handled in scripts?", a: "Under the headless default (`--approve never`), a `Write`/`Exec` call the policy would ask about is denied instead, with the reason in the tool result so the model can try another approach; the run exits `2`." },
      { q: "What happens to large tool output?", a: "Every tool writes untruncated output to the archive first; the model sees the capped visible form plus an `expand` pointer." },
      { q: "Where do costs show up?", a: "Costs land in `cox stats`, and the status line shows the session spend against the session cap (`budget.session_usd`)." },
    ],
    next: ["getting-started", "how-it-works", "config"],
    from: ["docs/getting-started.md", "docs/how-it-works.md", "docs/tools.md", "docs/ide.md"],
  },

  ketch: {
    eyebrow: "ketch documentation",
    headline: "Catch releases straight from GitHub.",
    lead: "ketch installs command-line tools and apps from GitHub releases on macOS, Linux, and Windows. It picks the release asset built for your machine, checks the checksum the project published, unpacks it into a versioned store, and links it onto your `PATH`.",
    strip: [
      { label: "Install", cmd: "curl -fsSL https://raw.githubusercontent.com/pyrlyn/ketch/main/install.sh | bash" },
      { label: "First tool", cmd: "ketch install BurntSushi/ripgrep" },
      { label: "Lock", cmd: "ketch lock" },
      { label: "Reproduce", cmd: "ketch sync" },
    ],
    steps: [
      { title: "Resolve", text: "Point it at `owner/repo`, a name from the registry, or an exact version. `ketch why` explains a resolution without installing.", cmd: "ketch install sharkdp/fd@v10.2.0" },
      { title: "Verify", text: "Published SHA-256 sums are checked against what landed on disk. `require_checksums` refuses anything that publishes none.", cmd: "ketch install --require-checksum rg" },
      { title: "Link", text: "The payload is unpacked into a versioned store under `~/.ketch` and linked onto your `PATH`; an `.app` bundle goes to `/Applications`.", cmd: "ketch list" },
      { title: "Undo or reproduce", text: "An upgrade keeps the previous version on disk; `ketch rollback` relinks it without re-downloading. `ketch lock` and `ketch sync` reproduce a machine.", cmd: "ketch rollback rg" },
    ],
    concept: {
      eyebrow: "One tree",
      title: "Everything lives under ~/.ketch.",
      body: "Versioned payloads in `store/`, links in `bin/`, a `state.json` recording what is installed, and a `stats.db` recording what happened. Nothing is written outside that tree except the `.app` bundles that belong in `/Applications` and the files you ask for, such as `./ketch.lock`.\n\n`state.json` says what is installed now; `stats.db` is the append-only other half, which is why `ketch history rg` still works after `ketch uninstall rg`.",
      code: "~/.ketch/\n├── store/       versioned payloads\n├── bin/         links onto your PATH\n├── state.json   what is installed now\n└── stats.db     what happened, and when",
      lang: "",
      caption: "Layout described in the ketch README",
    },
    table: {
      eyebrow: "What you can install",
      title: "Five ways to name a package.",
      head: ["Reference", "What it means"],
      rows: [
        ["`BurntSushi/ripgrep`", "Any repository that publishes releases"],
        ["`rg`", "A name ketch already knows from the registry"],
        ["`sharkdp/fd@v10.2.0`", "An exact version"],
        ["`--path ./mytool`", "A local binary, archive, symlink, or `.app`"],
        ["`local:/abs/or/rel`", "The same thing, as a package ref"],
      ],
    },
    notice: {
      label: "Tip",
      kind: "tip",
      text: "You rarely need a manifest: ketch infers one from `owner/repo` alone. Write one when inference gets it wrong — an unusually named asset, a binary linked under a different name, an `.app` bundle, or a short alias.",
    },
    faq: [
      { q: "Can I install from GitLab or an internal server?", a: "Yes. GitHub is built in; anything else is a source plugin — an executable named `ketch-source-<scheme>` that ketch runs with a subcommand and that answers with one JSON document. No recompile and no ketch release needed." },
      { q: "How do I set up a new machine the same way?", a: "`ketch lock` writes `./ketch.lock` from what is installed. Commit it next to your dotfiles; `ketch sync` makes another machine match it, and `ketch lock --check` tells you whether anything has drifted." },
      { q: "What is the registry?", a: "An ordinary GitHub repository. Every top-level folder is a package and holds one `ketch.toml` describing it." },
      { q: "How do I remove ketch again?", a: "`ketch self uninstall` removes every package ketch installed, the whole `~/.ketch` tree and the `PATH` block it added. It lists what it is about to delete and asks first; `--keep-packages` removes only ketch." },
    ],
    next: ["getting-started", "commands", "manifests"],
    from: ["README.md", "docs/MANIFESTS.md", "docs/PLUGINS.md", "docs/LOCKFILE.md", "docs/REGISTRY.md", "docs/COMMANDS.md"],
  },
};
