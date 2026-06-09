---
level: patch
---
Upgraded `babel-jest` from 26.6.3 to 30.4.1 in the UI package, along with compatible
upgrades to `jest` (26→30) and addition of `jest-environment-jsdom` (now required
separately since Jest 27). Updated `jest.useFakeTimers()` call to remove the
deprecated `'modern'` argument removed in Jest 29.
