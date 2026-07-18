import { useState } from 'react';
import { Button } from '../common/Button';

type DrawCountDialogProps = {
  maxCount: number;
  onConfirm: (count: number) => void;
  onCancel: () => void;
};

const QUICK_COUNTS = [1, 3, 5];

export function DrawCountDialog({ maxCount, onConfirm, onCancel }: DrawCountDialogProps) {
  const [count, setCount] = useState(Math.min(1, maxCount));

  const sanitizedCount = Math.min(Math.max(1, Math.floor(count) || 1), maxCount);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel draw-count-dialog" onClick={(event) => event.stopPropagation()}>
        <h2 className="modal-title">複数枚ドロー</h2>
        <p className="modal-subtitle">山札の残り {maxCount} 枚から引く枚数を指定してください。</p>

        <div className="draw-count-quick-row">
          {QUICK_COUNTS.filter((n) => n <= maxCount).map((n) => (
            <Button key={n} size="sm" variant={count === n ? 'primary' : 'default'} onClick={() => setCount(n)}>
              {n}枚
            </Button>
          ))}
        </div>

        <label className="draw-count-input-row">
          ドロー枚数
          <input
            type="number"
            min={1}
            max={maxCount}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.valueAsNumber)}
            className="draw-count-input"
          />
        </label>

        <div className="modal-actions">
          <Button variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => onConfirm(sanitizedCount)}>
            {sanitizedCount}枚ドローする
          </Button>
        </div>
      </div>
    </div>
  );
}
