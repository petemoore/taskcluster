describe('exchangesList', () => {
  beforeAll(() => {
    window.fetch = jest.fn().mockImplementation(url => {
      return {
        json: () =>
          Promise.resolve({
            $id: url,
            exchangePrefix: url.replace('.json', '/'),
            entries: [
              {
                exchange: 'exchange1',
              },
            ],
          }),
      };
    });
  });

  it('should return list of entries', async () => {
    const fetchList = require('./exchangesList').default; // eslint-disable-line global-require

    const exchanges = await fetchList();

    expect(exchanges).toBeDefined();
    // Use exact equality via Array.some() rather than String.prototype.includes()
    // to make the intent clear and avoid the js/incomplete-url-substring-sanitization
    // code-scanning warning about URL substring checks.
    expect(
      exchanges.some(
        e => e === 'https://taskcluster.net/references/auth/v1/exchanges/exchange1',
      )
    ).toBe(true);
    expect(window.fetch).toHaveBeenCalled();
  });
});
