// Deliberately excludes messages, threads, history, settings writes and revocation.
export function identityOnlyRequest(
  request: typeof fetch,
  trace: { endpoint: string; method: string; status: number }[] = [],
): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    const endpoint = url.origin + url.pathname,
      method = (init?.method ?? 'GET').toUpperCase();
    if (!(
      (method === 'GET' &&
        [
          'https://openidconnect.googleapis.com/v1/userinfo',
          'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        ].includes(endpoint)) ||
      (method === 'POST' && endpoint === 'https://oauth2.googleapis.com/token')
    ))
      throw new Error('IDENTITY_ENDPOINT_DENIED');
    const response = await request(input, init);
    trace.push({ endpoint, method, status: response.status });
    return response;
  };
}
