module.exports = {
  files: ['./**/*.test.ts'],
  require: ['@swc-node/register', './pre-boot.cjs'],
  extensions: ['ts'],
  failFast: true,
  environmentVariables: { DONT_START_RPC_SERVER: 'true' },
}
