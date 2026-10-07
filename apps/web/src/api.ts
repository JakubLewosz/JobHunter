let csrf = '';
export async function api<T = any>(
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Nie udało się wykonać operacji.');
  return data;
}
export async function initialize() {
  const token = new URLSearchParams(location.hash.slice(1)).get('access');
  const session = token ? await api('session', { token }) : await api('session');
  csrf = session.csrf;
  if (token) history.replaceState(null, '', location.pathname);
}
