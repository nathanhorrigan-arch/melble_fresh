# ME**L**BU**R**B

Play MelBurb here: <https://nathanhorrigan-arch.github.io/melble_fresh/>.

## Development

Development requires Node.js 24 LTS.

Install dependencies and start the local development server:

```sh
npm ci
npm start
```

Before submitting a change, run the same baseline checks used for the
application:

```sh
npm run typecheck
npm run test:ci
npm run build
```

## Publishing

The website is published with GitHub Pages at
<https://nathanhorrigan-arch.github.io/melble_fresh/>.

When a change is merged into `main`, GitHub Actions checks the code, builds the
production website, and publishes it automatically. GitHub Pages must use
**GitHub Actions** as its publishing source in the repository settings.

## Gameplay

- **Daily** gives every player the same suburb each day.
- **Practice** offers repeatable games that do not replace the daily puzzle.
- Correct answers score 100 points. Unsolved games score 75 points within 250
  metres, 50 within 500 metres, or 25 within one kilometre.
- Barista clues cost 10 points each.
- Player names, points, close calls, and achievements are currently stored on
  the player's device.

Secure accounts and cross-device progress require a hosted authentication and
database service. The local player-progress model is intentionally separated so
it can be connected to that service without changing the scoring rules.

## Resources used:

- Suburb list: https://www.jetpunk.com/user-quizzes/150455/melbourne-suburbs/stats
- Coordinates: Google Geocoding API
- Emojis & World icon => https://github.com/twitter/twemoji
