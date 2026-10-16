import { tierLabel } from '../src/render/tier';
import { spawn } from './helpers';
import { describe, expect, it } from 'vitest';
import { arena, give, act } from './helpers';
import { defaultMeta, departure } from '../src/engine/meta';
import { createRun } from '../src/engine/run';
import { hasUnpaid } from '../src/engine/core';
import { deserializeRun, serializeRun, finalizeRun, type KV } from '../src/engine/save';
function memory() {
 const data: Record<string,string> = {}; let fail = '';
 const kv: KV = {getItem:k=>data[k]??null,setItem:(k,v)=>{if(k===fail)throw Error('quota');data[k]=v;},removeItem:k=>{if(k===fail)throw Error('quota');delete data[k];}};
 return {data,kv,fail:(k:string)=>{fail=k;}};
}
describe('v2.2 商品と矢',()=>{
 for(const id of ['p_kankin','p_henka','p_gousei','p_soko','p_hozon']) it(`${id}で未払い商品を処理しない`,()=>{
  const r=arena(); const p=give(r,id);const goods=give(r,'w_dou',{shop:true});const before=serializeRun(r);
  act(r,{t:'item',uid:goods.uid,verb:'put',target:p.uid});expect(r.player.inv).toContain(goods);expect(r.player.gold).toBe(0);expect(p.contents).toEqual([]);expect(r.turn).toBe(0);expect(before.length).toBeGreaterThan(0);
 });
 it('入れ子の未払い商品も倉庫番へ預けない',()=>{const r=arena();const p=give(r,'p_hozon');p.contents=[{uid:r.nextUid++,id:'p_hozon',contents:[{uid:r.nextUid++,id:'w_dou',shop:true}]}];expect(hasUnpaid(p)).toBe(true);r.prompt={kind:'npc',who:'bank',cost:0};act(r,{t:'npc',who:'bank',target:p.uid});expect(r.player.inv).toContain(p);expect(r.deposit??[]).toHaveLength(0);});
 for(const full of [false,true]) it(`矢の残りを失わない（満杯=${full}）`,()=>{const r=arena();const arrows=give(r,'r_ki',{count:95});if(full)while(r.player.inv.length<20)give(r,'g_yakusou');r.floor.items.push({x:r.player.x,y:r.player.y,item:{uid:r.nextUid++,id:'r_ki',count:20}});act(r,{t:'pickup'});expect(arrows.count).toBe(99);const total=r.player.inv.filter(i=>i.id==='r_ki').reduce((n,i)=>n+(i.count??0),0)+r.floor.items.filter(f=>f.item.id==='r_ki').reduce((n,f)=>n+(f.item.count??0),0);expect(total).toBe(115);expect(r.floor.items.length).toBe(full?1:0);});
});
it('段階は見える通常敵だけに表示し変装・不可視・役割を漏らさない',()=>{
 const r=arena();const m=spawn(r,'tanuki2',12,10);expect(tierLabel(m,true,true)).toBe('Ⅱ');
 expect(tierLabel(m,false,true)).toBe('');expect(tierLabel(m,true,false)).toBe('');
 m.disguise='g_yakusou';expect(tierLabel(m,true,true)).toBe('');delete m.disguise;
 m.role='keeper';expect(tierLabel(m,true,true)).toBe('');delete m.role;
 m.id='kage3';expect(tierLabel(m,true,true)).toBe('');
});
it('入れ子の壺を持ち帰り再出発してもIDが重複しない',()=>{
 const meta=defaultMeta();meta.storage=[{uid:1,id:'p_hozon',cap:4,contents:[{uid:2,id:'p_hozon',cap:4,contents:[{uid:3,id:'g_yakusou'}]}]}];meta.nextUid=4;
 const r=departure(meta,'main',[1],9);expect(deserializeRun(serializeRun(r))).not.toBeNull();
 r.end={kind:'return',cause:'test',floor:1};const m=memory();const result=finalizeRun(meta,r,m.kv);expect(result.ok).toBe(true);
 const second=departure(result.meta,'main',result.meta.storage.map(i=>i.uid),10);expect(deserializeRun(serializeRun(second))).not.toBeNull();
});
