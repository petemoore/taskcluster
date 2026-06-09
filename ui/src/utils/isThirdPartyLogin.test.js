import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  const assignMock = jest.fn();

  // jsdom 16+ / Jest 28+ no longer allows deleting window.location.
  // Use Object.defineProperty to replace it with a mock.
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      assign: assignMock,
      search: '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux',
    },
  });

  expect(isThirdPartyLogin()).toBe(true);
});
