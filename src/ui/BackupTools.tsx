import { createContext, useContext, useRef, useState } from 'react';
import type { Meta } from '../engine/meta';
import type { Run } from '../engine/types';
import { exportBackup, exportRaw, parseBackup, recoveryProblem, restoreBackup, rollbackRestore, type Backup } from '../engine/save';

export const SaveContext = createContext<{ meta: Meta; run: Run | null; restored: () => void } | null>(null);
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function BackupTools({ recovery = false }: { recovery?: boolean }) {
  const ctx = useContext(SaveContext);
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [message, setMessage] = useState('');
  const [rollbackNeeded, setRollbackNeeded] = useState(false);
  if (!ctx) return null;
  return <section className="backup-tools">
    <h3>セーブのバックアップ</h3>
    <p className="note">冒険の途中・倉庫・図鑑・記録・設定をファイルに保存します。復元すると今の内容を置き換えます。</p>
    <div className="row-buttons">
      <button onClick={() => { try {
        download(recovery ? exportRaw() : exportBackup(ctx.meta, ctx.run), `fdm-${recovery ? 'recovery' : 'backup'}-${new Date().toISOString().slice(0, 10)}.json`);
        setMessage(recovery ? '元の保存データを書き出しました。修復用として保管してください。' : 'バックアップを書き出しました。');
      } catch { setMessage('書き出せませんでした。保存場所をご確認ください。'); } }}>バックアップを書き出す</button>
      <button onClick={() => input.current?.click()}>ファイルから復元</button>
    </div>
    <input ref={input} type="file" accept=".json,application/json" aria-label="復元するバックアップ" hidden onChange={async (e) => {
      const file = e.target.files?.[0]; e.target.value = ''; setPending(null);
      if (!file) return;
      if (file.size > 10000000) { setMessage('ファイルが大きすぎます（上限10MB）。'); return; }
      try { const data = parseBackup(await file.text());
        if (!data) { setMessage('対応するバックアップではありません。今のデータは変更していません。'); return; }
        setPending(data); setMessage('');
      } catch { setMessage('ファイルを読み取れませんでした。'); }
    }} />
    {pending && <div className="restore-review" role="group" aria-label="復元内容の確認">
      <p>作成日時：{new Date(pending.exportedAt).toLocaleString()}</p>
      <p>倉庫 {pending.meta.storage.length}個・蓄え {pending.meta.gold.toLocaleString()}文・冒険記録 {pending.meta.records.runs.length}件</p>
      <p>{pending.run ? `冒険：${pending.run.floorNo}階・Lv${pending.run.player.lv}${pending.run.end ? '（終了処理待ち）' : ''}` : '冒険の途中データなし'}</p>
      <p>今のデータをこの内容に置き換えます。必要なら先に書き出してください。</p>
      <div className="row-buttons"><button onClick={() => setPending(null)}>やめる</button><button className="primary" onClick={() => {
        if (restoreBackup(pending)) ctx.restored();
        else {
          const pending = recoveryProblem().startsWith('復元が完了');
          setRollbackNeeded(pending);
          setMessage(pending ? '復元は完了していません。元のデータを保全しています。下のボタンで復元前に戻してください。' : '復元できませんでした。元のデータは変更していません。');
        }
      }}>この内容で復元する</button></div>
    </div>}
    {(recovery || rollbackNeeded) && <button onClick={() => { if (rollbackRestore()) ctx.restored(); else setMessage('まだ戻せません。容量やブラウザーの設定を確認して再試行してください。'); }}>中断した復元を復元前に戻す</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
