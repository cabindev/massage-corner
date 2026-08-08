import nodemailer from "nodemailer";

export type NewBookingDetails = {
  customerName: string;
  phone: string;
  serviceName: string;
  bookingTime: Date;
  notes?: string | null;
};

/** วันเวลาแบบอ่านง่ายตามเวลาร้าน เช่น "Tue, 11 Aug 2026, 15:30" */
function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/Sofia",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e6dcc6;color:#6b6257;font-size:12px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${escapeHtml(
          label
        )}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e6dcc6;color:#1d1a16;font-size:15px">${escapeHtml(
          value
        )}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#e8dcc2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ede3d0;border-radius:16px;overflow:hidden;border:1px solid #d8c9a6">
    <tr>
      <td style="padding:22px 24px;background:#071210">
        <p style="margin:0;color:#b08828;font-size:11px;letter-spacing:.16em;text-transform:uppercase">Massage Corner Sofia</p>
        <h1 style="margin:6px 0 0;color:#ede3d0;font-size:22px;font-weight:500">New booking received</h1>
      </td>
    </tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${cells}</table></td></tr>
    <tr>
      <td style="padding:16px 24px;color:#6b6257;font-size:12px">
        Status is <strong>PENDING</strong> — confirm it in the admin dashboard.
      </td>
    </tr>
  </table>
</body></html>`;
}

/**
 * transporter ตัวเดียวใช้ซ้ำทั้ง process (nodemailer จะ pool connection ให้)
 * สร้างแบบ lazy เพราะตอน build ยังไม่มี env
 */
let transporter: nodemailer.Transporter | null = null;
function getTransporter(user: string, pass: string) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: { user, pass },
    });
  }
  return transporter;
}

/**
 * แจ้งเจ้าของร้านทางอีเมลเมื่อมีการจองใหม่ (Gmail SMTP ผ่าน nodemailer)
 *
 * เงียบ (no-op) ถ้ายังไม่ตั้งค่า env และไม่ throw ถ้าส่งไม่สำเร็จ —
 * การแจ้งเตือนต้องไม่ทำให้การจองของลูกค้าล้มเหลว
 *
 * ต้องตั้ง env:
 *   EMAIL_USER            บัญชี Gmail ที่ใช้ส่ง
 *   EMAIL_PASS            App Password 16 หลัก (ไม่ใช่รหัสผ่าน Gmail ปกติ — ต้องเปิด 2FA ก่อน)
 *   BOOKING_NOTIFY_EMAIL  ผู้รับ ใส่หลายอีเมลได้ คั่นด้วย comma (ไม่ตั้ง = ส่งหา EMAIL_USER)
 */
export async function notifyEmailNewBooking(details: NewBookingDetails) {
  const user = process.env.EMAIL_USER?.trim();
  // Google โชว์ App Password เป็น 4 กลุ่มคั่นช่องว่าง ("abcd efgh ijkl mnop")
  // คนก๊อปมาวางมักติดช่องว่างมาด้วย — ตัดทิ้งให้เลย จะได้ไม่เจอ 535 โดยไม่รู้สาเหตุ
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");
  if (!user || !pass) return;

  // Gmail จะเขียน From ทับเป็นบัญชีที่ล็อกอินอยู่แล้ว ใส่ชื่อร้านให้อ่านง่ายพอ
  const to = (process.env.BOOKING_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);
  const recipients = to.length > 0 ? to : [user];

  const when = formatWhen(details.bookingTime);
  const rows: [string, string][] = [
    ["Customer", details.customerName],
    ["Phone", details.phone],
    ["Treatment", details.serviceName],
    ["When", when],
  ];
  if (details.notes) rows.push(["Notes", details.notes]);

  try {
    await getTransporter(user, pass).sendMail({
      from: `"Massage Corner Sofia" <${user}>`,
      to: recipients,
      subject: `New booking — ${details.customerName} · ${when}`,
      text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
      html: buildHtml(rows),
    });
  } catch (err) {
    console.error("[notifyEmailNewBooking]", err);
  }
}
