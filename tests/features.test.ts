// 2.1 で足した仕組みのテスト：宿場・化け狸・新しい道具・自動の向き・整頓・古いセーブ
import { describe, expect, it } from 'vitest';
import { at } from '../src/engine/geo';
import { closeCtx, makeCtx } from '../src/engine/core';
import { createRun, enterFloor, isTownFloor } from '../src/engine/run';
import { defaultMeta, finishRun } from '../src/engine/meta';
import { deserializeRun, serializeRun } from '../src/engine/save';
import { generateFloor } from '../src/engine/mapgen';
import { step } from '../src/engine/step';
import { T_FLOOR, T_WALL } from '../src/engine/types';
import { act, arena, freeze, give, logText, spawn } from './helpers';

function townRun(seed = 10) {
  const run = createRun({ mode: 'main', seed });
  const ctx = makeCtx(run);
  enterFloor(ctx, 10, []);
  closeCtx(ctx);
  return run;
}

describe('宿場', () => {
  it('本編10・20階と深層30・60・90階が宿場で、敵がいない', () => {
    expect([10, 20].every((n) => isTownFloor('main', n))).toBe(true);
    expect([30, 60, 90].every((n) => isTownFloor('deep', n))).toBe(true);
    expect(isTownFloor('main', 30) || isTownFloor('deep', 99) || isTownFloor('daily', 10)).toBe(false);
    const run = townRun();
    expect(run.floor.kind).toBe('town');
    expect(run.monsters.filter((m) => m.role !== 'npc' && m.role !== 'keeper')).toHaveLength(0);
    expect(run.monsters.filter((m) => m.role === 'npc').map((m) => m.npc).sort()).toEqual(['bank', 'inn', 'seer']);
    expect(run.floor.shop).not.toBeNull();
    expect(run.floor.items.some((fi) => fi.item.id === 'w_tsuruhashi')).toBe(true);
    for (let i = 0; i < 300; i++) step(run, { t: 'wait' });
    expect(run.monsters.filter((m) => !m.role)).toHaveLength(0);
    expect(run.floorNo).toBe(10);
  });

  it('宿に泊まると全回復、倉庫番に預けた物とお金は倒れても村に届く、辻占いは識別する', () => {
    const run = townRun(11);
    const inn = run.monsters.find((m) => m.npc === 'inn')!;
    run.player.x = inn.x; run.player.y = inn.y + 1;
    run.player.hp = 3; run.player.hunger = 5; run.player.gold = 5000;
    act(run, { t: 'move', dir: 0 });
    expect(run.prompt?.kind).toBe('npc');
    act(run, { t: 'npc', who: 'inn' });
    expect(run.player.hp).toBe(run.player.maxHp);
    expect(run.player.hunger).toBe(run.player.maxHunger);
    // 倉庫番
    const herb = give(run, 'g_inochi');
    run.prompt = { kind: 'npc', who: 'bank', cost: 0 };
    act(run, { t: 'npc', who: 'bank', target: herb.uid });
    act(run, { t: 'npc', who: 'bank', gold: true });
    expect(run.player.inv).not.toContain(herb);
    expect(run.player.gold).toBe(0);
    // 辻占い
    run.player.gold = 1000;
    const staff = give(run, 't_henge');
    run.prompt = { kind: 'npc', who: 'seer', cost: 150 };
    act(run, { t: 'npc', who: 'seer', target: staff.uid });
    expect(run.known.t_henge).toBe(true);
    act(run, { t: 'answer', yes: false });
    expect(run.prompt).toBeNull();
    // 倒れても預けた物は届く
    run.end = { kind: 'dead', cause: 'テスト', floor: 10 };
    const meta = defaultMeta();
    const gold = meta.gold;
    const s = finishRun(meta, run);
    expect(s.deposited.some((i) => i.id === 'g_inochi')).toBe(true);
    expect(meta.storage.some((i) => i.id === 'g_inochi')).toBe(true);
    expect(meta.gold).toBeGreaterThan(gold);
  });

  it('宿場の人は叩いても傷つかない', () => {
    const run = townRun(12);
    const seer = run.monsters.find((m) => m.npc === 'seer')!;
    run.player.x = seer.x; run.player.y = seer.y + 1; run.player.dir = 0;
    for (let i = 0; i < 5; i++) act(run, { t: 'attack' });
    expect(seer.hp).toBe(seer.maxHp);
  });
});

describe('化け狸', () => {
  it('寝ている化け狸は道具に化けていて、隣に行くと正体を現す', () => {
    let found = false;
    for (let seed = 1; seed < 400 && !found; seed++) {
      let uid = 1;
      const g = generateFloor({ s: seed }, { mode: 'main', no: 13, danger: 13, band: 2, liquid: null, boss: false, newUid: () => uid++ });
      if (g.spawns.some((s) => s.asleep && (s.id === 'tanuki2' || s.id === 'tanuki3'))) found = true;
    }
    expect(found).toBe(true);
    const run = arena();
    const m = spawn(run, 'tanuki2', 13, 10, false);
    m.disguise = 'g_yakusou';
    act(run, { t: 'wait' });
    expect(m.disguise).toBe('g_yakusou');
    act(run, { t: 'move', dir: 2 });
    act(run, { t: 'move', dir: 2 });
    act(run, { t: 'wait' });
    expect(m.disguise).toBeUndefined();
    expect(logText(run)).toContain('化けていた');
  });
});

describe('新しい道具', () => {
  it('根切りの巻物：見えている敵の種類がこの冒険から消える', () => {
    const run = arena();
    spawn(run, 'kappa1', 14, 10);
    spawn(run, 'kappa1', 18, 12);
    const scroll = give(run, 's_nekiri');
    act(run, { t: 'item', uid: scroll.uid, verb: 'use' });
    expect(run.monsters.some((m) => m.id === 'kappa1')).toBe(false);
    expect(run.banned?.kappa1).toBe(true);
    const ctx = makeCtx(run);
    enterFloor(ctx, 3, []);
    closeCtx(ctx);
    expect(run.monsters.some((m) => m.id === 'kappa1')).toBe(false);
  });

  it('爆裂の巻物：周りの壁と敵を吹き飛ばす', () => {
    const run = arena();
    run.player.x = 5; run.player.y = 10;
    const m = spawn(run, 'yoroi1', 6, 10);
    freeze(m);
    const scroll = give(run, 's_bakuretsu');
    act(run, { t: 'item', uid: scroll.uid, verb: 'use' });
    expect(run.floor.tiles[at(run.floor, 4, 10)]).toBe(T_FLOOR);
    expect(m.hp < m.maxHp || m.dead).toBe(true);
  });

  it('身代わりの杖：ほかの敵が身代わりを襲う', () => {
    const run = arena();
    const decoy = spawn(run, 'yoroi2', 13, 10);
    const other = spawn(run, 'kitsune2', 16, 10);
    const staff = give(run, 't_migawari');
    run.player.dir = 2;
    act(run, { t: 'item', uid: staff.uid, verb: 'use' });
    expect(decoy.st.decoy).toBeGreaterThan(0);
    for (let i = 0; i < 6; i++) act(run, { t: 'wait' });
    expect(decoy.hp < decoy.maxHp || decoy.dead || other.id !== 'kitsune2').toBe(true);
  });

  it('姿隠しの草：離れた敵に気づかれない', () => {
    const run = arena();
    const m = spawn(run, 'tanuki1', 20, 10);
    run.player.st.hidden = 30;
    for (let i = 0; i < 8; i++) act(run, { t: 'wait' });
    expect(m.goal === null || m.goal === undefined || (m.goal.x !== run.player.x || m.goal.y !== run.player.y)).toBe(true);
  });

  it('火炎草の炎で床のおにぎりは焼け、巻物は燃える', () => {
    const run = arena();
    run.floor.items.push({ x: 12, y: 10, item: { uid: run.nextUid++, id: 'f_onigiri' } });
    run.floor.items.push({ x: 14, y: 10, item: { uid: run.nextUid++, id: 's_chizu' } });
    const herb = give(run, 'g_kaen');
    run.player.dir = 2;
    act(run, { t: 'item', uid: herb.uid, verb: 'use' });
    expect(run.floor.items.some((fi) => fi.item.id === 'f_yaki')).toBe(true);
    expect(run.floor.items.some((fi) => fi.item.id === 's_chizu')).toBe(false);
  });
});

describe('操作の便利さ', () => {
  it('攻撃は、向いた先に敵がおらず隣の敵が1体だけなら、その敵を向いて叩く', () => {
    const run = arena();
    const m = spawn(run, 'yoroi1', 10, 11);
    freeze(m);
    run.player.dir = 0;
    for (let i = 0; i < 5; i++) act(run, { t: 'attack' });
    expect(run.player.dir).toBe(4);
    expect(m.hp < m.maxHp || m.dead).toBe(true);
  });

  it('整頓で持ち物が種類ごとに並ぶ', () => {
    const run = arena();
    give(run, 'f_onigiri');
    give(run, 'w_dou');
    act(run, { t: 'sort' });
    const cats = run.player.inv.map((i) => i.id[0]);
    expect(cats.indexOf('w')).toBeLessThan(cats.lastIndexOf('f'));
  });

  it('2.0 のセーブ（番人を含む）も読み込める', () => {
    const run = createRun({ mode: 'main', seed: 5 });
    const raw = JSON.parse(serializeRun(run));
    raw.monsters.push({ ...raw.monsters[0], uid: 9999, id: 'guard', role: 'guard' });
    const back = deserializeRun(JSON.stringify(raw));
    expect(back).not.toBeNull();
    expect(back!.monsters.some((m) => m.id === 'guard')).toBe(false);
  });

  it('壁を掘った場所は床になり、つながりが広がる', () => {
    const run = arena();
    run.player.x = 24; run.player.y = 10; run.player.dir = 2;
    const staff = give(run, 't_kussaku');
    act(run, { t: 'item', uid: staff.uid, verb: 'use' });
    expect(run.floor.tiles[at(run.floor, 30, 10)]).toBe(T_FLOOR);
    expect(run.floor.tiles[at(run.floor, 24, 4)]).toBe(T_WALL);
  });
});
