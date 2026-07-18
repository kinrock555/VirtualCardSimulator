import { useState } from 'react';

type GuideEntry = {
  label: string;
  input: string;
};

const GUIDE_ENTRIES: GuideEntry[] = [
  { label: 'カードを選択', input: '左クリック' },
  { label: 'カードを移動', input: '左ドラッグ' },
  { label: 'カードメニュー', input: '右クリック' },
  { label: '山札を操作', input: '山札を右クリック' },
  { label: '手札から出す', input: 'カードをドラッグ' },
  { label: '手札へ戻す', input: 'カードメニューから選択' },
  { label: 'カメラ回転', input: '右ドラッグ / 中ボタンドラッグ' },
  { label: 'ズーム', input: 'マウスホイール' },
  { label: 'カメラを戻す', input: '画面上部のリセットボタン' },
];

export function OperationGuidePanel() {
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
