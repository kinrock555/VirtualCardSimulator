import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { PlaymatManagerSection } from '../components/table/PlaymatManagerSection';
import { useTableStore, type GraphicsQuality, type MagnifierZoom, MAGNIFIER_ZOOM_OPTIONS } from '../store/useTableStore';

export function SettingsPage() {
  const navigate = useNavigate();

  const loupeEnabled = useTableStore((state) => state.loupeEnabled);
  const setLoupeEnabled = useTableStore((state) => state.setLoupeEnabled);
  const magnifierZoom = useTableStore((state) => state.magnifierZoom);
  const setMagnifierZoom = useTableStore((state) => state.setMagnifierZoom);
  const graphicsQuality = useTableStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useTableStore((state) => state.setGraphicsQuality);

  return (
    <div className="screen">
      <ScreenHeader
        title="設定"
        subtitle="ルーペ・3D品質・プレイマットなどの表示設定"
        actions={
          <Button variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
        }
      />

      <div className="screen-body">
        <div className="online-home-card">
          <span className="field-label">カードプレビューのルーペ</span>
          <p className="settings-description">
            カードプレビュー上でマウス位置を拡大表示します。小さい文字を確認したいときに便利です。
          </p>
          <label className="settings-toggle-row">
            <input type="checkbox" checked={loupeEnabled} onChange={(event) => setLoupeEnabled(event.target.checked)} />
            ルーペを有効にする
          </label>

          <span className="field-label">ルーペの拡大率</span>
          <div className="settings-radio-row">
            {MAGNIFIER_ZOOM_OPTIONS.map((zoom) => (
              <label key={zoom} className={`settings-radio-option${magnifierZoom === zoom ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="magnifier-zoom"
                  checked={magnifierZoom === zoom}
                  onChange={() => setMagnifierZoom(zoom as MagnifierZoom)}
                />
                {zoom.toFixed(2).replace(/0$/, '')}倍
              </label>
            ))}
          </div>

          <span className="field-label">3D品質</span>
          <p className="settings-description">
            低スペックなPCでは「軽量」を選ぶと、影や背景の装飾を減らして動作を優先します。
          </p>
          <div className="settings-radio-row">
            {(['standard', 'light'] as GraphicsQuality[]).map((quality) => (
              <label key={quality} className={`settings-radio-option${graphicsQuality === quality ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="graphics-quality"
                  checked={graphicsQuality === quality}
                  onChange={() => setGraphicsQuality(quality)}
                />
                {quality === 'standard' ? '標準' : '軽量'}
              </label>
            ))}
          </div>

          <span className="field-label">プレイマット</span>
          <p className="settings-description">
            自分の画像をプレイマットとして使用できます（対応形式: PNG / JPG / JPEG / WebP、上限5MB）。画像はブラウザ内（IndexedDB）にのみ保存され、外部へは送信されません。
          </p>
          <PlaymatManagerSection />
        </div>
      </div>
    </div>
  );
}
