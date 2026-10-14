// 拠点の村：出発・倉庫・鍛冶屋・よろず屋・図鑑・記録・称号・毎日の挑戦
import { useState } from 'react';
import { CAT_NAME, ITEMS, itemDef } from '../content/items';
import { NORMAL_MONSTERS, MONSTERS } from '../content/monsters';
import { MODE_NAME, TITLES } from '../content/world';
import { STORAGE_MAX, VILLAGE_GOODS, buyGoods, forge, forgeCost, goodsPrice, sellFromStorage, todayKey, type Meta, type Settings } from '../engine/meta';
import { sellPrice } from '../engine/core';
import type { RunMode } from '../engine/types';
import { ItemIcon, Modal, MonsterIcon, click, itemDescription, itemLabel } from './common';
import { HelpBody } from './Help';
import { SettingsBody } from './SettingsPanel';

type View = 'home' | 'depart' | 'prep' | 'storage' | 'forge' | 'shop' | 'book' | 'records' | 'titles' | 'help' | 'settings';

export interface VillageProps {
  meta: Meta;
  onMeta: (m: Meta) => void;
  onDepart: (mode: RunMode, carry: number[]) => void;
  settings: Settings;
  onSettings: (s: Settings) => void;
  onTitle: () => void;
}

export function VillageScene() {
  return (
    <svg className="village-scene" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1838" /><stop offset="0.55" stopColor="#6a3a5a" /><stop offset="1" stopColor="#f0a060" /></linearGradient>
        <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2e4a" /><stop offset="1" stopColor="#1e1828" /></linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd890" stopOpacity="0.9" /><stop offset="1" stopColor="#ffd890" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky)" />
      <circle cx="300" cy="70" r="26" fill="#ffe2b0" opacity="0.85" />
      <path d="M0 140 L60 80 L110 120 L170 60 L240 130 L300 90 L400 140 V220 H0 Z" fill="url(#mt)" />
      <path d="M150 220 L170 100 L182 100 L200 220 Z" fill="#14101c" opacity="0.6" />
      <g fill="#1a1420">
        <rect x="20" y="150" width="80" height="50" /><path d="M10 152 L60 120 L110 152 Z" />
        <rect x="270" y="155" width="100" height="45" /><path d="M260 157 L320 125 L380 157 Z" />
        <rect x="120" y="165" width="50" height="35" /><path d="M112 167 L145 145 L178 167 Z" />
      </g>
      <g fill="#ffcf70">
        <rect x="35" y="165" width="12" height="10" /><rect x="70" y="165" width="12" height="10" /><rect x="290" y="170" width="14" height="10" /><rect x="335" y="170" width="14" height="10" /><rect x="138" y="178" width="12" height="9" />
      </g>
      <g>
        <rect x="204" y="128" width="8" height="72" fill="#b02a1e" /><rect x="244" y="128" width="8" height="72" fill="#b02a1e" />
        <rect x="194" y="120" width="68" height="9" fill="#c8321f" /><rect x="200" y="136" width="56" height="6" fill="#b02a1e" />
      </g>
      <circle cx="110" cy="150" r="16" fill="url(#glow)" /><rect x="105" y="143" width="10" height="14" rx="4" fill="#ff9a3a" />
      <circle cx="380" cy="150" r="16" fill="url(#glow)" /><rect x="375" y="143" width="10" height="14" rx="4" fill="#ff9a3a" />
      <rect y="200" width="400" height="20" fill="#120e18" />
    </svg>
  );
}

export function Village({ meta, onMeta, onDepart, settings, onSettings, onTitle }: VillageProps) {
  const [view, setView] = useState<View>('home');
  const [carry, setCarry] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [bookTab, setBookTab] = useState<'mon' | 'item'>('mon');
  const [detail, setDetail] = useState<string | null>(null);
  const update = (fn: (m: Meta) => string) => {
    const copy: Meta = JSON.parse(JSON.stringify(meta));
    const text = fn(copy);
    onMeta(copy);
    setMsg(text);
  };
  const today = todayKey();
  const dailyDone = meta.daily[today];

  const home = (
    <div className="village">
      <div className="village-top">
        <VillageScene />
        <div className="village-title">
          <h1>宿場町・迷い里</h1>
          <p>村の蓄え <b>{meta.gold.toLocaleString()}文</b>・倉庫 {meta.storage.length}/{STORAGE_MAX}</p>
        </div>
      </div>
      <div className="village-menu">
        <button className="big primary" onClick={click(() => setView('depart'))}>出発する<small>迷宮へ</small></button>
        <button onClick={click(() => setView('storage'))}>倉庫<small>預けた道具</small></button>
        <button onClick={click(() => setView('forge'))}>鍛冶屋<small>武器・防具を鍛える</small></button>
        <button onClick={click(() => setView('shop'))}>よろず屋<small>道具を買う</small></button>
        <button onClick={click(() => setView('book'))}>図鑑<small>敵・道具</small></button>
        <button onClick={click(() => setView('records'))}>冒険の記録<small>到達階・履歴</small></button>
        <button onClick={click(() => setView('titles'))}>称号<small>{meta.titles.length}/{TITLES.length}</small></button>
        <button onClick={click(() => setView('help'))}>遊び方</button>
        <button onClick={click(() => setView('settings'))}>設定</button>
        <button onClick={click(onTitle)}>タイトルへ</button>
      </div>
    </div>
  );

  const close = () => { setView('home'); setMsg(''); setDetail(null); };

  let modal: React.ReactNode = null;
  if (view === 'depart') {
    modal = (
      <Modal title="どこへ向かう？" onClose={close} wide>
        <div className="depart-list">
          <button className="depart main" onClick={click(() => setView('prep'))}>
            <b>{MODE_NAME.main}</b><span>全30階。最上階で鬼の王が待つ。倉庫から道具を持ち込める。</span>
            <small>最高 {meta.records.best.main}階・踏破 {meta.records.clears.main}回</small>
          </button>
          <button className="depart deep" disabled={!meta.deepUnlocked} onClick={click(() => onDepart('deep', []))}>
            <b>{MODE_NAME.deep}</b><span>{meta.deepUnlocked ? '全99階。持ち込み不可・レベル1から。道具はほとんど未識別。' : '本編を踏破すると開く。'}</span>
            {meta.deepUnlocked && <small>最高 {meta.records.best.deep}階・踏破 {meta.records.clears.deep}回</small>}
          </button>
          <button className="depart daily" onClick={click(() => onDepart('daily', []))}>
            <b>{MODE_NAME.daily}（{today}）</b><span>今日だけの10階の迷宮。決まった持ち物で始める。最初の1回が本番。</span>
            <small>{dailyDone ? `本番の記録：${dailyDone.score}点（${dailyDone.floor}階${dailyDone.cleared ? '・踏破' : ''}）。もう一度は練習になる` : 'まだ挑戦していない'}</small>
          </button>
          <button className="depart practice" onClick={click(() => onDepart('practice', []))}>
            <b>{MODE_NAME.practice}</b><span>全3階。操作と基本を案内つきで覚える。</span>
          </button>
        </div>
      </Modal>
    );
  } else if (view === 'prep') {
    const toggle = (uid: number) => setCarry((c) => (c.includes(uid) ? c.filter((x) => x !== uid) : c.length >= 12 ? c : [...c, uid]));
    modal = (
      <Modal title={`持ち込む道具（${carry.length}/12）`} onClose={() => setView('depart')} wide>
        {meta.storage.length === 0 && <p className="empty">倉庫は空です。木刀・木の胴丸・おにぎり・薬草を持って出発します。</p>}
        <div className="inv-list">
          {meta.storage.map((item) => (
            <button key={item.uid} className={`inv-row ${carry.includes(item.uid) ? 'equipped' : ''}`} onClick={() => toggle(item.uid)}>
              <ItemIcon id={item.id} size={30} />
              <span className="inv-name">{carry.includes(item.uid) && <b className="eq-mark">✓</b>}{itemLabel(null, item)}</span>
            </button>
          ))}
        </div>
        <p className="note">倒れると持ち込んだ道具も失います。帰還の巻物で帰るか踏破すれば、持ち物を倉庫へ持ち帰れます。</p>
        <div className="row-buttons">
          <button className="primary" onClick={click(() => { const c = carry; setCarry([]); onDepart('main', c); })}>出発！</button>
        </div>
      </Modal>
    );
  } else if (view === 'storage') {
    modal = (
      <Modal title={`倉庫（${meta.storage.length}/${STORAGE_MAX}）`} onClose={close} wide>
        {msg && <p className="toast">{msg}</p>}
        {meta.storage.length === 0 && <p className="empty">何も預けていない。</p>}
        <div className="inv-list">
          {meta.storage.map((item) => (
            <div key={item.uid} className="inv-row static">
              <ItemIcon id={item.id} size={30} />
              <span className="inv-name">{itemLabel(null, item)}<small className="sub">{itemDescription(null, item).split('\n')[0]}</small></span>
              <button className="small" onClick={() => update((m) => sellFromStorage(m, item.uid))}>売る {sellPrice(item)}文</button>
            </div>
          ))}
        </div>
      </Modal>
    );
  } else if (view === 'forge') {
    const gear = meta.storage.filter((i) => ['weapon', 'armor'].includes(itemDef(i.id).cat));
    modal = (
      <Modal title="鍛冶屋" onClose={close} wide>
        <p className="note">鍛冶屋「倉庫の武器と防具を鍛えてやろう。呪いも落としておく」 蓄え {meta.gold.toLocaleString()}文</p>
        {msg && <p className="toast">{msg}</p>}
        {gear.length === 0 && <p className="empty">倉庫に武器も防具もない。</p>}
        <div className="inv-list">
          {gear.map((item) => (
            <div key={item.uid} className="inv-row static">
              <ItemIcon id={item.id} size={30} />
              <span className="inv-name">{itemLabel(null, item)}</span>
              <button className="small" onClick={() => update((m) => forge(m, item.uid))}>+1 {forgeCost(item)}文</button>
            </div>
          ))}
        </div>
      </Modal>
    );
  } else if (view === 'shop') {
    modal = (
      <Modal title="よろず屋" onClose={close} wide>
        <p className="note">買った品は倉庫に入ります。蓄え {meta.gold.toLocaleString()}文</p>
        {msg && <p className="toast">{msg}</p>}
        <div className="inv-list">
          {VILLAGE_GOODS.map((g) => (
            <div key={g.id} className="inv-row static">
              <ItemIcon id={g.id} size={30} />
              <span className="inv-name">{g.count ? `${g.count}本の` : ''}{itemDef(g.id).name}<small className="sub">{itemDef(g.id).desc}</small></span>
              <button className="small" onClick={() => update((m) => buyGoods(m, g.id, g.count))}>{goodsPrice(g.id, g.count)}文</button>
            </div>
          ))}
        </div>
      </Modal>
    );
  } else if (view === 'book') {
    const seenMon = NORMAL_MONSTERS.filter((m) => meta.book.mon[m.id]).length;
    const unidCats = ['grass', 'scroll', 'staff', 'pot', 'charm', 'weapon', 'armor', 'food', 'arrow'];
    const listedItems = ITEMS.filter((d) => d.cat !== 'gold');
    const seenItems = listedItems.filter((d) => meta.book.item[d.id]).length;
    modal = (
      <Modal title="図鑑" onClose={close} wide>
        <div className="seg tabs">
          <button className={bookTab === 'mon' ? 'on' : ''} onClick={() => { setBookTab('mon'); setDetail(null); }}>敵 {seenMon}/{NORMAL_MONSTERS.length}</button>
          <button className={bookTab === 'item' ? 'on' : ''} onClick={() => { setBookTab('item'); setDetail(null); }}>道具 {seenItems}/{listedItems.length}</button>
        </div>
        {bookTab === 'mon' ? (
          <div className="book-grid">
            {[...NORMAL_MONSTERS, ...MONSTERS.filter((m) => m.special)].map((m) => {
              const rec = meta.book.mon[m.id];
              return (
                <button key={m.id} className={`book-cell ${rec ? '' : 'unknown'} ${detail === m.id ? 'sel' : ''}`} onClick={() => setDetail(rec ? m.id : null)}>
                  <MonsterIcon id={m.id} size={52} dim={!rec} />
                  <span>{rec ? m.name : '？？？'}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="book-items">
            {unidCats.map((cat) => (
              <div key={cat} className="book-cat">
                <h4>{CAT_NAME[cat as keyof typeof CAT_NAME]}</h4>
                <div className="chips-wrap">
                  {listedItems.filter((d) => d.cat === cat).map((d) => (
                    <button key={d.id} className={`book-chip ${meta.book.item[d.id] ? '' : 'unknown'} ${detail === d.id ? 'sel' : ''}`} onClick={() => setDetail(meta.book.item[d.id] ? d.id : null)}>
                      {meta.book.item[d.id] ? d.name : '？？？'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {detail && bookTab === 'mon' && (() => {
          const m = MONSTERS.find((x) => x.id === detail)!;
          return (
            <div className="book-detail">
              <MonsterIcon id={m.id} size={72} />
              <div>
                <b>{m.name}</b>{!m.special && <small>（{m.lv}階あたり）</small>}
                <p>{m.desc}</p>
                <p className="stats">HP {m.hp}・攻撃 {m.atk}・防御 {m.def}・経験値 {m.exp}{m.spd > 0 ? '・倍速' : ''}・倒した数 {meta.book.mon[m.id]?.kills ?? 0}</p>
              </div>
            </div>
          );
        })()}
        {detail && bookTab === 'item' && (
          <div className="book-detail">
            <ItemIcon id={detail} size={56} />
            <div><b>{itemDef(detail).name}</b><p>{itemDef(detail).desc}</p><p className="stats">基本の値段 {itemDef(detail).price}文</p></div>
          </div>
        )}
      </Modal>
    );
  } else if (view === 'records') {
    const r = meta.records;
    const days = Object.entries(meta.daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
    modal = (
      <Modal title="冒険の記録" onClose={close} wide>
        <div className="record-grid">
          <div><small>本編 最高</small><b>{r.best.main}階</b><small>踏破 {r.clears.main}回</small></div>
          <div><small>深層 最高</small><b>{r.best.deep}階</b><small>踏破 {r.clears.deep}回</small></div>
          <div><small>冒険の回数</small><b>{r.plays}</b><small>倒した敵 {r.kills}</small></div>
        </div>
        <h4>最近の冒険</h4>
        {r.runs.length === 0 && <p className="empty">まだ記録がない。</p>}
        <div className="run-list">
          {r.runs.map((x, i) => (
            <div key={i} className={`run-row ${x.kind}`}>
              <span className="date">{x.at.slice(5, 16).replace('T', ' ')}</span>
              <span className="mode">{MODE_NAME[x.mode].split('・')[0]}</span>
              <span className="fl">{x.floor}階</span>
              <span className="cause">{x.kind === 'clear' ? '踏破！' : x.kind === 'return' ? '帰還' : x.kind === 'quit' ? 'あきらめた' : `${x.cause}に倒れる`}</span>
              <span className="lv">Lv{x.lv}{x.score !== undefined ? `・${x.score}点` : ''}</span>
            </div>
          ))}
        </div>
        <h4>毎日の挑戦</h4>
        {days.length === 0 && <p className="empty">まだ挑戦していない。</p>}
        <div className="run-list">
          {days.map(([d, rec]) => (
            <div key={d} className="run-row"><span className="date">{d}</span><span className="fl">{rec.floor}階</span><span className="cause">{rec.cleared ? '踏破' : ''}</span><span className="lv">{rec.score}点</span></div>
          ))}
        </div>
      </Modal>
    );
  } else if (view === 'titles') {
    modal = (
      <Modal title="称号" onClose={close} wide>
        <div className="title-list">
          {TITLES.map((t) => (
            <div key={t.id} className={`title-row ${meta.titles.includes(t.id) ? 'got' : ''}`}>
              <b>{meta.titles.includes(t.id) ? t.name : '？？？'}</b><span>{t.desc}</span>
            </div>
          ))}
        </div>
      </Modal>
    );
  } else if (view === 'help') {
    modal = <Modal title="遊び方" onClose={close} wide><HelpBody /></Modal>;
  } else if (view === 'settings') {
    modal = <Modal title="設定" onClose={close}><SettingsBody settings={settings} onChange={onSettings} /></Modal>;
  }

  return (
    <>
      {home}
      {modal}
    </>
  );
}
