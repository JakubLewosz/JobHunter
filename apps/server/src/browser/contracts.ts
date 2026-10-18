import { z } from 'zod';
export const browserDescriptorName = 'browser-executor.json';
export const executionScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('MANUAL'), backendId: z.string(), generation: z.string() }).strict(),
  z
    .object({
      kind: z.literal('BATCH'),
      backendId: z.string(),
      generation: z.string(),
      sessionId: z.string(),
      batchId: z.string(),
    })
    .strict(),
]);
export type BrowserExecutionScope = z.infer<typeof executionScopeSchema>;

export const transportSchema = z.enum(['GMAIL_API', 'GMAIL_BROWSER']);
export type SendTransport = z.infer<typeof transportSchema>;
export type BrowserPayload = {
  id: string;
  outboxId: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  attachment: { path: string; name: string; sha256: string; bytes: number } | null;
  payloadHash: string;
};
export const composeObservationSchema = z
  .object({
    url: z.string().max(2000),
    composeId: z.string().min(1).max(300),
    sender: z.email(),
    to: z.array(z.email()).max(10),
    cc: z.array(z.email()).max(10),
    bcc: z.array(z.email()).max(10),
    subject: z.string().max(1000),
    body: z.string().max(100000),
    attachments: z
      .array(z.object({ name: z.string().max(200), complete: z.boolean() }).strict())
      .max(5),
  })
  .strict();
export type ComposeObservation = z.infer<typeof composeObservationSchema>;
export const browserReceiptSchema = z
  .object({
    acknowledged: z.literal(true),
    url: z.string().max(2000),
    // A DOM candidate is NOT a provider receipt. The readonly API must verify it.
    candidateId: z
      .string()
      .regex(/^[a-f0-9]{8,40}$/)
      .nullable(),
  })
  .strict();
export type BrowserReceipt = z.infer<typeof browserReceiptSchema>;
export type BrowserSendResult = {
  id: string | null;
  threadId: string | null;
  confirmed: false;
};
