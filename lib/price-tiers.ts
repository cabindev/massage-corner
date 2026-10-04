// ตัวเลือกระยะเวลา/ราคาของแต่ละบริการ (ไม่มี dependency ฝั่ง server — ใช้ได้ทั้ง client/server)

/** ช่วงราคาแต่ละความยาวเวลา (price list) */
export type PriceTier = { minutes: number; price: number };

type ServiceLike = {
  durationMinutes: number;
  price: number;
  priceTiers?: unknown;
};

function asTiers(raw: unknown): PriceTier[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (t): t is PriceTier =>
      !!t &&
      Number.isInteger((t as PriceTier).minutes) &&
      (t as PriceTier).minutes > 0 &&
      Number.isFinite(Number((t as PriceTier).price))
  ).map((t) => ({ minutes: t.minutes, price: Number(t.price) }));
}

/**
 * ระยะเวลาที่จองได้ของบริการ เรียงสั้น → ยาว
 * = priceTiers + ระยะเวลาหลักของบริการ (เผื่อ tiers ไม่มีค่านั้น — การจองเดิมทุกตัวใช้ค่านี้)
 */
export function durationOptions(s: ServiceLike): PriceTier[] {
  const map = new Map<number, number>();
  for (const t of asTiers(s.priceTiers)) map.set(t.minutes, t.price);
  if (!map.has(s.durationMinutes)) map.set(s.durationMinutes, Number(s.price));
  return [...map.entries()]
    .map(([minutes, price]) => ({ minutes, price }))
    .sort((a, b) => a.minutes - b.minutes);
}

/** หา option ตามนาทีที่ขอ — ไม่ระบุ = ระยะเวลาหลักของบริการ, ไม่มีในรายการ = null */
export function pickDuration(
  s: ServiceLike,
  minutes?: number | null
): PriceTier | null {
  const want = minutes ?? s.durationMinutes;
  return durationOptions(s).find((o) => o.minutes === want) ?? null;
}

/** ราคาของการจองที่ยาว `minutes` นาที — ไม่ตรง tier ไหนเลยใช้ราคาหลักของบริการ */
export function priceForDuration(s: ServiceLike, minutes: number): number {
  return pickDuration(s, minutes)?.price ?? Number(s.price);
}
