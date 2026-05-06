import type { LogEntry } from '../game/types';

interface Props {
  logs: LogEntry[];
  onOpen: () => void;
}

export default function LogPanel({ logs, onOpen }: Props) {
  const recent = logs.slice(-4).reverse();

  return (
    <section className="log-panel" aria-label="直近ログ">
      <div className="log-panel-header">
        <span>ログ</span>
        <button type="button" onClick={onOpen}>
          全て
        </button>
      </div>
      <ol>
        {recent.map((log) => (
          <li key={log.id} className={`log-${log.tone ?? 'normal'}`}>
            {log.text}
            {(log.count ?? 1) > 1 ? <span className="log-repeat">×{log.count}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
