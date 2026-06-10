import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  // jsdom v22+ (Jest 30) no longer allows delete+reassign of window.location.
  // Use window.history.pushState to change the URL instead.
  window.history.pushState(
    {},
    '',
    '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux'
  );

  expect(isThirdPartyLogin()).toBe(true);

  // Restore original URL
  window.history.pushState({}, '', '/');
});
