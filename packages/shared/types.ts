export type Row = Record<string, any>;
export type Mode = 'DEMO' | 'RESEARCH_ONLY' | 'APPROVAL_REQUIRED';
export type TriState = 'yes' | 'no' | 'unknown' | 'conflicting';
export type Decision = 'READY_APPLICATION' | 'READY_OPEN_INQUIRY' | 'NEEDS_REVIEW' | 'REJECTED';
export type SendState =
  | 'QUEUED'
  | 'SENDING'
  | 'SENT_PROVIDER'
  | 'SENT_CONFIRMED'
  | 'SEND_UNKNOWN'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'FAILED_NOT_SENT';
export type ReplyCategory =
  | 'INTERESTED'
  | 'INVITATION'
  | 'QUESTION'
  | 'TASK'
  | 'REJECTED'
  | 'ON_HOLD'
  | 'AUTORESPONDER'
  | 'BOUNCE'
  | 'UNCLEAR';
export interface Dashboard {
  mode: Mode;
  day: string;
  stats: Record<string, number>;
  daily: Row[];
  state: Row;
  campaign: Row;
  events: Row[];
  runs: Row[];
  recentCompanies: Row[];
  profileApproved: boolean;
  pending: number;
  unknown: number;
}
