import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  // jsdom v22 (jest 30) makes window.location non-configurable, so we cannot
  // replace or redefine it.  Use history.pushState to change the URL instead:
  // jsdom implements pushState natively and it updates window.location.search
  // without touching the property descriptor.
  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);
});
