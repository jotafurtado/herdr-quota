# Sharing on Herdr Mods

Official instructions: [herdr.dev/mods, Share yours](https://herdr.dev/mods/#share-yours).
Requirements checked on 2026-11-01; recheck the page before publishing.

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
belong in the recipe and README. A repository may contain several mod packages, but the primary
package here is quota. `mods/system` is a retained optional macOS mod, not a requirement.

The site says eligible mods appear under Community within an hour and that preview images are
screened. It does not document whether forks are eligible or guarantee a listing for a
particular repository. Do not assume a fork will be indexed automatically.

## Before publishing this fork

- Reconcile the personal installed quota mod with `main`. Review and integrate the Windows
  launcher, percentage normalization and Antigravity preferences as appropriate. Do not
  advertise local-only features as available from this repository.
- Update `README.md` and `RECIPE.md` to match the code users will actually install, including
  commands run, dependencies, saved state, supported platforms and limitations.
- Replace the inherited `preview.png` with a representative quota-only screenshot of this
  fork. Exclude private terminal text, account identifiers and unrelated application content.
  Keep original attribution for any inherited assets that remain.
- Validate the relevant tests and run `herdr-app check mods/quota`. Check the strip and popup
  in Herdr; the initial-render check does not verify asynchronous data fetching or all UI states.
- Preserve `LICENSE` and `CREDITS.md` and review any newly included third-party assets.
- Publish the reviewed commit to the public repository and add the topic `herdr-mod`.
  Those are separate publication actions, not part of the maintenance-decision commit.

## GitHub commands for publication

Run these only after the code and screenshot are ready and publication is authorized:

```sh
git push origin main
gh repo edit jotafurtado/herdr-quota --add-topic herdr-mod
```

Then check the Community section of [Herdr Mods](https://herdr.dev/mods/) after the stated
indexing window. If it does not appear, ask the Herdr maintainers through their linked GitHub
or Discord whether fork discovery is supported. Keep the existing history and attribution;
detaching the fork or moving to a new repository is not necessary just to record independent
maintenance and should be a separate decision if the catalog requires it.

## Description for a future listing

Agent Quota is an independently maintained fork focused on model and provider quotas, usage
limits and reset times in Herdr. Based on Lakris2407's original mod, with quota data supplied
by quota-axi. See the README for the features and platform support available in this version.
