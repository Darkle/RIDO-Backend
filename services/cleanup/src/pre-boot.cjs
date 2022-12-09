require('dotenv-extended').load({
  // only two levels up as the cwd is the dir the process started in
  path: '../../.env',
  defaults: '../../.env.defaults',
  schema: '../../.env.schema',
  errorOnMissing: true,
  errorOnRegex: true,
  assignToProcessEnv: true,
})
