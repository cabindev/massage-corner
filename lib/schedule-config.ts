// ค่าคงที่เวลาทำการ (ไม่มี dependency ฝั่ง server — ใช้ได้ทั้ง client/server)
export const OPEN_MINUTES = 10 * 60 + 30; // เปิด 10:30
export const CLOSE_MINUTES = 19 * 60; // ปิด 19:00 (คิวต้องจบไม่เกินเวลานี้)
export const SLOT_STEP_MINUTES = 30; // ช่วงเวลาทุก 30 นาที

/** เวลาเริ่มคิวสุดท้ายที่จองได้ — ปิดรับจอง 18:00 (ช้ากว่านี้ไม่เปิดให้เลือก) */
export const LAST_SLOT_MINUTES = 18 * 60;

export const SHOP_TIMEZONE = "Europe/Sofia";

/** วันที่ร้านปิด (0=อาทิตย์ … 6=เสาร์) — ปิดวันจันทร์ */
export const CLOSED_WEEKDAY = 1;

/**
 * ปิดวันจันทร์ — เปิดทำการอังคาร–อาทิตย์ นับตาม "ปฏิทินเวลาร้าน" (Europe/Sofia)
 * ไม่ใช่โซนเวลาของเครื่องที่รันโค้ด
 */
export function isClosedDay(date: Date): boolean {
  return isClosedDateKey(sofiaDateKey(date));
}

/** เหมือน isClosedDay แต่รับวันที่เป็น "YYYY-MM-DD" ตรงๆ (ไม่ต้องแปลงกลับไปกลับมา) */
export function isClosedDateKey(dateStr: string): boolean {
  // ใช้เที่ยงวัน UTC เป็นตัวแทนของวันนั้น — กัน off-by-one ตอนสลับ DST
  return weekdayOfDateKey(dateStr) === CLOSED_WEEKDAY;
}

/**
 * แปลง date ("YYYY-MM-DD") + time ("HH:mm") ให้เป็นเวลาร้าน (Europe/Sofia) เสมอ
 * ไม่ว่าเบราว์เซอร์ของคนกรอกฟอร์มจะตั้งโซนเวลาอะไรก็ตาม — กัน bug ที่ `new
 * Date(`${date}T${time}:00`)` ตีความเป็นเวลาท้องถิ่นของเครื่องผู้ใช้ ไม่ใช่ของร้าน
 */
export function sofiaDateTimeToUTC(dateStr: string, timeStr: string): Date {
  const naiveUTC = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const asSofia = new Date(
    naiveUTC.toLocaleString("en-US", { timeZone: SHOP_TIMEZONE })
  );
  const asUTC = new Date(naiveUTC.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = asSofia.getTime() - asUTC.getTime();
  return new Date(naiveUTC.getTime() - offsetMs);
}

/** อ่านเวลาเป็น "HH:mm" ตามเวลาร้าน (Europe/Sofia) จาก Date ใดๆ — ตรงข้ามกับ sofiaDateTimeToUTC */
export function sofiaHHMM(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone: SHOP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** แปลงนาทีตั้งแต่เที่ยงคืนเป็น "HH:mm" เช่น 630 → "10:30" */
export function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** นาทีตั้งแต่เที่ยงคืน ตามเวลาร้าน (Europe/Sofia) — ตรงข้ามกับ minutesToHHMM */
export function sofiaMinutesOfDay(date: Date): number {
  const [h, m] = sofiaHHMM(date).split(":").map(Number);
  return h * 60 + m;
}

/** อ่านวันที่เป็น "YYYY-MM-DD" ตามปฏิทินเวลาร้าน (Europe/Sofia) จาก Date ใดๆ */
export function sofiaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: SHOP_TIMEZONE });
}

/** เที่ยงคืนของ "วันนี้ตามเวลาร้าน" (Europe/Sofia) แสดงเป็น Date/instant ที่ถูกต้อง */
export function sofiaStartOfDay(date: Date): Date {
  return sofiaDateTimeToUTC(sofiaDateKey(date), "00:00");
}

// ─── วันเข้างานของหมอ (Therapist.workDays) ─────────────────────
// เก็บเป็น "0,1,2,…" (0=อาทิตย์ … 6=เสาร์ ตาม getUTCDay) — หมอนับเป็น capacity
// เฉพาะวันที่เข้างาน เช่น วันธรรมดามี 2 คน แต่เสาร์–อาทิตย์มีคนเดียว

/** ลำดับวันที่แสดงในหลังบ้าน (เริ่มวันจันทร์) */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "0,2,6" → [0,2,6] (ทิ้งค่าที่ไม่ใช่ 0–6 / ซ้ำ) */
export function parseWorkDays(s: string | null | undefined): number[] {
  const out = new Set<number>();
  for (const part of (s ?? "").split(",")) {
    const n = Number(part.trim());
    if (part.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/** วันในสัปดาห์ (0=อาทิตย์) ของ "YYYY-MM-DD" ตามปฏิทินร้าน */
export function weekdayOfDateKey(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();
}

/** หมอเข้างานวันนั้นหรือไม่ */
export function worksOnDateKey(workDays: number[], dateStr: string): boolean {
  return workDays.includes(weekdayOfDateKey(dateStr));
}
