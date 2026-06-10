import twilio from "twilio";

export async function sendSms(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn("[SMS] Twilio not configured. Would send:", { to, body });
    return { sid: "mock", status: "skipped" };
  }

  const client = twilio(accountSid, authToken);
  return client.messages.create({ to, from, body });
}

export function formatReminderMessage(
  title: string,
  courseName: string,
  dueDate: Date,
  hoursUntil: number,
) {
  const when =
    hoursUntil <= 1
      ? "in less than an hour"
      : hoursUntil < 24
        ? `in ${hoursUntil} hour${hoursUntil === 1 ? "" : "s"}`
        : `on ${dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;

  return `Study Command reminder: "${title}" (${courseName}) is due ${when}. Open your command center to review.`;
}
