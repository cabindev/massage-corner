// ค่าคงที่เวลาทำการ (ไม่มี dependency ฝั่ง server — ใช้ได้ทั้ง client/server)
export const OPEN_MINUTES = 10 * 60 + 30; // เปิด 10:30
export const CLOSE_MINUTES = 19 * 60; // ปิด 19:00
export const SLOT_STEP_MINUTES = 30; // ช่วงเวลาทุก 30 นาที

/** ปิดวันจันทร์ — เปิดทำการอังคาร–อาทิตย์ */
export function isClosedDay(date: Date): boolean {
  return date.getDay() === 1; // Sun=0, Mon=1, ...
}
