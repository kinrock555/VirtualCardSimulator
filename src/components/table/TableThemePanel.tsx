import { useState } from 'react';
import { Button } from '../common/Button';
import { TABLE_THEMES } from '../../config/tableThemes';
import { ROOM_ENVIRONMENTS } from '../../config/roomEnvironments';
import { useTableStore } from '../../store/useTableStore';

type Tab = 'table' | 'room';

export function TableThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('table');
  const selectedThemeId = useTableStore((state) => state.selectedThemeId);
  const setTheme = useTableStore((state) => state.setTheme);
  const selectedRoomEnvironmentId = useTableStore((state) => state.selectedRoomEnvironmentId);
  const setRoomEnvironment = useTableStore((state) => state.setRoomEnvironment);

  return (
    <div className="table-theme-panel-wrapper">
      <Button size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        テーブル設定
      </Button>
      {isOpen && (
        <div className="table-theme-panel">
          <div className="table-theme-tabs">
            <button
              type="button"
              className={`table-theme-tab${tab === 'table' ? ' active' : ''}`}
              onClick={() => setTab('table')}
            >
              テーブル
            </button>
            <button
              type="button"
              className={`table-theme-tab${tab === 'room' ? ' active' : ''}`}
              onClick={() => setTab('room')}
            >
              部屋
            </button>
          </div>

          {tab === 'table' && (
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
          )}

          {tab === 'room' && (
            <div className="table-theme-list">
              {ROOM_ENVIRONMENTS.map((environment) => {
                const isCurrent = environment.id === selectedRoomEnvironmentId;
                return (
                  <div key={environment.id} className={`table-theme-option${isCurrent ? ' current' : ''}`}>
                    <img className="table-theme-preview" src={environment.previewPath} alt={environment.name} />
                    <div className="table-theme-info">
                      <span className="table-theme-name">{environment.name}</span>
                      <span className="table-theme-description">{environment.description}</span>
                      {isCurrent ? (
                        <span className="table-theme-current-badge">選択中</span>
                      ) : (
                        <Button size="sm" onClick={() => setRoomEnvironment(environment.id)}>
                          選択
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
