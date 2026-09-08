// Same config-driven provider-abstraction pattern as WhatsApp dispatch in
// the Backend Design Document §5 — swap SMS_PROVIDER once a real gateway is
// chosen, nothing else in the codebase needs to change.
const SMS_PROVIDER = process.env.SMS_PROVIDER ?? "mock";

export async function sendSms(phone: string, message: string): Promise<void> {
  if (SMS_PROVIDER === "mock") {
    console.log(`[sms:mock] -> ${phone}: ${message}`);
    return;
  }
  throw new Error(`Unknown SMS_PROVIDER "${SMS_PROVIDER}" — only "mock" is wired up so far`);
}

export const isMockSms = SMS_PROVIDER === "mock";
