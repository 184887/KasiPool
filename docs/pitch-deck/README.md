# KasiPool pitch deck

Source files for the KasiPool pitch deck (UCT MakersForge VentureVerse, October 2026).

Live deck: https://claude.ai/artifact/CRS48Pa63stPLB923EzBzc (private until shared from its Share menu)

## Files

- `deck.json` – deck title, slide order, sections and fonts
- `slides/<id>.html` – one slide each, in the order listed in `deck.json`:
  cover, problem, heard, insight, solution, pooling, model, competition, gtm, risks, funds, ask

Each slide is a single `<section>` on a 1920×1080 canvas with inline styles.
The `<aside>` at the end of each slide holds the speaker notes.

## Editing text

Change the words between the tags and leave the `style="…"` attributes alone.
Placeholders still to fill in: `[__%]` (model), `[Langa / __]` and `[contact email] · [phone]` (ask), and the total, four amounts and time period (funds).
