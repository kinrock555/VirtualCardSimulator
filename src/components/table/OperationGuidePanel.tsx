import { useState } from 'react';
import { loadFromStorage, saveToStorage } from '../../lib/storage';
import { STORAGE_KEYS } from '../../lib/storageKeys';

type GuideEntry = {
  label: string;
  input: string;
};

const GUIDE_ENTRIES: GuideEntry[] = [
  { label: 'カードを選択', input: '左クリック' },
  { label: '複数選択', input: 'Shift + 左クリック' },
  { label: '選択解除', input: 'Escキー / 何もない場所をクリック' },
  { label: 'カードを移動', input: '左ドラッグ（選択中なら一括移動）' },
  { label: 'カードメニュー', input: '右クリック' },
  { label: '山札・束を操作', input: 'それぞれを右クリック' },
  { label: '表向きで出す', input: '手札から左ドラッグ' },
  { label: '裏向きで出す', input: 'Shift＋左ドラッグ' },
  { label: '手札へ戻す', input: 'カードメニュー、または手札エリアへドラッグ' },
  { label: 'カメラ回転', input: '右ドラッグ / 中ボタンドラッグ' },
  { label: 'ズーム', input: 'マウスホイール' },
  { label: 'カメラを戻す', input: '画面上部のリセットボタン' },
  { label: '視点を切り替える', input: 'Vキー' },
  { label: 'プレイヤーを交代（2人プレイ時）', input: '「プレイヤー交代」ボタン / Tabキー' },
];

export function OperationGuidePanel() {
  const [isOpen, setIsOpenState] = useState(() => !loadFromStorage<boolean>(STORAGE_KEYS.operationGuideCollapsed, false));

  const setIsOpen = (updater: (prev: boolean) => boolean) => {
    setIsOpenState((prev) => {
      const next = updater(prev);
      saveToStorage(STORAGE_KEYS.operationGuideCollapsed, !next);
      return next;
    });
  };

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
