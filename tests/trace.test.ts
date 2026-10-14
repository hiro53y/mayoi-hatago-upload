// 1回分の自動プレイの記録を表示する（TRACE=番号 の時だけ）
import { describe, it } from 'vitest';
import { createRun } from '../src/engine/run';
import { mulberry, playOut, smartAction } from './bot';
import type { RunMode } from '../src/engine/types';

const I = process.env.TRACE;
const MODE = (process.env.RUN_MODE ?? 'main') as RunMode;

describe.runIf(I !== undefined)('記録', () => {
  it('ボット1回', () => {
    const i = Number(I);
    const run = createRun({ mode: MODE, seed: 9000 + i * 7717, dailyDate: MODE === 'daily' ? '2026-10-14' : undefined });
    const res = playOut(run, smartAction, mulberry(i + 99), 60000);
    const r = res.run;
    console.log(res.errors.join('\n'));
    console.log(`end=${JSON.stringify(r.end)} lv=${r.player.lv} hp=${r.player.hp}/${r.player.maxHp} str=${r.player.str} turn=${r.turn} floor=${r.floorNo}`);
    console.log(r.player.inv.map((x) => x.id + (x.plus ? `+${x.plus}` : '')).join(','));
    console.log(r.log.slice(-Number(process.env.LINES ?? 40)).map((l) => l.t).join('\n'));
  });
});
