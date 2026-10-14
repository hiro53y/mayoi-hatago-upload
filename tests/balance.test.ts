// 難易度の集計（BALANCE=回数 の時だけ動く）：上手なボットの到達階・倒れた原因・レベル
import { describe, it } from 'vitest';
import { createRun, enterFloor } from '../src/engine/run';
import { closeCtx, expFor, makeCtx } from '../src/engine/core';
import { mulberry, playOut, smartAction } from './bot';
import type { RunMode } from '../src/engine/types';

const N = Number(process.env.BALANCE ?? 0);
const MODE = (process.env.RUN_MODE ?? 'main') as RunMode;

describe.runIf(N > 0)('難易度の集計', () => {
  it(`上手なボット ${N} 回（${MODE}）`, () => {
    const floors: number[] = [];
    const causes: Record<string, number> = {};
    const lvAt: Record<number, number[]> = {};
    let clears = 0, stuck = 0, errors = 0;
    const turnsPerFloor: number[] = [];
    for (let i = 0; i < N; i++) {
      const run = createRun({ mode: MODE, seed: 9000 + i * 7717, dailyDate: MODE === 'daily' ? '2026-10-14' : undefined });
      // START=階 で、その階の想定の強さから始める（後半の難易度を見るため）
      const start = Number(process.env.START ?? 0);
      if (start > 1) {
        const ctx = makeCtx(run);
        enterFloor(ctx, start, []);
        closeCtx(ctx);
        const lv = Math.round(start * 1.05);
        Object.assign(run.player, { lv, exp: expFor(lv), maxHp: 20 + (lv - 1) * 5.5 | 0, str: 9, maxStr: 9 });
        run.player.hp = run.player.maxHp;
        const tier = start >= 20 ? ['w_hagane', 'a_hagane'] : ['w_tetsu', 'a_tetsu'];
        run.player.inv = [];
        run.player.eq = {};
        for (const id of [...tier, 'g_yakusou', 'g_yakusou', 'g_daiyakusou', 'f_onigiri', 'f_onigiri']) {
          const item = { uid: run.nextUid++, id, plus: id.startsWith('w_') || id.startsWith('a_') ? 3 : undefined, seals: [], known: true };
          run.player.inv.push(item);
          run.known[id] = true;
        }
        run.player.eq.weapon = run.player.inv[0].uid;
        run.player.eq.armor = run.player.inv[1].uid;
      }
      const res = playOut(run, smartAction, mulberry(i + 99), 60000);
      if (res.errors.length) { errors++; console.log(res.errors[0]); }
      const r = res.run;
      floors.push(r.stats.maxFloor);
      if (r.end?.kind === 'clear') clears++;
      else if (r.end) causes[r.end.cause] = (causes[r.end.cause] ?? 0) + 1;
      else stuck++;
      if (r.end && process.env.CAUSE === r.end.cause) console.log('CAUSE', i);
      (lvAt[r.stats.maxFloor] ??= []).push(r.player.lv);
      turnsPerFloor.push(r.turn / Math.max(1, r.stats.maxFloor));
    }
    floors.sort((a, b) => a - b);
    const q = (p: number) => floors[Math.min(floors.length - 1, Math.floor(floors.length * p))];
    const hist: Record<number, number> = {};
    for (const f of floors) hist[Math.floor((f - 1) / 5) * 5 + 1] = (hist[Math.floor((f - 1) / 5) * 5 + 1] ?? 0) + 1;
    const avgLv = Object.entries(lvAt).map(([f, l]) => `${f}F:Lv${(l.reduce((a, b) => a + b, 0) / l.length).toFixed(1)}`).join(' ');
    console.log(JSON.stringify({
      mode: MODE, runs: N, clears, stuck, errors,
      median: q(0.5), p25: q(0.25), p75: q(0.75), p90: q(0.9),
      hist, avgTurnsPerFloor: Math.round(turnsPerFloor.reduce((a, b) => a + b, 0) / N),
      causes: Object.fromEntries(Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 14)),
    }, null, 1));
    console.log(avgLv);
  });
});
