import { NextResponse } from "next/server";

// Bu endpoint, cron job'lar veya diğer servisler tarafından çağrılır.
// Gerçek bildirim istemci tarafında (lib/notifications.ts) gösterilir.
// Bu API sadece tetikleyici görevi görür.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Bildirim verisini döndür (istemci tarafı bunu yakalayıp gösterecek)
    return NextResponse.json({
      success: true,
      notification: { title, message },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Notification trigger failed", details: String(error) },
      { status: 500 }
    );
  }
}