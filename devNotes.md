- To run the sonar test, grab a key from https://sonarcloud.io/account/security and add it as a `SONAR_TOKEN` env varibale

- Trying to somewhat follow the services architecture approach in a monorepo. We want things (especially the services) to be somewhat loosely coupled. Each app/service is in its own folder in the monorepo root folder.

- Dont update the `execa` package as the newer versions have no commonjs version

- you need to use [pnpm](https://pnpm.io/) instead of npm as there are a fair few pnpm specific things in the repo

- If you ever want to change the format/compression of the images downloaded in bulk, install [sharp-cli](https://github.com/vseventer/sharp-cli), then run something like this: `find . -name "*.avif" -execdir bash -c 'file="{}"; sharp -i "$file" -o "$PWD" --format webp' \;`

- Had to use esbuild in api service instead of swc cause swc doesnt support decorators yet

- On a fresh setup for development, to set up the db, do the following in the services/api directory:
  1. Run `dotenv-extended --path=../../.env --defaults=../../.env.defaults edgedb project init --non-interactive`
  2. Run `edgedb migration create`
  3. Run `edgedb migrate`
  4. Run `npx @edgedb/generate interfaces` (pnpx or pnpm exec doesnt seem to work)
  5. Run `npx @edgedb/generate edgeql-js`
