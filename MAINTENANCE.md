# Independent maintenance

Decision recorded on 2026-11-01.

## Direction

Agent Quota ([jotafurtado/herdr-quota](https://github.com/jotafurtado/herdr-quota)) is maintained independently
by jotafurtado as a focused quota mod for Herdr.

The original author moved development into [Lakris2407/herdr-mods](https://github.com/Lakris2407/herdr-mods),
a broader collection of mods.
This fork keeps a narrower direction: model and provider limits, usage, reset times and the
preferences needed to show that information clearly.

This decision concerns this fork only. It does not claim ownership of the original project,
the Herdr application, quota-axi or the upstream collection, and does not imply endorsement
by their authors. On 2026-11-04 the repository was detached from GitHub's fork network to
allow catalog discovery; its Git history and attribution were preserved.

## Scope

- Maintain quota fetching, normalization, display and preferences.
- Review relevant upstream fixes individually, retaining their attribution and license notices.
- Distribute only quota-related code, documentation and assets. Unrelated modules and inherited
  preview images were removed from the current tree on 2026-11-03; their history is preserved.
- Describe platform support according to what has actually been implemented and verified.

## Current code and publication

The repository source now includes the Usage and Display interface, the Windows npm launcher,
percentage normalization, Antigravity filtering and percentage-only display. The screenshots
are generated from this source in an isolated Herdr profile with illustrative quota data.
Personal terminal content, account identifiers and local executable paths are not included.

Community publication follows [PUBLISHING.md](PUBLISHING.md). Recording this decision does not
publish a release, change GitHub repository settings or submit the mod to a catalog.

## Attribution

Keep the original Git history and the Lakris2407 copyright notice. Retain contributor credits
when incorporating changes. The fork remains under MIT; see [LICENSE](LICENSE) and
[CREDITS.md](CREDITS.md).
