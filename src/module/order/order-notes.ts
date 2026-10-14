export type OrderNotesPayload = {
  customerNote?: string;
  guestEmail?: string;
};

export function normalizeGuestEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function serializeOrderNotes(payload: OrderNotesPayload): string | null {
  const customerNote = payload.customerNote?.trim();
  const guestEmail = payload.guestEmail ? normalizeGuestEmail(payload.guestEmail) : undefined;
  if (!customerNote && !guestEmail) return null;
  return JSON.stringify({
    ...(customerNote ? { customerNote } : {}),
    ...(guestEmail ? { guestEmail } : {}),
  });
}

export function parseOrderNotes(notes: string | null | undefined): OrderNotesPayload {
  if (!notes?.trim()) return {};
  const trimmed = notes.trim();
  if (!trimmed.startsWith("{")) {
    return { customerNote: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed) as OrderNotesPayload;
    return {
      customerNote: typeof parsed.customerNote === "string" ? parsed.customerNote : undefined,
      guestEmail: typeof parsed.guestEmail === "string" ? normalizeGuestEmail(parsed.guestEmail) : undefined,
    };
  } catch {
    return { customerNote: trimmed };
  }
}

export function guestEmailFromOrderNotes(notes: string | null | undefined): string | undefined {
  return parseOrderNotes(notes).guestEmail;
}
