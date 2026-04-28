# Global Ledger Steward package

This active package converts the original Global Ledger implementation outline into a runnable steward configuration.

Files:

- `AGENTS.md` — human/agent-readable operating instructions.
- `global_ledger_steward.config.json` — machine-readable configuration for app/runtime use.

Canonical repo path:

`LEDGERS/AGENTS/global_ledger_steward/`

Runtime app agent:

`CCAgentindex/agents/global_ledger_steward/`

Invocation:

`POST /api/agents/global_ledger_steward/run`

This is intentionally broad enough to remain implementation-neutral, while concrete enough to use in GitHub PRs, agent bootstraps, and the internal app agent registry.
