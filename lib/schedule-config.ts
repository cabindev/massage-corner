// ค่าคงที่เวลาทำการ (ไม่มี dependency ฝั่ง server — ใช้ได้ทั้ง client/server)
export const OPEN_MINUTES = 10 * 60 + 30; // เปิด 10:30
export const CLOSE_MINUTES = 19 * 60; // ปิด 19:00 (คิวต้องจบไม่เกินเวลานี้)
export const SLOT_STEP_MINUTES = 30; // ช่วงเวลาทุก 30 นาที

/** เวลาเริ่มคิวสุดท้ายที่จองได้ — ปิดรับจอง 18:00 (ช้ากว่านี้ไม่เปิดให้เลือก) */
export const LAST_SLOT_MINUTES = 18 * 60;

export const SHOP_TIMEZONE = "Europe/Sofia";

/** ปิดวันจันทร์ — เปิดทำการอังคาร–อาทิตย์ */
export function isClosedDay(date: Date): boolean {
  return date.getDay() === 1; // Sun=0, Mon=1, ...
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
