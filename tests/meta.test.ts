// 村：持ち込み・持ち帰り・図鑑・記録・毎日の挑戦・鍛冶屋・よろず屋・保存
import { describe, expect, it } from 'vitest';
import { buyGoods, defaultMeta, departure, finishRun, forge, forgeCost, sellFromStorage } from '../src/engine/meta';
import { KEY_META, KEY_RUN, loadMeta, loadRun, saveMeta, saveRun, type KV } from '../src/engine/save';
import { step } from '../src/engine/step';

function memory(): KV & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, removeItem: (k) => { delete data[k]; } };
}

describe('村', () => {
  it('倉庫から本編へ持ち込み、倒れると失い、帰還すると持ち帰れる', () => {
    const meta = defaultMeta();
    meta.gold = 0;
    buyGoods(meta, 'w_dou'); // 蓄えが無いので買えない
    expect(meta.storage).toHaveLength(0);
    meta.gold = 5000;
    buyGoods(meta, 'w_dou');
    buyGoods(meta, 'g_yakusou');
    expect(meta.storage).toHaveLength(2);
    const sword = meta.storage[0].uid;
    const run = departure(meta, 'main', [sword], 1);
    expect(meta.storage).toHaveLength(1);
    expect(run.player.inv.some((i) => i.id === 'w_dou')).toBe(true);
    // 帰還
    run.end = { kind: 'return', cause: '帰還の巻物', floor: 3 };
    run.player.gold = 120;
    const s = finishRun(meta, run);
    expect(s.kept.some((i) => i.id === 'w_dou')).toBe(true);
    expect(meta.gold).toBeGreaterThan(5000 - 2000);
    expect(meta.storage.some((i) => i.id === 'w_dou')).toBe(true);
    // 倒れる
    const before = meta.storage.length;
    const run2 = departure(meta, 'main', meta.storage.map((i) => i.uid), 2);
    run2.end = { kind: 'dead', cause: '子狐', floor: 2 };
    const s2 = finishRun(meta, run2);
    expect(s2.kept).toHaveLength(0);
    expect(meta.storage.length).toBe(0);
    expect(before).toBeGreaterThan(0);
    expect(meta.records.runs[0].cause).toBe('子狐');
  });

  it('深層は本編を踏破するまで開かない', () => {
    const meta = defaultMeta();
    expect(() => departure(meta, 'deep', [], 1)).toThrow();
    const run = departure(meta, 'main', [], 1);
    run.end = { kind: 'clear', cause: '踏破', floor: 30 };
    run.stats.maxFloor = 30;
    const s = finishRun(meta, run);
    expect(s.unlockedDeep).toBe(true);
    expect(meta.titles).toContain('clear');
    const deep = departure(meta, 'deep', [], 2);
    expect(deep.mode).toBe('deep');
  });

  it('毎日の挑戦は日付で同じ迷宮になり、最初の1回だけが本番として残る', () => {
    const meta = defaultMeta();
    const a = departure(meta, 'daily', [], 111, '2026-10-14');
    const b = departure(meta, 'daily', [], 999, '2026-10-14');
    expect(JSON.stringify(a.floor.tiles)).toBe(JSON.stringify(b.floor.tiles));
    a.end = { kind: 'dead', cause: '河童', floor: 4 };
    const s = finishRun(meta, a);
    expect(s.dailyBest).toBe(true);
    const first = meta.daily['2026-10-14'].score;
    b.end = { kind: 'clear', cause: '踏破', floor: 10 };
    b.floorNo = 10;
    const s2 = finishRun(meta, b);
    expect(s2.dailyBest).toBe(false);
    expect(meta.daily['2026-10-14'].score).toBe(first);
  });

  it('図鑑：会った敵・倒した敵・正体の分かった道具が残る', () => {
    const meta = defaultMeta();
    const run = departure(meta, 'main', [], 5);
    for (let i = 0; i < 50 && !run.end; i++) step(run, { t: 'wait' });
    run.stats.killedIds.tanuki1 = 2;
    run.known.g_chikara = true;
    run.end = { kind: 'quit', cause: 'あきらめた', floor: 1 };
    finishRun(meta, run);
    expect(meta.book.mon.tanuki1.kills).toBe(2);
    expect(meta.book.item.g_chikara).toBe(true);
  });

  it('鍛冶屋は蓄えで倉庫の武器を+1し、売ると蓄えが増える', () => {
    const meta = defaultMeta();
    meta.gold = 10000;
    buyGoods(meta, 'w_dou');
    const item = meta.storage[0];
    const cost = forgeCost(item)!;
    const gold = meta.gold;
    forge(meta, item.uid);
    expect(item.plus).toBe(1);
    expect(meta.gold).toBe(gold - cost);
    sellFromStorage(meta, item.uid);
    expect(meta.storage).toHaveLength(0);
    expect(meta.gold).toBeGreaterThan(gold - cost);
  });

  it('保存：村と冒険の途中を書いて読める。壊れていたら既定値', () => {
    const kv = memory();
    const meta = defaultMeta();
    meta.gold = 77;
    saveMeta(meta, kv);
    expect(loadMeta(kv).gold).toBe(77);
    const run = departure(meta, 'main', [], 3);
    saveRun(run, kv);
    expect(loadRun(kv)?.seed).toBe(run.seed);
    run.end = { kind: 'dead', cause: 'x', floor: 1 };
    saveRun(run, kv);
    expect(kv.data[KEY_RUN]).toBeUndefined();
    kv.data[KEY_META] = '{broken';
    expect(loadMeta(kv).gold).toBe(500);
  });
});
