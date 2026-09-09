import Twilio from "twilio";

// Same config-driven provider-abstraction pattern as WhatsApp dispatch in
// the Backend Design Document §5 — swap SMS_PROVIDER once a real gateway is
// chosen, nothing else in the codebase needs to change.
const SMS_PROVIDER = process.env.SMS_PROVIDER ?? "mock";

let twilioClient: ReturnType<typeof Twilio> | null = null;
function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set");
    twilioClient = Twilio(sid, token);
  }
  return twilioClient;
}

// Phones are stored/passed around digits-only (see normalizePhone) — Twilio
// needs E.164, so a leading "0" gets swapped for the Laos country code.
function toE164Laos(phone: string): string {
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("856") ? `+${digits}` : `+856${digits.replace(/^0/, "")}`;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  if (SMS_PROVIDER === "mock") {
    console.log(`[sms:mock] -> ${phone}: ${message}`);
    return;
  }
  if (SMS_PROVIDER === "twilio") {
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!from) throw new Error("TWILIO_FROM_NUMBER not set");
    await getTwilioClient().messages.create({ to: toE164Laos(phone), from, body: message });
    return;
  }
  throw new Error(`Unknown SMS_PROVIDER "${SMS_PROVIDER}" — "mock" and "twilio" are wired up`);
}

export const isMockSms = SMS_PROVIDER === "mock";
