import React from "react"
React.useLayoutEffect = React.useEffect

const nodeCrypto = require('crypto');
// required for slugid test
window.crypto = {
  getRandomValues: function (buffer) {
    return nodeCrypto.randomFillSync(buffer);
  }
};

window.env = Object.assign({}, window.env, {
  TASKCLUSTER_ROOT_URL: 'https://taskcluster.net',
});


// Set up fake timer
// Jest 27+ removed the legacy string-argument form of useFakeTimers ('modern'
// is the default now); call it with no argument and chain setSystemTime.
jest.useFakeTimers().setSystemTime(new Date('2022-02-17 13:00:00').getTime());
