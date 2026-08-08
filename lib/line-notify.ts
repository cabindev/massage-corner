const LINE_BROADCAST_URL = "https://api.line.me/v2/bot/message/broadcast";

/**
 * ส่งข้อความแจ้งเตือนไปหาทุกคนที่แอดเพื่อนกับ LINE OA ของร้าน (Broadcast API).
 * เงียบ (no-op) ถ้ายังไม่ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN และไม่ throw ถ้า LINE ล่ม —
 * การแจ้งเตือนต้องไม่ทำให้การจองของลูกค้าล้มเหลว
 */
export async function notifyLineNewBooking(details: {
  customerName: string;
  phone: string;
  serviceName: string;
  bookingTime: Date;
}) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const when = details.bookingTime.toLocaleString("en-GB", {
    timeZone: "Europe/Sofia",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = [
    "📅 New booking — Massage Corner",
    `${details.customerName} · ${details.phone}`,
    details.serviceName,
    when,
  ].join("\n");

  try {
    await fetch(LINE_BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: [{ type: "text", text }] }),
    });
  } catch (err) {
    console.error("[notifyLineNewBooking]", err);
  }
}
