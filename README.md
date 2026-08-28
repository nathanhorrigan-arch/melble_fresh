# ME**L**B**L**E

Play the Melble game here: https://melble.azzola.dev!

## Development

Melble is tested with Node.js 20 and npm. Install the locked dependency tree and
start the local development server with:

```sh
npm ci
npm start
```

The application is then available at <http://localhost:3000>. The following
commands provide the same validation used in continuous integration:

```sh
npm run test:ci
npm run build
```

`npm run test:ci` runs the test suite once, while `npm run build` creates an
optimized production bundle in `build/`.

## Resources used:

- Suburb list: https://www.jetpunk.com/user-quizzes/150455/melbourne-suburbs/stats
- Coordinates: Google Geocoding API
- Emojis & World icon => https://github.com/twitter/twemoji
