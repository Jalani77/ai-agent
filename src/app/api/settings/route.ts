import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  reminderHoursBefore: z.number().int().min(1).max(168).optional(),
  smsEnabled: z.boolean().optional(),
});

async function getOrCreateSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }
  return settings;
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await getOrCreateSettings();
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: parsed.data,
  });
  return NextResponse.json(settings);
}
