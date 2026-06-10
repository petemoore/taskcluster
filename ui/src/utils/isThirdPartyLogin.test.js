import isThirdPartyLogin from './isThirdPartyLogin';

it('is third-party login', () => {
  expect(isThirdPartyLogin()).toBe(false);

  const assignMock = jest.fn();

  Object.defineProperty(window, 'location', {
    value: {
      assign: assignMock,
      search: '?client_id=foo&response_type=bar&scope=baz&redirect_uri=qux',
    },
    writable: true,
    configurable: true,
  });

  expect(isThirdPartyLogin()).toBe(true);
});
