// 自動プレイによる総当たり：でたらめな操作でも壊れないこと、上手なボットが遊べること
import { describe, expect, it } from 'vitest';
import { createRun } from '../src/engine/run';
import { mulberry, playOut, randomAction, smartAction } from './bot';
import type { RunMode } from '../src/engine/types';
import { enterFloor } from '../src/engine/run';
import { closeCtx, makeCtx } from '../src/engine/core';

const RUNS = Number(process.env.FUZZ_RUNS ?? 60);

const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('自動プレイ', () => {
  for (const mode of ['main', 'deep', 'daily', 'practice'] as RunMode[]) {
    it(`でたらめな操作（${mode}）で例外も不変条件の違反も起きない`, async () => {
      const errors: string[] = [];
      for (let i = 0; i < RUNS; i++) {
        const run = createRun({ mode, seed: 1000 + i * 7919, dailyDate: mode === 'daily' ? '2026-10-14' : undefined });
        const result = playOut(run, randomAction, mulberry(i + 1), 1500, 97);
        await breathe();
        errors.push(...result.errors);
        if (errors.length) break;
      }
      expect(errors).toEqual([]);
    });
  }

  it('上手なボットで本編を遊ばせても壊れない', async () => {
    const errors: string[] = [];
    for (let i = 0; i < Math.max(4, RUNS / 6); i++) {
      const run = createRun({ mode: 'main', seed: 77 + i * 104729 });
      const result = playOut(run, smartAction, mulberry(i + 5), 20000, 211);
      await breathe();
      errors.push(...result.errors);
      if (errors.length) break;
    }
    expect(errors).toEqual([]);
  });

  it('深い階・ボスの階でも壊れない（強くしたプレイヤーで）', async () => {
    const errors: string[] = [];
    const cases: [RunMode, number][] = [['main', 15], ['main', 25], ['main', 29], ['main', 30], ['deep', 45], ['deep', 70], ['deep', 98], ['deep', 99], ['daily', 9]];
    for (const [i, [mode, floor]] of cases.entries()) {
      for (let k = 0; k < 6; k++) {
        const run = createRun({ mode, seed: 500 + i * 31 + k * 977, dailyDate: mode === 'daily' ? '2026-10-14' : undefined });
        const ctx = makeCtx(run);
        enterFloor(ctx, floor, []);
        closeCtx(ctx);
        Object.assign(run.player, { lv: 30, maxHp: 400, hp: 400, str: 20, maxStr: 20 });
        const policy = k % 2 ? randomAction : smartAction;
        const result = playOut(run, policy, mulberry(i * 10 + k), 1500, 53);
        await breathe();
        errors.push(...result.errors);
      }
    }
    expect(errors).toEqual([]);
  });

  it('最上階のボスを倒すと階段が現れ、降りると踏破になる', async () => {
    let cleared = 0;
    for (let k = 0; k < 4; k++) {
      const run = createRun({ mode: 'main', seed: 4242 + k });
      const ctx = makeCtx(run);
      enterFloor(ctx, 30, []);
      closeCtx(ctx);
      Object.assign(run.player, { lv: 40, maxHp: 900, hp: 900, str: 30, maxStr: 30, hunger: 100 });
      // 流れの確認なので倒れないようにする（強さの調整は balance で見る）
      run.player.st.invincible = 99999;
      const result = playOut(run, smartAction, mulberry(k), 4000);
      await breathe();
      expect(result.errors).toEqual([]);
      if (result.run.end?.kind === 'clear') { cleared++; expect(result.run.bossDown).toBe(true); }
    }
    expect(cleared).toBeGreaterThan(0);
  });
});

