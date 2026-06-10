import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  // jsdom v14+ made window.location non-configurable so it cannot be replaced
  // via assignment or Object.defineProperty. Use history.pushState to update
  // window.location.search, which is the only property isThirdPartyLogin reads.
  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);
});
