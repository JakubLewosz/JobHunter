import { acquireProfileLock } from '../../apps/server/src/backend-lock.js';

if (!process.connected) throw Error('SYNTHETIC_IPC_REQUIRED');
// Deterministically model uninterruptible synchronous startup in our own fixture.
// Only the actual profile lock, no Store, worker or providers.
const lock = acquireProfileLock(process.argv[2]);
lock.assert();
process.send!('LOCK_HELD', () => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
});
