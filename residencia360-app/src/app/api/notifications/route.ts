import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/server/auth/session";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  const unread = await db.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
  return NextResponse.json({ items, unread });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: string[]; markAll?: boolean };

  if (body.markAll) {
    await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await db.notification.updateMany({
      where: { id: { in: body.ids }, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ success: true });
}
