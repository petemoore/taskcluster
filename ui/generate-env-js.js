const { dirname } = require('path');
const fs = require('fs');

const ENV_VARS = [
  {name: 'APPLICATION_NAME', defaultValue: 'Taskcluster', json: false},
  {name: 'TASKCLUSTER_ROOT_URL', defaultValue: 'https://tc.example.com', json: false},
  {name: 'GRAPHQL_ENDPOINT', defaultValue: '/graphql', json: false},
  {name: 'GRAPHQL_SUBSCRIPTION_ENDPOINT', defaultValue: '/subscription', json: false},
  {name: 'DOCS_ONLY', defaultValue: false, json: false},
  {name: 'UI_LOGIN_STRATEGY_NAMES', defaultValue: '', json: false},
  {name: 'GA_TRACKING_ID', defaultValue: '', json: false},
  {name: 'SENTRY_DSN', defaultValue: '', json: false},
  {name: 'BANNER_MESSAGE', defaultValue: '', json: false},
  {name: 'SITE_SPECIFIC', defaultValue: {}, json: true},
];

/**
 * Generate `env.js` in the static directory based on the current
 * environment variables.
 *
 * The file is serialised with JSON.stringify so that all special characters
 * (newlines, quotes, etc.) are safely escaped.  src/static/env.js is excluded
 * from biome's format checker (see biome.json overrides) because it is a
 * generated file, not hand-written source.
 */
const generateEnvJs = filename => {
  const env = {};
  for (const {name, defaultValue, json} of ENV_VARS) {
    if (process.env[name]) {
      env[name] = json ? JSON.parse(process.env[name]) : process.env[name];
    } else {
      env[name] = defaultValue;
    }
  }
  const envJs = `window.env = ${JSON.stringify(env, null, 2)}`;

  const dir = dirname(filename);
  // Use { recursive: true } so mkdir is idempotent and there is no
  // check-then-act (TOCTOU) race between existsSync and mkdirSync.
  fs.mkdirSync(dir, { recursive: true });

  // Use the 'wx' flag (exclusive create) so the write is atomic: the file is
  // only created if it does not yet exist, eliminating the TOCTOU race that
  // a prior existsSync check would introduce.
  try {
    fs.writeFileSync(filename, envJs, { flag: 'wx', encoding: 'utf8' });
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
    // File already exists — skip, preserving the original "write once" behaviour.
  }
};

module.exports = generateEnvJs

if (require.main === module) {
  generateEnvJs(process.argv[2]);
}
