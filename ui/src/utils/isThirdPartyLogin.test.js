import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  // jsdom (Jest 30) makes window.location non-configurable, so the old
  // `delete window.location; window.location = {...}` pattern no longer
  // replaces it and instead triggers a "navigation not implemented" error.
  // Use history.pushState to set the query string on the real location object
  // (it updates the URL without navigating).
  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);
});
