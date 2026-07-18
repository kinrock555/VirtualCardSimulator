import { useState } from 'react';

type GuideEntry = {
  label: string;
  input: string;
};

const GUIDE_ENTRIES: GuideEntry[] = [
  { label: 'カードを選択', input: '左クリック' },
  { label: '複数選択（束にする用）', input: 'Shift + 左クリック' },
  { label: '選択解除', input: 'Escキー / 何もない場所をクリック' },
  { label: 'カードを移動', input: '左ドラッグ（相手にも同期）' },
  { label: 'カードメニュー', input: '右クリック' },
  { label: '山札・墓地・除外・束を操作', input: 'それぞれを右クリック' },
  { label: '手札から出す', input: '自分の手札をドラッグ' },
  { label: '手札は自分だけ見える', input: '相手には裏面と枚数だけ表示' },
  { label: 'カメラ回転', input: '右ドラッグ / 中ボタンドラッグ' },
  { label: 'ズーム', input: 'マウスホイール' },
  { label: 'カメラを戻す', input: '画面上部のリセットボタン' },
];

export function OnlineOperationGuidePanel() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`operation-guide-panel${isOpen ? '' : ' collapsed'}`}>
      <button className="operation-guide-header" onClick={() => setIsOpen((prev) => !prev)}>
        <span>操作方法</span>
        <span className="operation-guide-toggle">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <ul className="operation-guide-list">
          {GUIDE_ENTRIES.map((entry) => (
            <li key={entry.label} className="operation-guide-item">
              <span className="operation-guide-label">{entry.label}</span>
              <span className="operation-guide-input">{entry.input}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
