import { useState } from 'react';
import { Button } from '../common/Button';
import { TABLE_THEMES } from '../../config/tableThemes';
import { ROOM_ENVIRONMENTS } from '../../config/roomEnvironments';
import { TABLE_TYPES } from '../../config/tableTypes';
import { useTableStore, type GraphicsQuality } from '../../store/useTableStore';
import { PlaymatManagerSection } from './PlaymatManagerSection';

type Tab = 'type' | 'color' | 'playmat' | 'room' | 'quality';

const TAB_LABELS: Record<Tab, string> = {
  type: 'タイプ',
  color: 'カラー',
  playmat: 'マット',
  room: '部屋',
  quality: '品質',
};

export function TableThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('type');
  const selectedThemeId = useTableStore((state) => state.selectedThemeId);
  const setTheme = useTableStore((state) => state.setTheme);
  const selectedRoomEnvironmentId = useTableStore((state) => state.selectedRoomEnvironmentId);
  const setRoomEnvironment = useTableStore((state) => state.setRoomEnvironment);
  const selectedTableTypeId = useTableStore((state) => state.selectedTableTypeId);
  const setTableType = useTableStore((state) => state.setTableType);
  const graphicsQuality = useTableStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useTableStore((state) => state.setGraphicsQuality);

  return (
    <div className="table-theme-panel-wrapper">
      <Button size="sm" onClick={() => setIsOpen((prev) => !prev)}>
        テーブル設定
      </Button>
      {isOpen && (
        <div className="table-theme-panel">
          <div className="table-theme-tabs">
            {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`table-theme-tab${tab === key ? ' active' : ''}`}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>

          {tab === 'type' && (
            <div className="table-theme-list">
              {TABLE_TYPES.map((type) => {
                const isCurrent = type.id === selectedTableTypeId;
                return (
                  <div key={type.id} className={`table-theme-option${isCurrent ? ' current' : ''}`}>
                    <img className="table-theme-preview" src={type.previewPath} alt={type.name} />
                    <div className="table-theme-info">
                      <span className="table-theme-name">{type.name}</span>
                      <span className="table-theme-description">{type.description}</span>
                      {isCurrent ? (
                        <span className="table-theme-current-badge">選択中</span>
                      ) : (
                        <Button size="sm" onClick={() => setTableType(type.id)}>
                          選択
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'color' && (
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

          {tab === 'playmat' && <PlaymatManagerSection />}

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

          {tab === 'quality' && (
            <div className="settings-radio-row">
              {(['standard', 'light'] as GraphicsQuality[]).map((quality) => (
                <label key={quality} className={`settings-radio-option${graphicsQuality === quality ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="panel-graphics-quality"
                    checked={graphicsQuality === quality}
                    onChange={() => setGraphicsQuality(quality)}
                  />
                  {quality === 'standard' ? '標準' : '軽量'}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
