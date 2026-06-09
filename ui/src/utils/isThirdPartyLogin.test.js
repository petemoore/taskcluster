import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  const assignMock = jest.fn();

  // In modern jsdom (used by jest-environment-jsdom 28+), window.location
  // is non-configurable and cannot be deleted/reassigned directly.
  // Use Object.defineProperty instead.
  Object.defineProperty(window, 'location', {
    value: {
      assign: assignMock,
      search: '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux',
    },
    configurable: true,
    writable: true,
  });

  expect(isThirdPartyLogin()).toBe(true);
});
