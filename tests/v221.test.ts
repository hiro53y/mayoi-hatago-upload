import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRun } from '../src/engine/run';
import { defaultMeta, departure } from '../src/engine/meta';
import { deserializeMeta, deserializeRun, finalizeRun, KEY_META, KEY_RUN, loadMeta, loadRun, PRESERVED_PREFIX, saveMeta, saveRun, serializeRun, type KV } from '../src/engine/save';
import { step } from '../src/engine/step';
import { SettingsBody } from '../src/ui/SettingsPanel';
vi.mock('../src/ui/common', async (original) => ({ ...await original<typeof import('../src/ui/common')>(), useSpritesReady: () => true }));
import App from '../src/App';
function memory(initial: Record<string,string> = {}) {
 const data = {...initial}; const writes: string[]=[]; let fail='';
 const kv: KV={ getItem:k=>data[k]??null,setItem:(k,v)=>{if(fail==='all'||fail===k||fail==='archive'&&k.startsWith(PRESERVED_PREFIX))throw Error('quota');data[k]=v;writes.push(k);}, removeItem:k=>{if(fail==='all'||fail===k)throw Error('quota');delete data[k];writes.push(k);} };
 return {kv,data,writes,fail:(key:string)=>{fail=key;}};
}
afterEach(()=>vi.unstubAllGlobals());
describe('v2.2.1 起動を止めない',()=>{
 const fixtures={normal:{},legacy:{[KEY_META]:JSON.stringify({v:1,gold:1400,storage:[]})},broken:{[KEY_RUN]:'{broken',[KEY_META]:'{broken'},journal:{'fdm2:restore-journal':'{broken'}};
 for(const [name,data] of Object.entries(fixtures)) it(`${name}でもタイトルを表示し読み込みで書き換えない`,()=>{
  const m=memory(data);vi.stubGlobal('localStorage',m.kv);vi.stubGlobal('location',{search:''});
  const html=renderToStaticMarkup(React.createElement(App));expect(html).toContain('はじめる');expect(html).not.toContain('保存データの確認');expect(m.writes).toEqual([]);
 });
 it('保存領域が利用不可でもタイトルを表示する',()=>{vi.stubGlobal('localStorage',undefined);vi.stubGlobal('location',{search:''});expect(renderToStaticMarkup(React.createElement(App))).toContain('はじめる');});
 it('設定から復元・バックアップ・警告UIが消えている',()=>{const html=renderToStaticMarkup(React.createElement(SettingsBody,{settings:defaultMeta().settings,onChange:()=>{}}));expect(html).not.toMatch(/バックアップ|復元|保存を再試行/);expect(html).toContain('敵の段階');});
 it('容量不足でも新規冒険と終了結果をメモリー上で処理する',()=>{const m=memory();m.fail('all');const meta=defaultMeta();const r=departure(meta,'main',[],1);expect(saveMeta(meta,m.kv)).toBe(false);expect(saveRun(r,m.kv)).toBe(false);step(r,{t:'wait'});expect(r.turn).toBe(1);r.end={kind:'return',cause:'test',floor:1};r.player.gold=77;const done=finalizeRun(meta,r,m.kv);expect(done.ok).toBe(false);expect(done.summary?.kind).toBe('return');expect(done.meta.gold).toBe(577);expect(done.meta.records.runs).toHaveLength(1);expect(finalizeRun(done.meta,r,m.kv).meta.records.runs).toHaveLength(1);});
});
describe('v2.2.1 読み込み互換と原文の保全',()=>{
 it('旧版の省略された項目を補い、倉庫と蓄えを残す',()=>{const raw=JSON.stringify({v:1,gold:2400,storage:[{id:'w_dou',uid:7,plus:2}]});const m=deserializeMeta(raw)!;expect(m.gold).toBe(2400);expect(m.storage[0].plus).toBe(2);expect(m.nextUid).toBe(8);expect(m.settings.tiers).toBe(true);expect(m.records.plays).toBe(0);});
 it('省略可能な状態・集計を補い冒険を再開できる',()=>{const raw=JSON.parse(serializeRun(createRun({mode:'main',seed:1})));delete raw.player.st;delete raw.stats;delete raw.prompt;const r=deserializeRun(JSON.stringify(raw))!;expect(r).not.toBeNull();step(r,{t:'wait'});expect(r.turn).toBe(1);});
 for(const key of [KEY_RUN,KEY_META])it(`${key}の読めない原文を上書き・削除前に残す`,()=>{const m=memory({[key]:'{broken'});expect(loadRun(m.kv)).toBeNull();loadMeta(m.kv);expect(m.writes).toEqual([]);const ok=key===KEY_RUN?saveRun(null,m.kv):saveMeta(defaultMeta(),m.kv);expect(ok).toBe(true);expect(m.data[PRESERVED_PREFIX+key]).toBe('{broken');});
 it('退避できない場合は読めない原文を変更しない',()=>{const m=memory({[KEY_RUN]:'{broken',[KEY_META]:'{broken'});m.fail('archive');expect(saveRun(createRun({mode:'main',seed:1}),m.kv)).toBe(false);expect(saveMeta(defaultMeta(),m.kv)).toBe(false);expect(m.data[KEY_RUN]).toBe('{broken');expect(m.data[KEY_META]).toBe('{broken');});
 it('旧復元記録があっても保存を続け、復元記録は保持する',()=>{const m=memory({'fdm2:restore-journal':'{"run":"old","meta":null}'});expect(saveMeta(defaultMeta(),m.kv)).toBe(true);expect(saveRun(createRun({mode:'main',seed:1}),m.kv)).toBe(true);expect(m.data['fdm2:restore-journal']).toBe('{"run":"old","meta":null}');expect(m.data[PRESERVED_PREFIX+'fdm2:restore-journal']).toBe(m.data['fdm2:restore-journal']);});
 it('異なる原文の退避を既存の退避に上書きしない',()=>{const m=memory({[KEY_RUN]:'old-one'});saveRun(null,m.kv);m.data[KEY_RUN]='old-two';saveRun(null,m.kv);expect(m.data[PRESERVED_PREFIX+KEY_RUN]).toBe('old-one');expect(m.data[PRESERVED_PREFIX+KEY_RUN+':1']).toBe('old-two');});
 it('通常の自動保存と再開は元のキーで動く',()=>{const m=memory();const r=createRun({mode:'main',seed:7});step(r,{t:'wait'});saveRun(r,m.kv);expect(loadRun(m.kv)?.turn).toBe(1);expect(Object.keys(m.data)).toEqual([KEY_RUN]);});
 for(const kind of ['dead','return','clear'] as const)it(`${kind}の保存・削除の失敗後も持ち帰りは一度だけ`,()=>{
  const m=memory();const meta=defaultMeta();const r=createRun({mode:'main',seed:1});r.player.gold=100;r.end={kind,cause:'test',floor:1};m.fail(KEY_RUN);const first=finalizeRun(meta,r,m.kv);expect(first.summary?.kind).toBe(kind);expect(first.meta.records.runs).toHaveLength(1);m.fail('');const again=finalizeRun(first.meta,r,m.kv);expect(again.ok).toBe(true);expect(again.meta.records.runs).toHaveLength(1);expect(loadMeta(m.kv).gold).toBe(kind==='dead'?500:600);expect(loadRun(m.kv)).toBeNull();
 });
 it('村の保存が失敗しても結果を返し、途中データは片付けない',()=>{const m=memory();const r=createRun({mode:'main',seed:1});r.end={kind:'return',cause:'test',floor:1};m.fail(KEY_META);const a=finalizeRun(defaultMeta(),r,m.kv);expect(a.summary?.kind).toBe('return');expect(loadRun(m.kv)?.end).not.toBeNull();m.fail('');const b=finalizeRun(a.meta,r,m.kv);expect(b.ok).toBe(true);expect(loadMeta(m.kv).records.runs).toHaveLength(1);});
});

it('旧版の図鑑に廃止されたIDがあっても蓄えと倉庫を読み込める',()=>{
 const meta=defaultMeta();meta.gold=8000;meta.book.mon.guard={kills:2};meta.book.item.retired_item=true;
 const back=deserializeMeta(JSON.stringify(meta))!;expect(back.gold).toBe(8000);expect(back.book.mon.guard.kills).toBe(2);
});
