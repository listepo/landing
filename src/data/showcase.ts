// Product-page showcase data. Every command and every output line below is copied from the
// project's README / synced site copy; output is shown only where the README shows it.

export interface DemoStep { cmd: string; note?: string; out?: string[] }
export interface Demo { title: string; caption: string; steps: DemoStep[] }
export interface Flow { title: string; nodes: { label: string; detail: string }[] }

export const DEMOS: Record<string, Demo> = {
  rtok: {
    title: "rtok — zsh",
    caption: "Commands and output from the rtok README (dry-run output abridged with …).",
    steps: [
      { cmd: "rtok agents install claude --dry-run", out: ["+ PreToolUse Bash rtok hook PreToolUse", "+ PreToolUse Read rtok hook PreToolUse", "+ PostToolUse * rtok hook PostToolUse", "…", "8 additions"] },
      { cmd: "rtok run -- cargo test", out: ["[rtok 7f3a91 · 412 lines · expand: rtok expand 7f3a91]"] },
      { cmd: "rtok graph index .", out: ["indexed 5 files · 551 rows · 0 skipped · 5 read"] },
      { cmd: "rtok plugins", out: ["id       enabled  surfaces", "measure  on       cli,proxy", "cmd      on       hook,cli", "archive  on       proxy,mcp", "…"] },
    ],
  },
  cox: {
    title: "cox — zsh",
    caption: "Commands and comments from the cox README; the README shows no output, so none is invented.",
    steps: [
      { cmd: "export ANTHROPIC_API_KEY=sk-...", note: "# or OPENAI_API_KEY" },
      { cmd: "cox doctor", note: "# green except prices? you are good" },
      { cmd: 'cox run -p "create hello.txt containing hi"' },
      { cmd: 'cox run --continue -p "now run the tests"' },
      { cmd: "cox stats --day" },
      { cmd: "cox", note: "# interactive TUI: Enter sends, Esc interrupts" },
    ],
  },
  ketch: {
    title: "ketch — zsh",
    caption: "Commands and comments from the ketch README.",
    steps: [
      { cmd: "ketch install BurntSushi/ripgrep", note: "# any repo that publishes releases" },
      { cmd: "ketch install sharkdp/fd@v10.2.0", note: "# or an exact version" },
      { cmd: "ketch outdated", note: "# what has a newer release" },
      { cmd: "ketch upgrade", note: "# bring everything unpinned up to date" },
      { cmd: "ketch lock", note: "# write ./ketch.lock from what is installed" },
    ],
  },
};

export const FLOWS: Record<string, Flow> = {
  rtok: {
    title: "Three surfaces, one ledger",
    nodes: [
      { label: "Hooks", detail: "Claude Code and other agents" },
      { label: "MCP server", detail: "read, memory, graph, expand" },
      { label: "API proxy", detail: "provider-reported usage" },
      { label: "Ledger", detail: "every saving is a Measurement row" },
    ],
  },
  cox: {
    title: "One event stream",
    nodes: [
      { label: "Submission", detail: "prompt, approval, command" },
      { label: "Core", detail: "pure state machine" },
      { label: "Event", detail: "typed, streamed" },
      { label: "Surfaces", detail: "TUI · headless · ACP · MCP" },
    ],
  },
  ketch: {
    title: "Install, upgrade, roll back",
    nodes: [
      { label: "Release asset", detail: "the one built for your machine" },
      { label: "Verify", detail: "published SHA-256 vs disk" },
      { label: "Store", detail: "versioned prefix under ~/.ketch" },
      { label: "Link", detail: "onto your PATH" },
      { label: "Rollback", detail: "relinks the previous version, no re-download" },
    ],
  },
};

/** Generic fallback for tools added later: type the Usage example commands, no output. */
export function demoFromUsage(title: string, blocks: { code: string }[]): Demo {
  const steps = blocks.flatMap((b) => b.code.split("\n")).filter((l) => l.trim()).slice(0, 6)
    .map((l) => { const m = l.match(/^(.*?)(\s+#\s.*)$/); return m ? { cmd: m[1], note: m[2].trim() } : { cmd: l }; });
  return { title: `${title} — zsh`, caption: `Commands from the ${title} usage examples.`, steps };
}

/** cox scenes (TUI / headless / editor). Commands and comments from the cox README usage examples. */
export const COX_SCENES: { id: string; label: string; sub: string; demo: Demo }[] = [
  {
    id: "tui", label: "TUI", sub: "cox",
    demo: {
      title: "cox — interactive",
      caption: "From the cox README: Enter sends, Esc interrupts; y/s/n answer approval prompts, /model switches tiers, /compact compacts context.",
      steps: [
        { cmd: "cox", note: "# Enter sends, Esc interrupts" },
        { cmd: 'cox "explain the layout of this repository"', note: "# optionally with a first prompt" },
      ],
    },
  },
  {
    id: "headless", label: "Headless", sub: "cox run -p",
    demo: {
      title: "cox — headless",
      caption: "From the cox README: script a headless run and pick up where it stopped.",
      steps: [
        { cmd: 'cox run -p "add a unit test for parse_args" --output-format json --max-turns 20' },
        { cmd: 'cox run --continue -p "now run the tests"' },
        { cmd: 'cox sessions --grep "parse_args"' },
        { cmd: "cox stats --day" },
      ],
    },
  },
  {
    id: "editor", label: "Editor", sub: "cox acp",
    demo: {
      title: "cox — editor & agents",
      caption: "From the cox README: cox acp serves Zed and JetBrains over the Agent Client Protocol; cox mcp serves the built-in tools to other agents (read-only unless you opt in).",
      steps: [
        { cmd: "cox acp", note: "# Zed and JetBrains, over the Agent Client Protocol" },
        { cmd: "cox mcp --allow-write", note: "# built-in tools for other agents; read-only unless you opt in" },
      ],
    },
  },
];
