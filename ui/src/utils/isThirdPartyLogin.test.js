import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);
});
