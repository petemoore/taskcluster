import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  // jsdom 22 (bundled with jest 30) makes `window.location` a
  // non-configurable accessor, so it can no longer be replaced via `delete` +
  // assignment (assigning to it triggers an unimplemented navigation). Update
  // the query string through the history API instead, which jsdom supports and
  // which is reflected in `window.location.search`.
  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);
});
