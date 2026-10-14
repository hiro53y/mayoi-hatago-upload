// 地図の生成：2,000通りの seed で、つながり・階段・店・敵の配置を確かめる
import { describe, expect, it } from 'vitest';
import { generateFloor, roomDoors } from '../src/engine/mapgen';
import { at, canStand, distanceField } from '../src/engine/geo';
import { bandOf, BANDS, dangerOf } from '../src/content/world';
import { T_FLOOR, T_HARD, type RunMode } from '../src/engine/types';

describe('地図の生成', () => {
  it('2,000通りの階で、歩ける床がすべて階段とスタートにつながっている', () => {
    const problems: string[] = [];
    let uid = 1;
    let shops = 0, houses = 0, bigs = 0, darks = 0;
    for (let i = 0; i < 2000; i++) {
      const mode: RunMode = (['main', 'deep', 'daily', 'practice'] as RunMode[])[i % 4];
      const no = 1 + (i % (mode === 'deep' ? 98 : mode === 'main' ? 29 : mode === 'daily' ? 9 : 3));
      const band = bandOf(mode, no);
      const r = { s: i * 7919 + 13 };
      const { floor: f, spawns, start } = generateFloor(r, { mode, no, danger: dangerOf(mode, no), band, liquid: BANDS[band].liquid, boss: false, newUid: () => uid++ });
      const tag = `seed${i} ${mode}${no}F`;
      if (f.shop) shops++;
      if (f.house >= 0) houses++;
      if (f.kind === 'big') bigs++;
      if (f.dark) darks++;
      // 外周は壊せない壁
      for (let x = 0; x < f.w; x++) if (f.tiles[at(f, x, 0)] !== T_HARD || f.tiles[at(f, x, f.h - 1)] !== T_HARD) problems.push(`${tag} 外壁が欠けている`);
      const dist = distanceField(f, start, 'walk');
      if (!f.stairs) { problems.push(`${tag} 階段が無い`); continue; }
      if (dist[at(f, f.stairs.x, f.stairs.y)] < 0) problems.push(`${tag} 階段に行けない`);
      for (let k = 0; k < f.tiles.length; k++) if (f.tiles[k] === T_FLOOR && dist[k] < 0) { problems.push(`${tag} 行けない床がある`); break; }
      for (const fi of f.items) if (f.tiles[at(f, fi.x, fi.y)] !== T_FLOOR || dist[at(f, fi.x, fi.y)] < 0) problems.push(`${tag} 道具が行けない所にある`);
      const spots = new Set<number>();
      for (const s of spawns) {
        const k = at(f, s.x, s.y);
        if (spots.has(k) || (s.x === start.x && s.y === start.y)) problems.push(`${tag} 敵が重なる`);
        spots.add(k);
        if (!canStand(f, s.x, s.y, 'fly')) problems.push(`${tag} 敵が壁の中`);
      }
      if (f.shop) {
        const room = f.rooms[f.shop.room];
        const keeper = spawns.find((s) => s.role === 'keeper');
        if (!keeper) problems.push(`${tag} 店主がいない`);
        if (keeper && f.tiles[at(f, keeper.x, keeper.y)] !== T_FLOOR) problems.push(`${tag} 店主が床の外`);
        if (f.traps.some((t) => f.roomOf[at(f, t.x, t.y)] === room.id)) problems.push(`${tag} 店の中に罠`);
        // 店主は入口の正面をふさがない
        for (const d of roomDoors(f, room)) {
          const ix = Math.max(room.x, Math.min(room.x + room.w - 1, d.x)), iy = Math.max(room.y, Math.min(room.y + room.h - 1, d.y));
          if (keeper && keeper.x === ix && keeper.y === iy) problems.push(`${tag} 店主が入口をふさいでいる`);
        }
        if (!f.items.some((fi) => fi.item.shop)) problems.push(`${tag} 店に品物が無い`);
        for (const id of ['w_tsuruhashi', 't_kussaku']) {
          const tool = f.items.filter((fi) => fi.item.id === id && !fi.item.shop);
          if (tool.length < 1) problems.push(`${tag} 店の階に${id}が無い`);
          if (tool.some((fi) => f.roomOf[at(f, fi.x, fi.y)] === room.id)) problems.push(`${tag} ${id}が店の中にある`);
        }
      }
      if (problems.length > 10) break;
    }
    expect(problems).toEqual([]);
    // 特別な階もそれなりに出る
    expect(shops).toBeGreaterThan(100);
    expect(houses).toBeGreaterThan(40);
    expect(bigs).toBeGreaterThan(20);
    expect(darks).toBeGreaterThan(20);
  });

  it('最上階はボスの部屋で、階段はボスを倒すまで無い', () => {
    let uid = 1;
    const { floor, spawns } = generateFloor({ s: 5 }, { mode: 'main', no: 30, danger: 30, band: 5, liquid: null, boss: true, newUid: () => uid++ });
    expect(floor.kind).toBe('boss');
    expect(floor.stairs).toBeNull();
    expect(spawns.filter((s) => s.role === 'boss')).toHaveLength(1);
  });

  it('同じ seed なら同じ地図（毎日の挑戦が全員同じになる）', () => {
    const gen = () => {
      let uid = 1;
      return JSON.stringify(generateFloor({ s: 42 }, { mode: 'daily', no: 3, danger: 7, band: 1, liquid: null, boss: false, newUid: () => uid++ }));
    };
    expect(gen()).toBe(gen());
  });
});
