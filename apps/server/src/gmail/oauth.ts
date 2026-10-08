import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import { DomainError } from '../util.js';

export const gmailSendScope = 'https://www.googleapis.com/auth/gmail.send';
export const gmailReadScope = 'https://www.googleapis.com/auth/gmail.readonly';
export const requestedScopes = ['openid', 'email', gmailSendScope];
const allowedScopes = new Set([
  ...requestedScopes,
  'https://www.googleapis.com/auth/userinfo.email',
]);
export interface SecretStore {
  get(): Promise<string | undefined>;
  set(value: string): Promise<void>;
  remove(): Promise<void>;
}
export async function nativeSecretStore(
  service = 'JobHunter.GmailPreparation',
): Promise<SecretStore> {
  // This module is instantiated only by the separate, explicit Gmail helper.
  const { AsyncEntry } = await import('@napi-rs/keyring');
  const entry = new AsyncEntry(service, 'oauth-v1');
  return {
    get: async () => (await entry.getPassword()) ?? undefined,
    set: (value) => entry.setPassword(value),
    remove: async () => {
      await entry.deletePassword();
    },
  };
}
const clientSchema = z.object({
  client_id: z
    .string()
    .min(8)
    .max(500)
    .regex(/\.apps\.googleusercontent\.com$/),
  client_secret: z.string().min(1).max(2000),
});
export type DesktopClient = z.infer<typeof clientSchema>;
export function desktopClient(raw: unknown): DesktopClient {
  try {
    return clientSchema.parse(z.object({ installed: clientSchema }).parse(raw).installed);
  } catch {
    throw new DomainError('OAUTH_CLIENT', 'Wybierz plik JSON klienta Google typu Desktop app.');
  }
}
export function loadDesktopClient(file: string, repository: string) {
  const path = realpathSync(resolve(file));
  const rel = relative(realpathSync(repository), path);
  if (!rel || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep)))
    throw new DomainError(
      'OAUTH_CLIENT_LOCATION',
      'Zapisz plik OAuth poza repozytorium JobHunter.',
    );
  const bytes = readFileSync(path);
  if (bytes.length > 65536)
    throw new DomainError('OAUTH_CLIENT', 'Plik konfiguracji jest zbyt duży.');
  try {
    return desktopClient(JSON.parse(bytes.toString('utf8')));
  } catch {
    throw new DomainError('OAUTH_CLIENT', 'Nieprawidłowy plik klienta OAuth Desktop app.');
  }
}
export interface AccountInfo {
  email: string;
  subject: string;
  connectedAt: string;
  scopes: string[];
}
const accountSchema = z.object({
  email: z.email(),
  subject: z.string().min(1),
  connectedAt: z.string(),
  scopes: z.array(z.string()),
});
const sessionSchema = z.object({
  client: clientSchema,
  refreshToken: z.string().min(1),
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  account: accountSchema,
});
export function setupInfo(dir: string): AccountInfo | null {
  try {
    return accountSchema.parse(JSON.parse(readFileSync(join(dir, 'account.json'), 'utf8')));
  } catch {
    return null;
  }
}
function saveInfo(dir: string, account: AccountInfo) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const temporary = join(dir, `account-${randomBytes(8).toString('hex')}.tmp`);
  writeFileSync(temporary, JSON.stringify(account), { mode: 0o600 });
  renameSync(temporary, join(dir, 'account.json'));
}
export async function googleJSON(url: string, init: RequestInit, request: typeof fetch) {
  try {
    const response = await request(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('GOOGLE_REJECTED');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('EMPTY_RESPONSE');
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.length;
        if (bytes > 65536) throw new Error('RESPONSE_LIMIT');
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new DomainError(
      'GOOGLE_AUTH',
      'Google nie potwierdził połączenia. Sprawdź konfigurację i zaloguj się ponownie.',
    );
  }
}
export function grantedScopes(scope: string, includeRead = false) {
  const scopes = scope.split(/\s+/).filter(Boolean);
  if (
    !scopes.includes(gmailSendScope) ||
    (includeRead && !scopes.includes(gmailReadScope)) ||
    scopes.some((s) => !allowedScopes.has(s) && !(includeRead && s === gmailReadScope))
  )
    throw new DomainError(
      'OAUTH_SCOPES',
      includeRead
        ? 'Zgoda Google musi obejmować tożsamość, wysyłkę i odczyt Gmail.'
        : 'Zgoda Google musi obejmować tylko tożsamość konta i wysyłkę Gmail.',
    );
  return scopes;
}
export async function connectGoogle(
  client: DesktopClient,
  vault: SecretStore,
  dir: string,
  openBrowser: (url: string) => Promise<void>,
  request: typeof fetch = fetch,
  timeoutMs = 300000,
  includeRead = false,
): Promise<AccountInfo> {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(32).toString('hex');
  let claimed = false;
  let expired = false;
  let redirect = '';
  let complete!: (value: AccountInfo) => void;
  let fail!: (reason: unknown) => void;
  const result = new Promise<AccountInfo>((yes, no) => {
    complete = yes;
    fail = no;
  });
  void result.catch(() => {});
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    let url: URL;
    try {
      url = new URL(req.url ?? '/', redirect || 'http://127.0.0.1');
    } catch {
      res.writeHead(400).end('Nieprawidlowy callback.');
      return;
    }
    const returnedState = url.searchParams.get('state') ?? '';
    if (
      req.method !== 'GET' ||
      req.headers.host !== new URL(redirect).host ||
      url.pathname !== '/oauth/callback' ||
      (req.url?.length ?? 0) > 8192 ||
      returnedState.length !== state.length ||
      !timingSafeEqual(
        createHash('sha256').update(returnedState).digest(),
        createHash('sha256').update(state).digest(),
      ) ||
      claimed ||
      expired
    ) {
      res.writeHead(400).end('Nieprawidlowy lub wygasly callback.');
      return;
    }
    claimed = true;
    const code = url.searchParams.get('code');
    if (!code || url.searchParams.has('error')) {
      res.writeHead(400).end('Logowanie anulowane.');
      fail(new DomainError('OAUTH_CANCELLED', 'Anulowano logowanie Google.'));
      return;
    }
    try {
      const token = z
        .object({
          access_token: z.string().min(1),
          refresh_token: z.string().min(1),
          expires_in: z.number().positive(),
          scope: z.string(),
          token_type: z.literal('Bearer'),
        })
        .parse(
          await googleJSON(
            'https://oauth2.googleapis.com/token',
            {
              method: 'POST',
              body: new URLSearchParams({
                ...client,
                code,
                code_verifier: verifier,
                redirect_uri: redirect,
                grant_type: 'authorization_code',
              }),
            },
            request,
          ),
        );
      const scopes = grantedScopes(token.scope, includeRead);
      const identity = z
        .object({ sub: z.string().min(1), email: z.email(), email_verified: z.literal(true) })
        .parse(
          await googleJSON(
            'https://openidconnect.googleapis.com/v1/userinfo',
            { headers: { Authorization: `Bearer ${token.access_token}` } },
            request,
          ),
        );
      const account = {
        email: identity.email,
        subject: identity.sub,
        connectedAt: new Date().toISOString(),
        scopes,
      };
      if (expired) throw new DomainError('OAUTH_TIMEOUT', 'Minął czas logowania Google.');
      await vault.set(
        JSON.stringify({
          client,
          refreshToken: token.refresh_token,
          accessToken: token.access_token,
          expiresAt: Date.now() + token.expires_in * 1000,
          account,
        }),
      );
      if (expired) {
        await vault.remove();
        throw new DomainError('OAUTH_TIMEOUT', 'Minął czas logowania Google.');
      }
      saveInfo(dir, account);
      res
        .writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end('Konto połączone. Wróć do JobHunter. Nie wysłano żadnej wiadomości.');
      complete(account);
    } catch (error) {
      res.writeHead(400).end('Nie udalo sie polaczyc konta. Wroc do JobHunter.');
      fail(
        error instanceof DomainError
          ? error
          : new DomainError('GOOGLE_AUTH', 'Nie udało się zweryfikować konta i zapisać zgody.'),
      );
    }
  });
  await new Promise<void>((yes, no) => {
    server.once('error', no);
    server.listen(0, '127.0.0.1', yes);
  });
  redirect = `http://127.0.0.1:${(server.address() as { port: number }).port}/oauth/callback`;
  const timer = setTimeout(() => {
    expired = true;
    fail(new DomainError('OAUTH_TIMEOUT', 'Minął czas logowania Google.'));
  }, timeoutMs);
  try {
    const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    auth.search = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: redirect,
      response_type: 'code',
      scope: [...requestedScopes, ...(includeRead ? [gmailReadScope] : [])].join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent select_account',
    }).toString();
    await openBrowser(auth.href);
    return await result;
  } finally {
    clearTimeout(timer);
    if (expired) server.closeAllConnections();
    await new Promise<void>((yes) => server.close(() => yes()));
  }
}
export async function accessToken(vault: SecretStore, request: typeof fetch = fetch) {
  let session: z.infer<typeof sessionSchema>;
  try {
    session = sessionSchema.parse(JSON.parse((await vault.get()) ?? 'null'));
  } catch {
    throw new DomainError('GMAIL_NOT_CONNECTED', 'Najpierw podłącz konto Gmail.');
  }
  if (session.expiresAt > Date.now() + 60000) return session.accessToken;
  const token = z
    .object({
      access_token: z.string().min(1),
      expires_in: z.number().positive(),
      token_type: z.literal('Bearer'),
      scope: z.string().optional(),
    })
    .parse(
      await googleJSON(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          body: new URLSearchParams({
            ...session.client,
            refresh_token: session.refreshToken,
            grant_type: 'refresh_token',
          }),
        },
        request,
      ),
    );
  if (token.scope)
    session.account.scopes = grantedScopes(
      token.scope,
      session.account.scopes.includes(gmailReadScope),
    );
  session.accessToken = token.access_token;
  session.expiresAt = Date.now() + token.expires_in * 1000;
  await vault.set(JSON.stringify(session));
  return session.accessToken;
}
// Only called by explicit delivery/read operations; never returned from an HTTP route.
export async function gmailCredentials(vault: SecretStore, request: typeof fetch = fetch) {
  const bearer = await accessToken(vault, request);
  let session: z.infer<typeof sessionSchema>;
  try {
    session = sessionSchema.parse(JSON.parse((await vault.get()) ?? 'null'));
  } catch {
    throw new DomainError('GMAIL_NOT_CONNECTED', 'Najpierw podłącz konto Gmail.');
  }
  grantedScopes(session.account.scopes.join(' '), true);
  const identity = z
    .object({ sub: z.string(), email: z.email(), email_verified: z.literal(true) })
    .parse(
      await googleJSON(
        'https://openidconnect.googleapis.com/v1/userinfo',
        { headers: { Authorization: `Bearer ${bearer}` } },
        request,
      ),
    );
  if (
    identity.sub !== session.account.subject ||
    identity.email.toLowerCase() !== session.account.email.toLowerCase()
  )
    throw new DomainError(
      'GMAIL_ACCOUNT_CHANGED',
      'Konto Google zmieniło się; przejrzyj wiadomości ponownie.',
    );
  return { account: session.account, bearer };
}
export async function storedDesktopClient(vault: SecretStore): Promise<DesktopClient> {
  try {
    return sessionSchema.parse(JSON.parse((await vault.get()) ?? 'null')).client;
  } catch {
    throw new DomainError('GMAIL_NOT_CONNECTED', 'Najpierw podłącz Gmail plikiem Desktop app.');
  }
}
export async function disconnectGoogle(
  vault: SecretStore,
  dir: string,
  request: typeof fetch = fetch,
) {
  let token: string | undefined;
  try {
    token = sessionSchema.parse(JSON.parse((await vault.get()) ?? 'null')).refreshToken;
  } catch {}
  if (token) {
    let revoked = false;
    try {
      const res = await request('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        body: new URLSearchParams({ token }),
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
      revoked = res.ok;
    } catch {}
    if (!revoked)
      throw new DomainError(
        'OAUTH_REVOKE',
        'Nie potwierdzono cofnięcia zgody Google. Możesz cofnąć ją w ustawieniach konta i ponowić odłączenie.',
      );
  }
  await vault.remove();
  rmSync(join(dir, 'account.json'), { force: true });
}
