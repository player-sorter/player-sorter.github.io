# Squad Sorter

Rank your favorite players from your favorite clubs and national teams.


## Folder layout

```
index.html
version.json                    bump together with SITE_VERSION in index.html on every push
css/style.css
js/sorter.js                    ranking engine (merge sort with ties and undo)
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

Squad pages on the club's own site usually already include a portrait per player (on Monaco they are the `*_effectif.png` files). To pull those in and name them after the ids in the squad file:

```
python tools/download_photos.py "https://www.asmonaco.com/en/pros/players" --team monaco --dry-run
python tools/download_photos.py "https://www.asmonaco.com/en/pros/players" --team monaco
```

`--team` is a squad id or a path to the team file. Photos land in that squad's `players` folder, and the club logo is saved next to it as `crest.png`. Use `--out some/folder` before the team file exists; files are then named from the player name on the site. Cut out the backgrounds before optimising, and leave the World Cup photos alone:

```
python tools/remove_backgrounds.py --skip wcs
python tools/optimize_photos.py
```

A site that draws the squad entirely with JavaScript, with no portraits in the page HTML, cannot be read this way.


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
- `fade`: `base` on the left half, softly blending into the band colour on the right (Cagliari's home-page card); set `range: [from, to]` (fractions of the width) to control where the blend happens
- `split`: `base` on the left, band colour on the right, divided by a vertical zigzag
- `sleeves`: `base` body with band-coloured shoulders and sleeves (Arsenal home)
- `zigzag`: horizontal zigzag lines across `base`, cycling through the band colours
- `tipping`: plain `base` with two thin horizontal stripes near the top, like collar tipping (Bayern away)
- `lightning`: SVG lightning bolt of the band colour at the right edge of `base` (Rayo Vallecano)
- `dots`: vector halftone dots in the band colour on `base`, small at the bottom-left and large at the top-right (Orlando City home)
- `triangles`: faint embossed triangle texture in the band colour that fades toward the bottom (Getafe)
- `cross`: Nordic cross on `base`, the first band colour as the wide cross and the second as the thin inner cross, set left of centre like the flag (Norway)
- `diamonds`: three coloured diamonds on top of `base` (Germany)
- `waves`: wavy lines in the band colour across `base` (Portugal home)
- `crosses`: thick vertical stripes in the first band colour with a fading lattice of plus signs (second band colour) growing toward the bottom (Leverkusen home)
- `pinlines`: thick vertical stripes cut by a thin line in the base colour, with a thin line in the stripe colour down the gap between stripes (Frankfurt home)
- `slashes`: dense steep diagonal lines in the first band colour on `base`, switching between thick and thin in diagonal zones (France home)
- `vee`: three chevron bands (first, second and third band colour from the top) pointing down with a white gap at the centre (Germany home)
- `lines`: any number of horizontal lines set with `lines: [[colour, from, to], ...]` (fractions of the height) on `base`; add `fade: true` to fade them out toward the right (Brazil home, Dortmund home)
- `scatter`: thin slashes at assorted angles (first band colour) and soft translucent triangles (second band colour), none touching, scattered over `base` on a grid of tiny vector dots (`dots` sets their colour) (Liverpool home)
- `ornament`: delicate tone-on-tone line work (nested diamonds, small knot motifs, dotted lines) in the first band colour on `base` (Fiorentina home)
- `raglan`: a white band with a checkered edge on both sides and a thick band in the second band colour either side, on `base`; it sits at the right end of the card like a sleeve (Arsenal home)
- `streaks`: fine parallel lines in the first band colour sweeping through the card in a big S curve, broken into runs so they stay faint (Villarreal home)
- `swell`: wide rolling bands in the first band colour with a darker shadow edge (second band colour) under each one, on `base` (USA home)
- `stars`: upright five-point stars, all the same size, on a regular staggered grid in the first band colour on `base` (USA away)
- `shards`: blocky "bento" shards (mixed-size dark blocks, some cut diagonally) across `base`, with sleeve panels in the first band colour at both ends and the second band colour for the shards (West Ham home)
- `burst`: radial rays fanning out from the upper right, wide wedges in the first band colour and thin streaks in the second (New England Revolution home)
- `thick-waves`: bold wavy stripes in the first band colour across `base` (USA home)
- `chevron`: a chevron in the band colour across `base` (Portugal away)
- `checks`: checkerboard of `base` and the band colour (Fulham away)
- `sash`: a diagonal band across `base` in the band colour (River Plate, Rayo Vallecano home)
- `band`: one horizontal band across the chest; a second band colour fills its centre (Boca Juniors)
- `solid`: plain `base` colour

A kit can set `photoBg` to colour behind player photos (defaults to `accent`) and `photoInk` for the shirt number shown when a photo is missing (defaults to `onAccent`). `labelBg` colours the name label under the photo on the voting cards (defaults to `card`). A kit can also set `headerDecor: { type: "collar", color, opacity }` to draw an extra decoration in the share image header, to the right of the title (Uruguay away uses the collar panels). `paperBg` takes any CSS background (for example a gradient) and paints it behind the squad pages instead of the flat `paper` colour; keep `paper` set to a matching solid colour (both Ballon d'Or kits use this). `cardBorder` draws a thin outline in that colour around the cards, roster tiles and result rows (the Ballon d'Or Black kit uses a soft gold). `metal` is a list of colours that gives the squad title, main buttons, VS badge and share-image title a metallic gradient (the Ballon d'Or Black kit uses gold).

A team can set `tile.name` (use `
` for a line break) to change how its name is written on its home-page card (Dortmund puts "Dortmund" under "Borussia"). A team can set `photoFit: "contain"` when its player photos are cut-outs that should sit fully inside the voting card instead of filling it (Deportivo uses this). A team can set `squadLabel` and `memberLabel` to replace the words "squad" and "players" (the Ballon d'Or lists use "nominees"), and players without a shirt `number` simply show no number. In the manifest, a section can set `tab` to a shorter name for its home-page tab.

A manifest group with `builder: true` (and no `teams`) shows the "Build your own ranking" tile instead of squads; it currently sits first in Specials. The builder lives at `#/build-your-own`. People search every player on the site and pick 5 to 25, choose Neutral or any squad's colours, and sort them like a normal squad. Each player appears once: their newest club squad wins, then their national team, then Specials lists, matched by name plus nationality (the club's `nation` code, or the national team's `monogram`). Photos and crests always come from that player's own squad. Custom lists never count towards community rankings. "Share list" makes a link like `?list=atletico-madrid:alvarez.arsenal:saka&n=Name&c=arsenal` that loads the same list for someone else.

Text sitting directly on the page background uses `onPaper`, `onPaperMuted` and `paperPrimary` / `paperOnPrimary` (for buttons and highlights). Set `dark: true` (and a light `line` colour) for dark kits. The club's card on the home page always uses its home kit (`paper`, `onPaper`, `onPaperMuted` and `pattern`). The visitor's choice is remembered per club.


## Share images

The results page has a Share button that builds a PNG (story 9:16 or post 4:5; top 3, top 10 or full squad).

- Download image saves the PNG.
- Instagram story and Post on X open the phone's share sheet with the image attached. On a computer they download the image instead (X also opens a pre-written post).


## Checking banners (developer tool)

`tools/banners.html` draws the share-image header ("banner") of every squad in every kit with the same code the site uses, so you can check a new kit without sorting a whole squad. Serve the repo root and open it:

```
python -m http.server 8000
# then open http://localhost:8000/tools/banners.html
```

Pick a section and a banner shape at the top; banners render as you scroll. `?format=post` and `?only=new` preselect options. The page is excluded from the published site by `_config.yml` (GitHub Pages builds with Jekyll); it only lives in the repository.


## Releasing an update

Browsers (especially in-app ones like X's) keep old copies of the site. Every time you push, bump the number in both `window.SITE_VERSION` (top of `index.html`) and `version.json`, keeping them identical. A new number makes every script, stylesheet and team file load fresh, and visitors with an old cached page are reloaded once onto the new version.


## Requests (Google Sheet)

Visitors can request a new squad (home page) or report a missing player (squad page before sorting, and under the final ranking). Each request becomes a row in a Google Sheet you own. The buttons only appear once `requestsUrl` is set in `data/manifest.js`.


## Community stats

Every finished full-squad ranking is sent anonymously to the same Apps Script as requests and saved in a "Rankings" tab (one row per device per squad; sorting again replaces that row). Rankings made with a position filter are not sent. Finished rankings already saved in someone's browser are sent the next time they visit.

Each squad gets a stats page at `#/<squad-id>/stats`, linked from the squad page ("Community ranking") and the results page. It shows fan favourite, top 3 regular, most divisive, usually last, most often top 3 / bottom 3, where your ranking differs most from everyone else's, and the community's top 10. Until a squad has 20 rankings the page shows a progress bar instead.

Stats are recalculated at most every 15 minutes (`STATS_CACHE_SECONDS` in the script) and unlock at `STATS_MIN` (20). Stats use `requestsUrl` unless you set a separate `statsUrl` in the manifest.