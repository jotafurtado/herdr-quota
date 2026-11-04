# Sharing on Herdr Mods

Official instructions: [herdr.dev/mods, Share yours](https://herdr.dev/mods/#share-yours).
Requirements checked on 2026-11-04; recheck the page before publishing.

## Catalog requirements

Herdr asks for a public GitHub repository with the topic `herdr-mod` (singular).
Each mod package contains:

```text
mods/quota/
RECIPE.md
preview.png
keys.json       # optional keybinding snippet
```

Do not include a `layouts/` folder in the published package. Layout integration instructions
belong in the recipe and README. This repository distributes one mod: `mods/quota`.

The site says eligible mods appear under Community within an hour and that preview images are
screened.

The [live catalog index](https://assets.herdr.dev/mods/index.json), checked on 2026-11-04,
identifies its GitHub query as `topic:herdr-mod is:public`, without `fork:true`.
[GitHub excludes forks from repository searches by default](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories).
A fork would therefore not be discovered automatically by that query. This is an inference
from the published index metadata, not a documented Herdr fork policy.

On 2026-11-04 `jotafurtado/herdr-quota` was detached from the fork network by recreating it at
the same URL and mirroring the full Git history. It is public and no longer marked as a fork.
Attribution and licenses remain in [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE).

## Before publishing

- Keep `README.md` and `RECIPE.md` aligned with the code users will actually install, including
  commands run, dependencies, saved state, supported platforms and limitations.
- Refresh `preview.png` when the interface changes. Capture the
  current source in an isolated Herdr profile with clearly identified illustrative quota data.
  Exclude private terminal text, account identifiers and unrelated application content.
- Validate the relevant tests and run `herdr-app check mods/quota`. Check the strip and popup
  in Herdr; the initial-render check does not verify asynchronous data fetching or all UI states.
- Preserve `LICENSE` and `CREDITS.md` and review any newly included third-party assets.
- Publish the reviewed commit to the public repository and add the topic `herdr-mod`.

## GitHub commands for publication

Run these only after the code and screenshot are ready and publication is authorized:

```sh
git push origin main
gh repo edit jotafurtado/herdr-quota --add-topic herdr-mod
```

Then check the Community section of [Herdr Mods](https://herdr.dev/mods/) after the stated
indexing window. If it does not appear, ask the Herdr maintainers through their linked GitHub
or Discord.

## Description for a future listing

Agent Quota is an independently maintained mod focused on model and provider quotas, usage
limits and reset times in Herdr. Based on Lakris2407's original mod, with quota data supplied
by quota-axi. See the README for the features and platform support available in this version.
