export function fmt(n: number): string {
  if (Math.abs(n) < 1000) return Math.abs(n) < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  const units = ['K', 'M', 'B', 'T'];
  let u = -1;
  while (Math.abs(n) >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  return `${n.toFixed(Math.abs(n) < 10 ? 2 : Math.abs(n) < 100 ? 1 : 0)}${units[u]}`;
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
}

// The LED board: short forms that never change its width. 1206 -> 1.2K.
export function fmtWL(n: number): string {
  if (n < 1000) return String(n);
  const units = ['K', 'M', 'B'];
  let u = -1;
  while (n >= 1000 && u < units.length - 1) (n /= 1000), u++;
  return `${n < 100 ? (Math.floor(n * 10) / 10).toFixed(1) : Math.floor(n)}${units[u]}`;
}
export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
}
