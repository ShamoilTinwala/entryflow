import { z } from "zod";

const id = z.number().int().positive();
const quantity = z.coerce.number().int().min(1).max(100000);
const name = z.string().trim().min(1).max(160);
const email = z.email().max(254).transform(value => value.toLowerCase());
const eventFields = z.object({
  name, venue: name, date: z.iso.date(), address: z.string().max(500).optional(),
  startTime: z.string().max(8).optional(), endTime: z.string().max(8).optional(),
  mapUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]).optional(),
  description: z.string().max(4000).optional(), invitationMessage: z.string().max(4000).optional(),
});
const role = z.enum(["Superhost", "Host", "Supervisor", "Gate Scanner"]);
const scan = z.object({ eventId: id, code: z.string().trim().max(150), count: quantity, gate: name });
const status = z.enum(["Draft", "Ready", "Live", "Closed", "Archived"]);
export const commands = {
  createEvent: z.tuple([eventFields]),
  updateEvent: z.tuple([id, eventFields.partial().extend({ status: status.optional() }).strict()]),
  archiveEvent: z.tuple([id]), deleteEvent: z.tuple([id]),
  createMember: z.tuple([z.object({eventId: id, role, email, name, capacity: quantity})]),
  updateMember: z.tuple([id, z.object({email, name, eventId: id}).partial().strict()]),
  removeMember: z.tuple([id]), updateHostQuota: z.tuple([id, quantity]),
  createInvite: z.tuple([z.object({eventId: id, role, capacity: quantity, expiresInHours: z.literal(48).optional()})]),
  revokeInvite: z.tuple([z.string().length(20)]),
  createGuest: z.tuple([z.object({eventId: id, hostId: id, name, count: quantity})]),
  updateGuest: z.tuple([id, z.object({primaryName: name, totalCount: quantity}).strict()]),
  deleteGuest: z.tuple([id]), scanPass: z.tuple([scan]),
  manualCheckIn: z.tuple([scan.extend({name: z.string().max(160)})]),
  checkOut: z.tuple([z.object({passId: id.optional(), sourceEntryId: id.optional(), count: quantity, gate: name})
    .refine(v => Boolean(v.passId) !== Boolean(v.sourceEntryId))]),
  reverseEntry: z.tuple([id, z.string().max(500)]), undoLastScan: z.union([z.tuple([]), z.tuple([id])]),
};
