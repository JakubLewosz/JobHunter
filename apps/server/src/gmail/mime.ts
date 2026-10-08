import nodemailer from 'nodemailer';
import { z } from 'zod';
import { DomainError, hash, id } from '../util.js';

function escapeHTML(text: string) {
  return text.replace(/[&<>"']/g, (character) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
  });
}

function messageHTML(body: string) {
  // Render the reviewed text; it never becomes caller-supplied HTML.
  const content = body
    .split(/(https:\/\/[^\s<>"']+)/u)
    .map((part, index) => {
      const text = escapeHTML(part);
      return index % 2 ? `<a href="${text}">${text}</a>` : text;
    })
    .join('')
    .replace(/\r\n|\r|\n/g, '<br>');
  return `<div dir="ltr">${content}</div>`;
}

export async function prepareMime(input: {
  sender: string;
  senderName?: string;
  recipient: string;
  subject: string;
  body: string;
  textOnly?: boolean;
  cv: { name: string; bytes: Buffer; sha256: string; approved: boolean } | null;
  messageId?: string;
  date?: Date;
}) {
  if (
    !z.email().safeParse(input.sender).success ||
    !z.email().safeParse(input.recipient).success ||
    /[\r\n]/.test(input.subject) ||
    (input.senderName !== undefined &&
      (!input.senderName.trim() ||
        input.senderName.length > 100 ||
        /[\u0000-\u001f\u007f]/.test(input.senderName)))
  )
    throw new DomainError('INVALID_MESSAGE', 'Sprawdź nadawcę, odbiorcę i temat wiadomości.');
  const cv = input.cv;
  if (cv && !cv.approved)
    throw new DomainError('CV_NOT_APPROVED', 'Najpierw przejrzyj i zatwierdź CV w Moje materiały.');
  if (
    cv &&
    (cv.bytes.length > 5 * 1024 * 1024 ||
      !cv.bytes.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
      hash(cv.bytes) !== cv.sha256)
  )
    throw new DomainError('CV_CHANGED', 'Nieprawidłowy PDF lub zmienione bajty CV.');
  const messageId = input.messageId ?? `<${id()}@jobhunter.local>`;
  if (!/^<[A-Za-z0-9-]+@jobhunter\.local>$/.test(messageId))
    throw new DomainError('INVALID_MESSAGE', 'Nieprawidłowy identyfikator wiadomości.');
  const result = await nodemailer
    .createTransport({ streamTransport: true, buffer: true, newline: 'windows' })
    .sendMail({
      from: input.senderName
        ? { name: input.senderName.trim(), address: input.sender }
        : input.sender,
      to: input.recipient,
      subject: input.subject,
      text: input.body,
      html: input.textOnly ? undefined : messageHTML(input.body),
      messageId,
      date: input.date,
      attachments: cv
        ? [
            {
              filename: cv.name.replace(/[^\p{L}\p{N} ._-]/gu, '_'),
              content: cv.bytes,
              contentType: 'application/pdf',
            },
          ]
        : [],
    });
  const mime = result.message as Buffer;
  return { messageId, mime, mimeHash: hash(mime) };
}
