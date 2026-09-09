import { prisma } from "./prisma.js";
import { sendSms } from "./sms.js";

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

// Backend Design Document §5 "WhatsApp Dispatch" — routed through the same
// mock-first `sendSms` provider abstraction as OTP for now (WHATSAPP_PROVIDER
// vs SMS_PROVIDER can diverge later; both are "mock" today). Every send is
// logged to notification_logs so it can back the customer's "การแจ้งเตือน"
// feed once that's wired up on the frontend.
export async function notifyUser(userId: string, templateKey: string, vars: Record<string, string> = {}): Promise<void> {
  const template = await prisma.notificationTemplate.findUnique({ where: { templateKey } });
  if (!template || !template.isActive) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await sendSms(user.phone, renderTemplate(template.bodyWhatsapp, vars));
  await prisma.notificationLog.create({ data: { userId, templateKey, channel: "whatsapp", payload: vars } });
}
