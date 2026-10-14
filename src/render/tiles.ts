// 地形の絵：帯ごとの床・壁・水・溶岩を手続きで描き、使い回す
import { BANDS } from '../content/world';

export const TILE_PX = 64;
const cache = new Map<string, HTMLCanvasElement>();

function hash(a: number, b: number, c: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = TILE_PX;
  return [c, c.getContext('2d')!];
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * k)));
  return `rgb(${r},${g},${b})`;
}

export function floorTile(band: number, variant: number): HTMLCanvasElement {
  const key = `f${band}-${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = BANDS[band];
  const [c, g] = canvas();
  const S = TILE_PX;
  g.fillStyle = b.floor;
  g.fillRect(0, 0, S, S);
  // まだら模様
  for (let i = 0; i < 40; i++) {
    const x = hash(band, variant, i) * S, y = hash(variant, i, band) * S, r = 2 + hash(i, band, variant) * 5;
    g.fillStyle = hash(i, i, variant) > 0.5 ? shade(b.floor, 1.08) : shade(b.floor, 0.9);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = shade(b.floor, 0.78);
  g.lineWidth = 2;
  if (band === 0) {
    // 竹林：草の束
    for (let i = 0; i < 4; i++) {
      const x = 6 + hash(variant, i, 7) * (S - 12), y = 10 + hash(i, variant, 9) * (S - 14);
      g.strokeStyle = b.accent;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 7); g.moveTo(x, y); g.lineTo(x + 1, y - 9); g.moveTo(x, y); g.lineTo(x + 4, y - 6); g.stroke();
    }
  } else if (band === 1 || band === 3) {
    // 洞窟・坑道：小石とひび
    for (let i = 0; i < 5; i++) {
      const x = hash(variant, i, 3) * S, y = hash(i, variant, 5) * S;
      g.fillStyle = shade(b.floor, 0.7);
      g.beginPath(); g.ellipse(x, y, 3 + hash(i, 1, variant) * 3, 2 + hash(i, 2, variant) * 2, 0, 0, Math.PI * 2); g.fill();
    }
    if (band === 3) {
      g.strokeStyle = 'rgba(255,120,40,0.35)';
      g.beginPath(); g.moveTo(hash(variant, 1, 1) * S, 0); g.lineTo(S / 2, S / 2); g.lineTo(hash(variant, 2, 2) * S, S); g.stroke();
    }
  } else if (band === 2 || band === 4) {
    // 水路・墓所：敷石
    g.strokeStyle = shade(b.floor, 0.72);
    g.strokeRect(1, 1, S / 2 - 2, S / 2 - 2); g.strokeRect(S / 2 + 1, 1, S / 2 - 2, S / 2 - 2);
    g.strokeRect(1 + (variant % 2) * 8, S / 2 + 1, S / 2 - 2, S / 2 - 2); g.strokeRect(S / 2 + 1, S / 2 + 1, S / 2 - 2, S / 2 - 2);
  } else if (band === 5) {
    // 天守：板張り
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = shade(b.floor, 0.75);
      g.beginPath(); g.moveTo(0, i * 16 + 1); g.lineTo(S, i * 16 + 1); g.stroke();
      const x = ((i + variant) % 3) * 22 + 8;
      g.beginPath(); g.moveTo(x, i * 16 + 1); g.lineTo(x, i * 16 + 17); g.stroke();
    }
  }
  // 縁を少し暗く（マス目が分かるように）
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, S - 1, S - 1);
  cache.set(key, c);
  return c;
}

/** 壁。front は下が床の壁（正面が見える） */
export function wallTile(band: number, front: boolean, variant: number): HTMLCanvasElement {
  const key = `w${band}-${front ? 1 : 0}-${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = BANDS[band];
  const [c, g] = canvas();
  const S = TILE_PX;
  g.fillStyle = b.wall;
  g.fillRect(0, 0, S, S);
  if (band === 0) {
    // 竹
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 16 + hash(variant, i, 1) * 4;
      g.fillStyle = shade(b.wallTop, 0.9 + hash(i, variant, 2) * 0.3);
      g.fillRect(x, 0, 9, S);
      g.fillStyle = shade(b.wallTop, 1.35);
      g.fillRect(x + 1, 0, 2, S);
      g.fillStyle = shade(b.wall, 0.7);
      for (let k = 0; k < 3; k++) g.fillRect(x, ((k * 22 + i * 7 + variant * 5) % S), 9, 2);
    }
  } else {
    // 岩・石垣
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * 24 - (row % 2) * 12, y = row * 16;
        g.fillStyle = shade(b.wallTop, 0.75 + hash(row, col, variant + band) * 0.4);
        g.fillRect(x + 1, y + 1, 22, 14);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(x + 1, y + 1, 22, 3);
      }
    }
  }
  if (front) {
    // 正面：下側を暗く、上端に光
    const grad = g.createLinearGradient(0, S * 0.45, 0, S);
    grad.addColorStop(0, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = grad;
    g.fillRect(0, S * 0.45, S, S * 0.55);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, S - 4, S, 4);
  } else {
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 0, S, S);
  }
  cache.set(key, c);
  return c;
}

/** 水・溶岩（4コマのゆらぎ） */
export function liquidTile(kind: 'water' | 'lava', frame: number): HTMLCanvasElement {
  const key = `${kind}-${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas();
  const S = TILE_PX;
  if (kind === 'water') {
    const grad = g.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#2f6f96');
    grad.addColorStop(1, '#1d4a6c');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(200,240,255,0.45)';
    g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const y = 12 + i * 20, off = (frame * 8 + i * 13) % S;
      g.beginPath();
      g.moveTo(off - 14, y); g.quadraticCurveTo(off - 7, y - 5, off, y); g.quadraticCurveTo(off + 7, y + 5, off + 14, y);
      g.stroke();
    }
  } else {
    const grad = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S * 0.75);
    grad.addColorStop(0, frame % 2 ? '#ffb347' : '#ff9a2e');
    grad.addColorStop(1, '#a3260e');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(60,10,0,0.55)';
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(hash(i, frame, 1) * S, hash(i, 2, frame) * S);
      g.lineTo(hash(i, frame, 3) * S, hash(i, 4, frame) * S);
      g.stroke();
    }
  }
  cache.set(key, c);
  return c;
}
