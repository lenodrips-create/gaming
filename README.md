# Cartridge Club

A neon browser-arcade shell built with plain HTML, CSS and JavaScript. No build step,
no dependencies, no server. Open `index.html` and it runs.

The games are yours to add — the shell ships empty on purpose.

## Structure

```
my-game-website/
├── index.html          Homepage: hero, marquee, game grid
├── pages/
│   ├── game.html       Arcade — plays a game in a frame
│   ├── about.html      Folder map + how to add a game
│   └── contact.html    Validated contact form (no server)
├── css/
│   ├── style.css       Tokens, header, hero, cards, forms, footer
│   └── game.css        Arcade player + the game shell you'll reuse
├── js/
│   ├── games.js        THE REGISTRY — add your games here
│   ├── main.js         Nav, grid rendering, form, hero animation
│   └── game.js         GameKit: loop, sound, scores, input
├── images/             logo, favicon, placeholder thumbnail
├── sounds/             optional audio (see sounds/README.md)
└── games/              one folder per game (empty for now)
```

## Add a game

1. Create `games/your-game/index.html` + `game.js` + `assets/`.
2. Load `../../js/game.js` before your own `game.js`.
3. Add one object to `window.CC_GAMES` in `js/games.js`.

The homepage grid and the arcade picker both build themselves from that array, so
there is nothing else to wire up. Full snippets are on the About page.

## Run it

Double-click `index.html`, or serve the folder if you later add audio files:

```bash
python3 -m http.server 8000
```
