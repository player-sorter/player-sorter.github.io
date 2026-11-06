# Squad Sorter

Rank your favorite players from your favorite clubs and national teams.


## Folder layout

```
index.html
version.json                    bump together with SITE_VERSION in index.html on every push
css/style.css
js/sorter.js                    ranking engine (merge sort with ties and undo, weighted scores)
js/chart.js                     score curve on the results page (data, layout and SVG) and score ladder layout
js/app.js                       screens, theming, saving progress
data/manifest.js                tabs, leagues/tournaments and which squads appear
data/teams/<tab>/<group>/<id>.js
assets/teams/<tab>/<group>/<id>/crest.png
assets/teams/<tab>/<group>/<id>/players/<player-id>.webp
tools/optimize_photos.py        shrinks and converts photos before you commit them
```

`<tab>` is a section id from the manifest (`clubs`, `womens`, `nts`) and `<group>` is a league or tournament id (`laliga`, `world-cup`). Example: `data/teams/clubs/laliga/atletico-madrid.js`.

The folder only tells the site where to find a file. Links and saved rankings use the squad id alone (`#/atletico-madrid`), so ids must be unique across the whole site, and moving a squad to another group never breaks anything as long as the id stays the same.


## Adding images

Images are optional. Anything missing falls back to a club-coloured badge.

- Crest: `assets/teams/<tab>/<group>/<id>/crest.png` (.svg or .webp also work)
- Player photo: `assets/teams/<tab>/<group>/<id>/players/<player-id>.webp`, where `<player-id>` is the `id` in the team file. Keep names lowercase.

Before committing new photos, run:

```
pip install pillow
python tools/optimize_photos.py
```

Photos with a plain (white) background can be cut out automatically first:

```
pip install "rembg[cpu]" numpy
python tools/remove_backgrounds.py --dry-run
python tools/remove_backgrounds.py
```

The dry run lists which photos still have a solid background. The real run cuts out the player, cleans the white fringe off the edges and saves a transparent .webp in place of the original, copying originals to `bg-backup/` (ignored by git) first. The first run downloads the cut-out model (about 170 MB) once. Use `--only-jpg` to limit it to .jpg files.

`optimize_photos.py` then converts any .jpg/.png/.webp in a `players` folder to a 512px .webp (about 25 KB instead of 100+ KB) and shrinks crests to 256px. Files that are already optimised are skipped, so it is safe to run every time.


## Adding a squad

1. Copy an existing team file into `data/teams/<tab>/<group>/<new-id>.js` and edit the id, names, colours and players.
2. Add `"<new-id>"` to that group's `teams` list in `data/manifest.js`. Teams after `//` stay hidden.
3. Drop images into `assets/teams/<tab>/<group>/<new-id>/` and run the optimiser.

Each group shows its first 5 squads on the home page, with a "See all" button when there are more (change `showFirst` in the manifest). A tab with no visible squads shows "Coming soon"; to hide a tab completely, remove or comment out its block in the manifest.


## Colour modes (kits)

Each club file has a `kits` block with `home`, `away` and `third`. Each kit sets the page colours (`paper`, `card`, `ink`, `muted`, `primary`, `accent` and the text colours on top of them), the exported image header (`header`, `onHeader`, `headerBand`), and a `pattern` used for player badges:

- `stripes`: vertical stripes (`base` plus one band colour)
- `pinstripe`: thin vertical lines
- `hoops`: horizontal bands (can alternate several colours)
- `bolts`: plain `base` with two thin lightning-bolt stripes near the edges
- `gradient`: `base` fading top to bottom into the band colour
- `split`: `base` on the left, band colour on the right, divided by a vertical zigzag
- `sleeves`: `base` body with band-coloured shoulders and sleeves (Arsenal home)
- `zigzag`: horizontal zigzag lines across `base`, cycling through the band colours
- `tipping`: plain `base` with two thin horizontal stripes near the top, like collar tipping (Bayern away)
- `solid`: plain `base` colour

Text sitting directly on the page background uses `onPaper`, `onPaperMuted` and `paperPrimary` / `paperOnPrimary` (for buttons and highlights). Set `dark: true` (and a light `line` colour) for dark kits. The club's card on the home page always uses its home kit (`paper`, `onPaper`, `onPaperMuted` and `pattern`). The visitor's choice is remembered per club.


## Sorting with weights

"Start sorting (with weights)" shows the same matchups as the normal mode, so it needs the same number of them. Instead of picking one player, the visitor drags a continuous bar from -5 to 5, saved with 2 decimals. The text above it changes by ranges, from "slightly better" to "far better", and the shape below grows with the difference. The screen shows no numbers while voting, so points don't influence the answer. A small zone around the centre (`WEIGHT_TIE_ZONE` in `js/app.js`) snaps to 0 and counts as a tie.

The side of the bar decides the ranking through the usual merge sort. The level is saved in `state.weights` and adds a score to the results page:

1. Each level stands for a target Elo gap. `LEVEL_GAPS` in `js/sorter.js` sets 50, 120, 200, 300 and 400 points for levels 1 to 5, and `levelGap` interpolates the levels in between.
2. `fitExtraGaps` works like a hard-margin ranking SVM. Every winner must end at least 1 point above their loser, and within that limit it finds the scores with the smallest Elo error across all answers. Tied players share a score.
3. Neighbouring positions always met in a matchup, so different positions never show the same score.
4. `toScoreScale` centres the scores on 500. If they don't fit between 0 and 1000, it shrinks only the part of each gap above the minimum.

The results page also draws the scores as a curve (`js/chart.js`), with the drops that stand out marked in points. `ScoreChart.layout` returns the chart in pixels without touching the page, so other renderers can reuse it.

`ScoreChart.ladder` places the score ladder the same way. The vertical scale runs from the highest score to the lowest, and the centre of each circle sits exactly on its score. A circle that would overlap another moves sideways only, and the radius is the largest that fits the width.

Weighted rankings count towards community stats like any other ranking, but the scores themselves aren't sent.

The Share window exports the scores in four ways. Every list image shows each player's points, "Score curve" under Show draws the curve as an image, "Score ladder" draws one circle per player with their number and name, and "Download CSV" saves rank, player, position, number and score with 2 decimals. In-app browsers block file downloads, so the button there is "Copy CSV" and copies the same text.


## Share images

The results page has a Share button that builds a PNG (story 9:16 or post 4:5; top 3, top 10 or full squad).

- Download image saves the PNG.
- Instagram story and Post on X open the phone's share sheet with the image attached. On a computer they download the image instead (X also opens a pre-written post).

Weighted rankings also get the score exports described in "Sorting with weights".


## Releasing an update

Browsers (especially in-app ones like X's) keep old copies of the site. Every time you push, bump the number in both `window.SITE_VERSION` (top of `index.html`) and `version.json`, keeping them identical. A new number makes every script, stylesheet and team file load fresh, and visitors with an old cached page are reloaded once onto the new version.


## Requests (Google Sheet)

Visitors can request a new squad (home page) or report a missing player (squad page before sorting, and under the final ranking). Each request becomes a row in a Google Sheet you own. The buttons only appear once `requestsUrl` is set in `data/manifest.js`.


## Community stats

Every finished full-squad ranking is sent anonymously to the same Apps Script as requests and saved in a "Rankings" tab (one row per device per squad; sorting again replaces that row). Rankings made with a position filter are not sent. Finished rankings already saved in someone's browser are sent the next time they visit.

Each squad gets a stats page at `#/<squad-id>/stats`, linked from the squad page ("Community ranking") and the results page. It shows fan favourite, top 3 regular, most divisive, usually last, most often top 3 / bottom 3, where your ranking differs most from everyone else's, and the community's top 10. Until a squad has 20 rankings the page shows a progress bar instead.

Stats are recalculated at most every 15 minutes (`STATS_CACHE_SECONDS` in the script) and unlock at `STATS_MIN` (20). Stats use `requestsUrl` unless you set a separate `statsUrl` in the manifest.