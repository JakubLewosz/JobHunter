// Explicit mode; never changes another running backend or resumes a send queue.
process.env.JOBHUNTER_MODE = 'APPROVAL_REQUIRED';
await import('../dist/apps/server/src/main.js');
