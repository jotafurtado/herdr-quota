# Independent maintenance

Decision recorded on 2026-11-01.

## Direction

Agent Quota ([jotafurtado/herdr-quota](https://github.com/jotafurtado/herdr-quota)) is maintained independently
by jotafurtado as a focused quota mod for Herdr.

The original author moved development into [Lakris2407/herdr-mods](https://github.com/Lakris2407/herdr-mods),
a collection that also includes runners, delivery statistics, system load and interface controls.
This fork keeps a narrower direction: model and provider limits, usage, reset times and the
preferences needed to show that information clearly.

This decision concerns this fork only. It does not claim ownership of the original project,
the Herdr application, quota-axi or the upstream collection, and does not imply endorsement
by their authors. GitHub may continue to display this repository as a fork.

## Scope

- Maintain quota fetching, normalization, display and preferences.
- Review relevant upstream fixes individually, retaining their attribution and license notices.
- Keep additional dashboards, runner monitoring and system metrics outside the primary scope.
- Preserve the existing optional `mods/system` files and their history for compatibility.
  They remain macOS-only; this decision does not add Windows or Linux system metrics.
- Describe platform support according to what has actually been implemented and verified.

## Current code and publication

This documentation commit does not import feature branches, copy the maintainer's installed
personal mod into the repository, change runtime behavior or update a running Herdr instance.
The installed personal version and this repository's `main` still need to be reconciled before
advertising them as the same release. The Windows launcher and Antigravity filter branches
also need an explicit integration decision.

Community publication follows [PUBLISHING.md](PUBLISHING.md). Recording this decision does not
publish a release, change GitHub repository settings or submit the mod to a catalog.

## Attribution

Keep the original Git history and the Lakris2407 copyright notice. Retain contributor credits
when incorporating changes. The fork remains under MIT; see [LICENSE](LICENSE) and
[CREDITS.md](CREDITS.md).
