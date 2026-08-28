# ME**L**B**L**E

Play the Melble game here: https://melble.azzola.dev!

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

## Resources used:

- Suburb list: https://www.jetpunk.com/user-quizzes/150455/melbourne-suburbs/stats
- Coordinates: Google Geocoding API
- Emojis & World icon => https://github.com/twitter/twemoji
