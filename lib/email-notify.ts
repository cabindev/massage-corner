import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { SHOP_TIMEZONE } from "@/lib/schedule-config";

export type NewBookingDetails = {
  customerName: string;
  phone: string;
  serviceName: string;
  bookingTime: Date;
  notes?: string | null;
};

/** วันเวลาแบบอ่านง่ายตามเวลาร้าน เช่น "Tue, 11 Aug 2026, 15:30" — ใช้ในหัวเรื่องเมล */
function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: SHOP_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * แยกวันเวลาเป็นชิ้น ๆ เพื่อจัดหน้าในการ์ด (เวลาตัวใหญ่ วันตัวเล็ก)
 * ทุกชิ้นตรึงด้วยโซนของร้าน — ห้ามใช้ getHours/getDay ตรง ๆ เพราะจะอ่านโซนของ
 * เครื่องที่รันโค้ด ซึ่งบน Plesk ไม่ใช่ Europe/Sofia
 */
function formatWhenParts(date: Date) {
  const part = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleString("en-GB", { timeZone: SHOP_TIMEZONE, ...options });
  return {
    time: part({ hour: "2-digit", minute: "2-digit", hour12: false }),
    date: part({ weekday: "long", day: "numeric", month: "long" }),
    year: part({ year: "numeric" }),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** tel: รับแค่ตัวเลขกับ + — ตัดวงเล็บ ขีด เว้นวรรคที่ลูกค้าพิมพ์มาทิ้ง */
function telHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * ลิงก์เข้าหลังบ้าน — ไม่ตั้ง NEXTAUTH_URL ก็แค่ไม่มีปุ่ม (เมลยังอ่านรู้เรื่อง)
 * ตัด / ท้าย URL ทิ้งก่อน กัน // ซ้อนเวลาต่อ path
 */
function dashboardUrl(): string | null {
  const base = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  return base ? `${base}/admin/bookings` : null;
}

/* ── ชิ้นส่วนสไตล์ที่ใช้ซ้ำ — พาเลต "Emerald & Champagne" เดียวกับหน้าเว็บ ── */
const ONYX = "#071210";
const LEAF = "#184838";
const LEAF_SOFT = "#4a8068";
const GOLD = "#b08828";
const GOLD_SOFT = "#d4b878";
const PAPER = "#ede3d0";
const PAPER_DEEP = "#ddd0b6";
const HAIRLINE = "#cabb98";
const INK = "#121c18";
const INK_MUTED = "#6b6257";
/* Cormorant โหลดในโปรแกรมอ่านเมลไม่ได้ — Georgia เป็นตัวแทนที่หน้าตาใกล้สุด */
const SERIF = "Georgia,'Times New Roman',serif";
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** แถวรายละเอียด 1 บรรทัด — label ตัวเล็กซ้าย ค่าตัวใหญ่ขวา */
function detailRow(label: string, valueHtml: string, last = false): string {
  const border = last ? "" : `border-bottom:1px solid ${HAIRLINE};`;
  return `
      <tr>
        <td style="padding:14px 0 13px;${border}font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${INK_MUTED};white-space:nowrap;vertical-align:middle;width:96px">${escapeHtml(
    label
  )}</td>
        <td style="padding:14px 0 13px;${border}font-family:${SANS};font-size:16px;color:${INK};vertical-align:middle;text-align:right">${valueHtml}</td>
      </tr>`;
}


/**
 * โลโก้ฝังไปกับเมลแบบ CID (ไม่ใช่ลิงก์รูป) — โปรแกรมอ่านเมลส่วนใหญ่บล็อกรูป
 * จากภายนอกจนกว่าผู้ใช้จะกด "แสดงรูปภาพ" แต่รูปที่แนบมาในเมลจะโชว์เลย
 * แปลงเป็น PNG เพราะ Outlook บน Windows เรนเดอร์ด้วยเอนจินของ Word ซึ่งอ่าน WebP ไม่ออก
 */
const LOGO_CID = "shop-logo";
const LOGO_PATH = path.join(process.cwd(), "public", "logo-email.png");
let logoExists: boolean | null = null;
function hasLogo(): boolean {
  // เช็คดิสก์ครั้งเดียวพอ — ไฟล์นี้มากับ build ไม่ได้ถูกสร้างทีหลัง
  if (logoExists === null) logoExists = fs.existsSync(LOGO_PATH);
  return logoExists;
}

function buildHtml(details: NewBookingDetails): string {
  const when = formatWhenParts(details.bookingTime);
  const href = dashboardUrl();

  // ข้อความตัวอย่างในกล่องขาเข้า — ถ้าไม่ใส่ Gmail จะดึงคำแรกในเมลมาโชว์แทน
  const preheader = escapeHtml(
    `${details.customerName} · ${details.serviceName} · ${when.date}, ${when.time}`
  );

  const logo = hasLogo()
    ? `<img src="cid:${LOGO_CID}" alt="Massage Corner Sofia" width="146" style="display:block;margin:0 auto;width:146px;max-width:146px;height:auto;border:0">`
    : `<p style="margin:0;font-family:${SERIF};font-size:22px;color:${LEAF}">Massage Corner Sofia</p>`;

  const rows =
    detailRow(
      "Customer",
      `<strong style="font-weight:600">${escapeHtml(
        details.customerName
      )}</strong>`
    ) +
    detailRow(
      "Phone",
      `<a href="tel:${escapeHtml(
        telHref(details.phone)
      )}" style="color:${LEAF};text-decoration:none;font-weight:600;border-bottom:1px solid ${GOLD_SOFT}">${escapeHtml(
        details.phone
      )}</a>`
    ) +
    detailRow("Treatment", escapeHtml(details.serviceName), true);

  const notes = details.notes
    ? `
            <tr><td style="padding:2px 0 0">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER_DEEP};border-left:3px solid ${GOLD}">
                <tr><td style="padding:14px 16px">
                  <p style="margin:0 0 5px;font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${INK_MUTED}">Notes from customer</p>
                  <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.55;color:${INK}">${escapeHtml(
        details.notes
      )}</p>
                </td></tr>
              </table>
            </td></tr>`
    : "";

  const cta = href
    ? `
            <tr><td style="padding:26px 0 2px" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr><td style="background:${LEAF};border-radius:999px">
                  <a href="${escapeHtml(
                    href
                  )}" style="display:block;padding:14px 34px;font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:.04em;color:${PAPER};text-decoration:none">Confirm in dashboard &rarr;</a>
                </td></tr>
              </table>
            </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>New booking</title>
</head>
<body style="margin:0;padding:0;background:${PAPER_DEEP};-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}</div>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER_DEEP}">
    <tr><td align="center" style="padding:32px 16px">

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background:${PAPER};border-radius:18px;overflow:hidden">

        <!-- โลโก้: ลายเส้นสีแทนบนพื้นใส ต้องอยู่บนพื้นครีมถึงจะอ่านออก -->
        <tr><td align="center" style="padding:30px 28px 24px;background:${PAPER}">
          ${logo}
        </td></tr>

        <!-- เวลานัด: แถบเข้มเต็มความกว้าง เป็นจุดที่ตาไปลงก่อนเสมอ -->
        <tr><td align="center" style="padding:26px 28px 28px;background:${ONYX}">
          <p style="margin:0 0 14px;font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${GOLD}">New booking</p>
          <p style="margin:0;font-family:${SERIF};font-size:48px;line-height:1;letter-spacing:.01em;color:${PAPER}">${escapeHtml(
    when.time
  )}</p>
          <p style="margin:13px 0 0;font-family:${SANS};font-size:15px;color:${LEAF_SOFT}">${escapeHtml(
    when.date
  )} ${escapeHtml(when.year)}</p>
          <p style="margin:18px 0 0">
            <span style="display:inline-block;padding:6px 14px;border:1px solid ${GOLD};border-radius:999px;font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${GOLD_SOFT}">Pending</span>
          </p>
        </td></tr>

        <!-- รายละเอียดลูกค้า -->
        <tr><td style="padding:6px 28px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${notes}${cta}</table>
        </td></tr>

        <!-- ท้ายเมล -->
        <tr><td style="padding:16px 28px;background:${PAPER_DEEP};border-top:1px solid ${HAIRLINE}">
          <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:${INK_MUTED};text-align:center">
            Automatic notification &middot; times shown in shop time (${escapeHtml(
              SHOP_TIMEZONE
            )})
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * transporter ตัวเดียวใช้ซ้ำทั้ง process (nodemailer จะ pool connection ให้)
 * สร้างแบบ lazy เพราะตอน build ยังไม่มี env
 */
let transporter: nodemailer.Transporter | null = null;
let transporterKey = ""; // ผูกกับ user+pass ที่สร้างไว้ ถ้า env เปลี่ยนต้องสร้างใหม่
function getTransporter(user: string, pass: string) {
  // คั่นด้วย NUL — อักขระเดียวที่การันตีว่าไม่โผล่ในอีเมลหรือ App Password
  // จึงไม่มีทางที่ user+pass คนละคู่จะปั้น key ชนกันได้
  const key = `${user}\u0000${pass}`;
  if (!transporter || transporterKey !== key) {
    transporter?.close();
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: { user, pass },
    });
    transporterKey = key;
  }
  return transporter;
}

export type EmailHealth =
  /** ยังไม่ได้ตั้ง EMAIL_USER/EMAIL_PASS — ระบบจะไม่ส่งอีเมล (ตั้งใจ ไม่ใช่ข้อผิดพลาด) */
  | { status: "off" }
  /** ล็อกอิน SMTP ผ่าน — พร้อมส่ง */
  | { status: "ok"; user: string; recipients: string[] }
  /** ตั้งค่าไว้แล้วแต่ล็อกอินไม่ผ่าน — เจ้าของร้านจะไม่ได้รับแจ้งเตือนโดยไม่รู้ตัว */
  | { status: "error"; user: string; message: string; hint?: string };

/**
 * cache ผลไว้ — หน้า Dashboard ถูกเปิดบ่อย ไม่ควรต่อ SMTP ใหม่ทุกครั้ง
 *
 * ตอนล็อกอินไม่ผ่านต้องถอยนานกว่ามาก: Gmail บล็อกบัญชีชั่วคราวถ้าเจอ AUTH ที่ผิด
 * ซ้ำๆ ถ้าเช็คทุก 5 นาทีด้วยรหัสที่ตายแล้ว ตัว health check เองจะกลายเป็นตัวยืดเวลา
 * ที่ถูกบล็อก และทำให้รหัสที่ถูกต้องใช้ไม่ได้ตามไปด้วย
 */
let healthCache: { at: number; value: EmailHealth } | null = null;
const HEALTH_TTL_OK_MS = 5 * 60_000;
const HEALTH_TTL_ERROR_MS = 60 * 60_000;

/**
 * ตรวจว่าระบบแจ้งเตือนอีเมลใช้งานได้จริงไหม โดย "ล็อกอิน SMTP" อย่างเดียว ไม่ส่งเมลออก
 *
 * มีไว้เพราะ notifyEmailNewBooking กลืน error ทิ้งโดยตั้งใจ (อีเมลล้มต้องไม่ทำให้
 * ลูกค้าจองไม่ได้) ผลข้างเคียงคือรหัสที่ถูกเพิกถอนทำให้ระบบเงียบไปหลายวันโดยไม่มี
 * ใครรู้ — ฟังก์ชันนี้ให้หน้า Dashboard เอาไปขึ้นแถบเตือนได้
 */
export async function checkEmailNotifyHealth(): Promise<EmailHealth> {
  const ttl =
    healthCache?.value.status === "error" ? HEALTH_TTL_ERROR_MS : HEALTH_TTL_OK_MS;
  if (healthCache && Date.now() - healthCache.at < ttl) {
    return healthCache.value;
  }

  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");

  let value: EmailHealth;
  if (!user || !pass) {
    value = { status: "off" };
  } else {
    const recipients = (process.env.BOOKING_NOTIFY_EMAIL ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    try {
      await getTransporter(user, pass).verify();
      value = { status: "ok", user, recipients: recipients.length ? recipients : [user] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // 535 = Gmail ปฏิเสธรหัส สาเหตุที่พบบ่อยที่สุดคือรหัสผ่านบัญชี Google ถูกเปลี่ยน
      // ซึ่งทำให้ App Password ทุกตัวของบัญชีนั้นถูกเพิกถอนทันทีโดยไม่แจ้งเตือน
      const hint = /535|BadCredentials|Invalid login/i.test(message)
        ? "Gmail ปฏิเสธรหัสผ่าน — App Password อาจถูกเพิกถอน (เกิดอัตโนมัติเมื่อเปลี่ยนรหัสผ่านบัญชี Google) สร้างใหม่ที่ myaccount.google.com/apppasswords แล้วอัปเดต EMAIL_USER คู่กับ EMAIL_PASS"
        : undefined;
      value = { status: "error", user, message, hint };
    }
  }

  healthCache = { at: Date.now(), value };
  return value;
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
      html: buildHtml(details),
      // แนบโลโก้เฉพาะตอนที่ไฟล์มีจริง ไม่งั้นจะได้รูปแตกแทนที่จะเป็นข้อความสำรอง
      attachments: hasLogo()
        ? [{ filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID }]
        : undefined,
    });
  } catch (err) {
    console.error("[notifyEmailNewBooking]", err);
  }
}
