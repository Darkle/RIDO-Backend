- To run the sonar test, grab a key from https://sonarcloud.io/account/security and add it as a `SONAR_TOKEN` env varibale

- Trying to somewhat follow the services architecture approach in a monorepo. We want things (especially the services) to be somewhat loosely coupled. Each app/service is in its own folder in the monorepo root folder.

- Dont update the `execa` package as the newer versions have no commonjs version

- you need to use [pnpm](https://pnpm.io/) instead of npm as there are a fair few pnpm specific things in the repo

- If you ever want to change the format/compression of the images downloaded in bulk, install [sharp-cli](https://github.com/vseventer/sharp-cli), then run something like this: `find . -name "*.avif" -execdir bash -c 'file="{}"; sharp -i "$file" -o "$PWD" --format webp' \;`

- If you need to use the prisma cli, run `pnpm run load-env-cli <prisma command here>`. `pnpm run load-env-cli` loads the env vars so that they are available on the command line. We dont use `&&` as that would lose all the env vars for the next command. dotenv-extended can call other processes, which is what `pnpm run load-env-cli` is running.

- Postgres notes:
  - Setting up for dev:
    1. Download and install Postgres: https://www.postgresql.org/download/
    2. After istalled, run `sudo -u postgres createuser --superuser $USER`
    3. Then run `createdb rido`
    4. Then run `psql rido`
    5. In the psql repl, run `CREATE USER rido PASSWORD 'rido'; ALTER USER rido WITH SUPERUSER;` ([prisma requires user to be superuser](https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database#shadow-database-user-permissions))
  - Using postgres 15.1
