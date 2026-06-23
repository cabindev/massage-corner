// สีประจำหมอนวด — ผูกกับ id แบบคงที่ (ไม่ต้องเก็บ DB) ใช้ได้ทั้ง client/server
export type TColor = { base: string; bg: string; text: string };

const PALETTE: TColor[] = [
  { base: "#2f6b57", bg: "#e6efe9", text: "#234f41" }, // emerald
  { base: "#b8965a", bg: "#f4ecda", text: "#7d6435" }, // gold
  { base: "#c2674e", bg: "#f7e7e1", text: "#8a4233" }, // terracotta
  { base: "#4f6d7a", bg: "#e5ecef", text: "#33484f" }, // slate
  { base: "#7a5a78", bg: "#efe8ef", text: "#523c51" }, // plum
  { base: "#6f8b5a", bg: "#eaf0e3", text: "#4a5e3b" }, // sage
  { base: "#a9743f", bg: "#f3e9dc", text: "#724e2a" }, // rust
  { base: "#3f8a86", bg: "#e1efee", text: "#2a5d5a" }, // teal
];

const UNASSIGNED: TColor = { base: "#9ca3af", bg: "#eef0f2", text: "#5b6168" };

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function therapistColor(id?: string | null): TColor {
  if (!id) return UNASSIGNED;
  return PALETTE[hash(id) % PALETTE.length];
}
