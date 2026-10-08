// Explicit OAuth setup only. No send command and no research/model process.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { base } from './paths.mjs';
import { DomainError } from '../dist/apps/server/src/util.js';
import {
  connectGoogle,
  disconnectGoogle,
  loadDesktopClient,
  nativeSecretStore,
  gmailReadScope,
  setupInfo,
  storedDesktopClient,
} from '../dist/apps/server/src/gmail/oauth.js';
const dir = join(base, 'gmail-preparation');
const [command, file] = process.argv.slice(2);
try {
  if (command === 'status') {
    const info = setupInfo(dir);
    console.log(
      info
        ? `Zapisano konto ${info.email}. Odczyt: ${info.scopes.includes(gmailReadScope) ? 'dopuszczony przez Google' : 'wymaga dodatkowego logowania'}. Wysyłkę konkretnej wiadomości zatwierdzasz w panelu APPROVAL_REQUIRED.`
        : 'Konto Gmail jeszcze niepodłączone. Instrukcja: docs/GMAIL_SETUP.md',
    );
  } else if (command === 'connect' || command === 'enable-read') {
    const vault = await nativeSecretStore();
    const client = file
      ? loadDesktopClient(file, process.cwd())
      : command === 'enable-read'
        ? await storedDesktopClient(vault)
        : undefined;
    if (!client) throw new Error('Wskaż lokalną ścieżkę do pliku OAuth Desktop app poza repo.');
    if (command === 'enable-read')
      console.log(
        'Google poprosi o odczyt poczty i wysyłkę. JobHunter odczytuje wybrane kontakty i swoje wątki; nie przekazuje poczty modelowi.',
      );
    console.log('Otwieram logowanie Google w przeglądarce. To podłączenie konta, bez wysyłek.');
    const info = await connectGoogle(
      client,
      vault,
      dir,
      async (url) => {
        const opener =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'explorer.exe'
              : 'xdg-open';
        await new Promise((yes, no) => {
          const child = spawn(opener, [url], { shell: false, stdio: 'ignore' });
          child.once('error', no);
          child.once('exit', (code) => (code === 0 ? yes() : no(new Error('BROWSER'))));
        });
      },
      undefined,
      300000,
      command === 'enable-read',
    );
    console.log(
      `Połączono ${info.email}. Nie wysłano żadnej wiadomości. W panelu APPROVAL_REQUIRED przygotuj i zatwierdź konkretny podgląd z CV.`,
    );
  } else if (command === 'disconnect') {
    await disconnectGoogle(await nativeSecretStore(), dir);
    console.log('Cofnięto zgodę i usunięto zapisane połączenie Gmail.');
  } else
    throw new Error(
      'Użyj: npm run gmail:connect -- /ścieżka/client_secret.json, gmail:status lub gmail:disconnect.',
    );
} catch (error) {
  // Provider/native errors may carry secrets; print only deliberately authored safe messages.
  console.error(
    error instanceof DomainError
      ? error.message
      : 'Nie ukończono konfiguracji Gmaila. Sprawdź plik Desktop app poza repo, dostęp do systemowego magazynu haseł i docs/GMAIL_SETUP.md.',
  );
  process.exitCode = 1;
}
