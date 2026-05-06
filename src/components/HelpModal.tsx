interface Props {
  standalone?: boolean;
  onClose: () => void;
}

export default function HelpModal({ standalone = false, onClose }: Props) {
  const content = (
    <section className={standalone ? 'help-screen' : 'modal-panel help-modal'}>
      <header className="modal-header">
        <h2>遊び方</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </header>
      <div className="help-grid">
        <section>
          <h3>目的</h3>
          <p>階段を探して下へ進み、10階到達を目指す。倒れると進行は消え、記録だけが残る。</p>
        </section>
        <section>
          <h3>スマホ操作</h3>
          <p>十字キーで移動。敵のいる方向へ進むと攻撃。道具、装備、階段、足踏みは下部ボタンで操作する。</p>
        </section>
        <section>
          <h3>PC操作</h3>
          <p>矢印キー/WASDで移動、Spaceで足踏み、Iで道具、Eで装備、Gまたは&gt;で階段、Escでメニュー。</p>
        </section>
        <section>
          <h3>判断</h3>
          <p>満腹度が0になるとHPが減る。後半は装備と道具使用が重要。見えていない敵は表示されない。</p>
        </section>
      </div>
    </section>
  );

  if (standalone) return content;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      {content}
    </div>
  );
}
