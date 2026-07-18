import { useState } from 'react';
import { Button } from '../common/Button';
import { TABLE_THEMES } from '../../config/tableThemes';
import { useTableStore } from '../../store/useTableStore';

export function TableThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedThemeId = useTableStore((state) => state.selectedThemeId);
  const setTheme = useTableStore((state) => state.setTheme);

  return (
    <div className="table-theme-panel-wrapper">
      <Button size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        テーブル設定
      </Button>
      {isOpen && (
        <div className="table-theme-panel">
          <div className="table-theme-panel-title">テーブルテーマ</div>
          <div className="table-theme-list">
            {TABLE_THEMES.map((theme) => {
              const isCurrent = theme.id === selectedThemeId;
              return (
                <div key={theme.id} className={`table-theme-option${isCurrent ? ' current' : ''}`}>
                  <img className="table-theme-preview" src={theme.previewPath} alt={theme.name} />
                  <div className="table-theme-info">
                    <span className="table-theme-name">{theme.name}</span>
                    {isCurrent ? (
                      <span className="table-theme-current-badge">選択中</span>
                    ) : (
                      <Button size="sm" onClick={() => setTheme(theme.id)}>
                        選択
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
