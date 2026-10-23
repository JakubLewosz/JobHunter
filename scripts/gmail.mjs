// Explicit maintenance only. Never constructs a service, sender or browser worker.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { base } from './paths.mjs';
import { DomainError } from '../dist/apps/server/src/util.js';
import { workstationRuntime, developmentRuntime } from '../dist/apps/server/src/runtime.js';
import {
  connectGoogle,
  disconnectGoogle,
  loadDesktopClient,
  nativeSecretStore,
  setupInfo,
  storedDesktopClient,
  gmailCredentials,
  saveVerifiedAccountInfo,
  browserReadScopes,
} from '../dist/apps/server/src/gmail/oauth.js';
import {
  readAccountPolicy,
  saveAccountPolicy,
  assertAccountPolicy,
} from '../dist/apps/server/src/gmail/account-policy.js';
import {
  withAccountMaintenance,
  configureSingleAccount,
} from '../dist/apps/server/src/gmail/maintenance.js';
import { identityOnlyRequest } from '../dist/apps/server/src/gmail/identity-diagnostic.js';
const dir = join(base, 'gmail-preparation');
const [command, file] = process.argv.slice(2);
const controller = new AbortController();
const abort = () => controller.abort();
process.once('SIGINT', abort);
process.once('SIGTERM', abort);
try {
  if (process.env.JOBHUNTER_RUNTIME !== 'WORKSTATION') developmentRuntime.assertNative();
  workstationRuntime(join(base, 'research-only')).assertNative();
  if (command === 'status') {
    const policy = readAccountPolicy(base),
      info = setupInfo(dir);
    if (info) assertAccountPolicy(policy, info);
    console.log(
      JSON.stringify({
        configuredEmail: policy.email,
        connectedMetadata: !!info,
        scopes: info?.scopes ?? [],
        transport: policy.transport,
        liveIdentity: 'NOT_CHECKED',
        sendAuthority: false,
      }),
    );
  } else if (
    ['configure', 'verify', 'connect', 'reconnect', 'enable-read', 'disconnect'].includes(command)
  ) {
    await withAccountMaintenance(base, async (store) => {
      if (command === 'configure') {
        const policy = configureSingleAccount(store, base, file);
        console.log(
          JSON.stringify({
            configuredEmail: policy.email,
            transport: policy.transport,
            sendAuthority: false,
          }),
        );
        return;
      }
      const policy = readAccountPolicy(base),
        metadata = setupInfo(dir);
      // Never refresh/use a credential whose local provenance is missing or foreign.
      if (metadata) assertAccountPolicy(policy, metadata, command === 'connect' && !!file);
      if (!metadata && !(command === 'connect' && file))
        throw new DomainError(
          'GMAIL_NOT_CONNECTED',
          'Wskaż własny plik Desktop app poza repo; nie wybrano innego połączenia.',
        );
      const guard = {
        policy: () => readAccountPolicy(base),
        metadata: () => setupInfo(dir),
        signal: controller.signal,
      };
      const trace = [],
        request = identityOnlyRequest(fetch, trace);
      const vault = await nativeSecretStore();
      if (command === 'verify') {
        try {
          const { account } = await gmailCredentials(vault, request, guard);
          saveVerifiedAccountInfo(dir, account);
          console.log(
            JSON.stringify({
              providerEmail: account.email,
              providerIdentityMatch: true,
              stableIdentityMatch: true,
              gmailProfileMatch: true,
              apiReadCapability: true,
              scopes: account.scopes,
              transport: 'GMAIL_BROWSER',
              apiSendAllowed: false,
              sendAuthority: false,
              mailboxRead: false,
              trace,
            }),
          );
        } catch (error) {
          console.log(
            JSON.stringify({
              providerIdentityMatch: 'UNVERIFIED',
              apiReadCapability: 'UNVERIFIED',
              code: error instanceof DomainError ? error.code : 'IDENTITY_CHECK_FAILED',
              sendAuthority: false,
              mailboxRead: false,
              trace,
            }),
          );
          process.exitCode = 1;
        }
        return;
      }
      if (command === 'disconnect') {
        if (file !== '--confirm-google-revocation')
          throw new DomainError(
            'OAUTH_REVOKE_CONFIRM',
            'Cofnięcie zgody Google może objąć szerszy grant tego klienta; wymaga osobnej świadomej decyzji.',
          );
        await disconnectGoogle(vault, dir);
        console.log('Cofnięto zgodę Google. Program pozostaje zatrzymany.');
        return;
      }
      const client = file
        ? loadDesktopClient(file, process.cwd())
        : await storedDesktopClient(vault, guard);
      console.log(
        `Logowanie tylko dla ${policy.email}. Zakres: ${browserReadScopes.join(' ')}. Bez wysyłki; odczyt Google jest szerszy od celowanych filtrów JobHuntera.`,
      );
      const info = await connectGoogle(
        client,
        vault,
        dir,
        async (url) => {
          await new Promise((yes, no) => {
            const child = spawn('explorer.exe', [url], {
              shell: false,
              stdio: 'ignore',
              windowsHide: true,
            });
            child.once('error', no);
            child.once('exit', (code) => (code === 0 ? yes() : no(new Error('BROWSER'))));
          });
        },
        request,
        300000,
        true,
        guard,
      );
      assertAccountPolicy(policy, info, true);
      saveAccountPolicy(base, { ...policy, subject: info.subject, revision: randomUUID() });
      store.exec("UPDATE campaigns SET policy_version=policy_version+1 WHERE id='research'");
      console.log(
        JSON.stringify({
          providerEmail: info.email,
          providerIdentityMatch: true,
          stableIdentityMatch: true,
          gmailProfileMatch: true,
          apiReadCapability: true,
          scopes: info.scopes,
          transport: 'GMAIL_BROWSER',
          apiSendAllowed: false,
          sendAuthority: false,
          mailboxRead: false,
          trace,
        }),
      );
    });
  } else
    throw new DomainError(
      'GMAIL_COMMAND',
      'Użyj configure EMAIL, verify, reconnect lub connect PLIK_DESKTOP. Bez komendy wysyłki.',
    );
} catch (error) {
  console.error(
    error instanceof DomainError
      ? `${error.code}: ${error.message}`
      : 'GMAIL_SETUP_FAILED: Nie ukończono bezpiecznej konfiguracji konta.',
  );
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', abort);
  process.removeListener('SIGTERM', abort);
}
