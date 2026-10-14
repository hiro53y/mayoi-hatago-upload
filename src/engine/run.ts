// 冒険の始まりと階の移動
import { FAKE_NAMES, ITEMS, UNID_CATS, itemDef } from '../content/items';
import { BANDS, MODE_FLOORS, bandOf, dangerOf } from '../content/world';
import { hashSeed, pick, range, shuffle } from './rng';
import { generateFloor } from './mapgen';
import { canStand, updateSight, vacant } from './geo';
import { ev, log, newUid, type Ctx } from './core';
import { createMonster, makeThief, onEnterRoom } from './actors';
import { DX, DY, type Item, type Monster, type Run, type RunMode } from './types';

export const RUN_VERSION = 2;

/** 中継の宿場になる階（本編10・20階、深層30・60・90階） */
export function isTownFloor(mode: RunMode, no: number): boolean {
  if (mode === 'main') return no === 10 || no === 20;
  if (mode === 'deep') return no % 30 === 0 && no < 99;
  return false;
}

export interface NewRunOptions {
  mode: RunMode;
  seed: number;
  /** 倉庫から持ち込む道具 */
  carry?: Item[];
  dailyDate?: string;
}

/** 最初の持ち物 */
function starterKit(mode: RunMode): { id: string; plus?: number; known?: boolean }[] {
  switch (mode) {
    case 'main': return [{ id: 'w_bokuto', plus: 0, known: true }, { id: 'a_mokuyoroi', plus: 0, known: true }, { id: 'f_onigiri' }, { id: 'g_yakusou' }];
    case 'deep': return [{ id: 'f_onigiri' }, { id: 'f_onigiri' }, { id: 'w_bokuto', plus: 0, known: true }, { id: 'a_mokuyoroi', plus: 0, known: true }];
    case 'daily': return [{ id: 'w_dou', plus: 1, known: true }, { id: 'a_dou', plus: 1, known: true }, { id: 'f_onigiri' }, { id: 'g_yakusou' }, { id: 'g_yakusou' }, { id: 's_shikibetsu' }];
    case 'practice': return [{ id: 'w_bokuto', plus: 0, known: true }, { id: 'a_mokuyoroi', plus: 0, known: true }, { id: 'f_onigiri' }, { id: 'g_yakusou' }, { id: 'g_yakusou' }, { id: 't_fukitobashi' }, { id: 'g_suimin' }, { id: 'r_ki' }];
  }
}

export function createRun(o: NewRunOptions): Run {
  const run: Run = {
    v: RUN_VERSION,
    mode: o.mode,
    seed: o.seed | 0,
    rng: hashSeed(o.seed, 'play', o.mode),
    turn: 0,
    floorNo: 0,
    lastFloor: MODE_FLOORS[o.mode],
    player: {
      x: 0, y: 0, dir: 4, hp: 20, maxHp: 20, lv: 1, exp: 0, str: 8, maxStr: 8, hunger: 100, maxHunger: 100, gold: 0,
      inv: [], eq: {}, st: {}, regen: 0, hungerAcc: 0,
    },
    floor: null as unknown as Run['floor'],
    monsters: [],
    nextUid: 1,
    log: [],
    known: {},
    fake: {},
    named: {},
    stats: { kills: 0, turns: 0, maxFloor: 1, itemsUsed: 0, synth: 0, stolen: 0, allies: 0, killedIds: {}, seenIds: {} },
    end: null,
    thief: false,
    spawnIn: 40,
    prompt: null,
  };
  if (o.dailyDate) run.dailyDate = o.dailyDate;
  // 仮の名前（遊ぶたびに変わる。毎日の挑戦は日付で決まる）
  const nameRng = { s: hashSeed(o.seed, 'names') };
  for (const cat of UNID_CATS) {
    const names = shuffle(nameRng, [...FAKE_NAMES[cat]]);
    ITEMS.filter((d) => d.cat === cat).forEach((d, i) => { run.fake[d.id] = names[i % names.length]; });
  }
  const p = run.player;
  for (const k of starterKit(o.mode)) {
    const def = itemDef(k.id);
    const item: Item = { uid: run.nextUid++, id: k.id };
    if (k.plus !== undefined) { item.plus = k.plus; item.seals = []; item.cursed = false; }
    if (k.known) item.known = true;
    if (def.cat === 'staff' && def.charges) item.charges = def.charges[1];
    if (def.cat === 'arrow') item.count = 20;
    p.inv.push(item);
    run.known[k.id] = true;
  }
  for (const carried of o.carry ?? []) {
    const copy = JSON.parse(JSON.stringify(carried)) as Item;
    copy.uid = run.nextUid++;
    for (const inner of copy.contents ?? []) inner.uid = run.nextUid++;
    p.inv.push(copy);
    // 倉庫から持ち込んだ物は正体が分かっている
    run.known[copy.id] = true;
    for (const inner of copy.contents ?? []) run.known[inner.id] = true;
  }
  // いちばん強い武器・防具を装備しておく（呪われた物は避ける）
  for (const slot of ['weapon', 'armor', 'charm', 'arrow'] as const) {
    const power = (i: Item) => (itemDef(i.id).power ?? 0) + (i.plus ?? 0) + (i.seals?.length ?? 0) * 0.5;
    const best = p.inv.filter((i) => itemDef(i.id).cat === slot && !i.cursed).sort((a, b) => power(b) - power(a))[0];
    if (best) p.eq[slot] = best.uid;
  }
  const ctx: Ctx = { run, ev: [], r: { s: run.rng }, fields: new Map() };
  enterFloor(ctx, 1, []);
  run.rng = ctx.r.s;
  return run;
}

/** 階に入る。仲間は隣に連れていく */
export function enterFloor(ctx: Ctx, no: number, allies: Monster[]) {
  const run = ctx.run;
  run.floorNo = no;
  run.stats.maxFloor = Math.max(run.stats.maxFloor, no);
  const band = bandOf(run.mode, no);
  const danger = dangerOf(run.mode, no);
  const boss = (run.mode === 'main' && no === MODE_FLOORS.main) || (run.mode === 'deep' && no === MODE_FLOORS.deep);
  const town = isTownFloor(run.mode, no);
  const genRng = { s: hashSeed(run.seed, run.mode, 'floor', no) };
  const gen = generateFloor(genRng, {
    mode: run.mode, no, danger, band, liquid: BANDS[band].liquid, boss, town, banned: run.banned ?? {}, newUid: () => newUid(run),
  });
  run.floor = gen.floor;
  run.monsters = [];
  run.player.x = gen.start.x;
  run.player.y = gen.start.y;
  run.prompt = null;
  for (const s of gen.spawns) {
    const m = createMonster(ctx, s.id, s.x, s.y, !s.asleep, s.role);
    if (s.asleep) m.awake = false;
    if (s.npc) m.npc = s.npc;
    if (s.role === 'keeper' && run.floor.shop) run.floor.shop.keeper = m.uid;
    // 化け狸は、寝ている間は道具に化けている
    if (s.asleep && (s.id === 'tanuki2' || s.id === 'tanuki3')) {
      m.disguise = pick(genRng, ['g_yakusou', 'g_daiyakusou', 's_shikibetsu', 'f_onigiri', 'g_chikara']);
      run.stats.seenIds[s.id] = undefined as unknown as true;
      delete run.stats.seenIds[s.id];
    }
  }
  // 仲間を隣に置く
  for (const ally of allies) {
    let placed = false;
    for (let r = 1; r <= 3 && !placed; r++) {
      for (let d = 0; d < 8 && !placed; d++) {
        const x = run.player.x + DX[d] * r, y = run.player.y + DY[d] * r;
        if (canStand(run.floor, x, y, 'walk') && vacant(run, x, y)) {
          ally.x = x; ally.y = y; ally.goal = null; ally.wander = null;
          run.monsters.push(ally);
          placed = true;
        }
      }
    }
  }
  run.spawnIn = range(ctx.r, 30, 60);
  updateSight(run);
  onEnterRoom(ctx);
  ev(ctx, { k: 'floor' });
  const name = BANDS[band].name;
  if (gen.floor.kind === 'boss') log(ctx, `${no}階 ── 最上階。強大な気配がする……`, 'warn');
  else if (gen.floor.kind === 'town') log(ctx, `${no}階 ── 宿場に着いた。ここに敵はいない。宿・倉庫番・辻占いに話しかけてみよう。`, 'good');
  else log(ctx, `${no}階（${name}）に着いた。`, 'info');
  if (gen.floor.dark) log(ctx, 'この階は暗闇に包まれている。', 'warn');
  if (gen.floor.fog) log(ctx, 'この階は霧が立ちこめている。', 'warn');
  if (gen.floor.kind === 'big') log(ctx, 'この階は大部屋だ！', 'warn');
  if (gen.floor.shop) log(ctx, 'どこかに店がある気配がする。', 'info');
  if (run.mode === 'practice') tutorial(ctx, no);
}

function tutorial(ctx: Ctx, no: number) {
  const lines: Record<number, string[]> = {
    1: ['【道場】十字パッドで8方向に動ける。斜めにも動けるのが大事。', '【道場】敵に向かって進むか「攻撃」で叩く。叩くと1ターン進む。', '【道場】階段を見つけたら上に乗って「階段」で降りよう。'],
    2: ['【道場】道具は「道具」から使う。草は飲む、巻物は読む、杖は振る。', '【道場】杖や矢は離れた敵に効く。向きを変えるには「向き」を押してから方向を選ぶ。', '【道場】Bを押しながら動くとダッシュできる。'],
    3: ['【道場】お腹が減るとHPが減っていく。おにぎりを食べよう。', '【道場】正体の分からない道具は、使うか識別すると分かる。', '【道場】階段を降りれば練習は終わり。村で本番に備えよう。'],
  };
  for (const t of lines[no] ?? []) log(ctx, t, 'info');
  ctx.run.tutorial = no;
}

/** 次の階へ。最後の階なら踏破 */
export function descend(ctx: Ctx) {
  const run = ctx.run;
  // 店の品を持ったまま離れたら泥棒
  if (run.player.inv.some((i) => i.shop || (i.contents ?? []).some((c) => c.shop))) makeThief(ctx);
  if (run.floorNo >= run.lastFloor) {
    run.end = { kind: 'clear', cause: '踏破', floor: run.floorNo };
    log(ctx, run.mode === 'main' ? '天守の頂にたどり着いた！' : '迷宮を踏破した！', 'good');
    ev(ctx, { k: 'se', name: 'clear' });
    return;
  }
  const allies = run.monsters.filter((m) => m.ally && !m.dead);
  run.pendingFall = false;
  run.half = 0;
  enterFloor(ctx, run.floorNo + 1, allies);
  ev(ctx, { k: 'se', name: 'stairs' });
}
