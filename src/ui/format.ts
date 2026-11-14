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
