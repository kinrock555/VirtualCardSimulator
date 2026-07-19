import { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { useTableStore } from '../../store/useTableStore';
import { useUiStore } from '../../store/useUiStore';
import {
  addCustomPlaymat,
  deleteCustomPlaymat,
  getCustomPlaymatBlob,
  listCustomPlaymats,
  type CustomPlaymatMeta,
} from '../../lib/customPlaymatStorage';

type PlaymatRowProps = {
  playmat: CustomPlaymatMeta;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

function PlaymatThumbnail({ playmatId }: { playmatId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    getCustomPlaymatBlob(playmatId).then((blob) => {
      if (!blob || cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [playmatId]);

  return url ? <img className="playmat-row-thumb" src={url} alt="" /> : <div className="playmat-row-thumb playmat-row-thumb-empty" />;
}

function PlaymatRow({ playmat, isSelected, onSelect, onDelete }: PlaymatRowProps) {
  return (
    <div className={`playmat-row${isSelected ? ' selected' : ''}`}>
      <PlaymatThumbnail playmatId={playmat.id} />
      <div className="playmat-row-name">{playmat.name}</div>
      {isSelected ? (
        <span className="playmat-row-current-badge">使用中</span>
      ) : (
        <Button size="sm" onClick={onSelect}>
          選択
        </Button>
      )}
      <Button size="sm" variant="danger" onClick={onDelete}>
        削除
      </Button>
    </div>
  );
}

/**
 * Shared custom-playmat add/list/select/delete UI - used by both the
 * dedicated Settings screen and the in-play "テーブル設定" panel, so the
 * upload/storage logic (see lib/customPlaymatStorage.ts) exists in exactly
 * one place instead of being duplicated per screen.
 */
export function PlaymatManagerSection() {
  const showNotification = useUiStore((state) => state.showNotification);
  const selectedPlaymatId = useTableStore((state) => state.selectedPlaymatId);
  const setSelectedPlaymatId = useTableStore((state) => state.setSelectedPlaymatId);

  const [playmats, setPlaymats] = useState<CustomPlaymatMeta[]>([]);
  const [playmatError, setPlaymatError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshPlaymats = () => {
    listCustomPlaymats()
      .then(setPlaymats)
      .catch(() => setPlaymats([]));
  };

  useEffect(() => {
    refreshPlaymats();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPlaymatError(null);
    setIsUploading(true);
    try {
      const meta = await addCustomPlaymat(file);
      refreshPlaymats();
      setSelectedPlaymatId(meta.id);
      showNotification(`プレイマット「${meta.name}」を追加しました`);
    } catch (error) {
      setPlaymatError(error instanceof Error ? error.message : '画像の読み込みに失敗しました。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (playmat: CustomPlaymatMeta) => {
    if (!window.confirm(`プレイマット「${playmat.name}」を削除しますか？`)) return;
    await deleteCustomPlaymat(playmat.id);
    if (selectedPlaymatId === playmat.id) setSelectedPlaymatId(null);
    refreshPlaymats();
  };

  return (
    <div>
      <div className="playmat-manager">
        <div className="playmat-row">
          <div className="playmat-row-thumb playmat-row-thumb-empty" />
          <div className="playmat-row-name">標準プレイマット（テーブルテーマに連動）</div>
          {selectedPlaymatId === null ? (
            <span className="playmat-row-current-badge">使用中</span>
          ) : (
            <Button size="sm" onClick={() => setSelectedPlaymatId(null)}>
              選択
            </Button>
          )}
        </div>
        {playmats.map((playmat) => (
          <PlaymatRow
            key={playmat.id}
            playmat={playmat}
            isSelected={selectedPlaymatId === playmat.id}
            onSelect={() => setSelectedPlaymatId(playmat.id)}
            onDelete={() => handleDelete(playmat)}
          />
        ))}
      </div>

      {playmatError && <p className="online-home-hint online-home-error">{playmatError}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button variant="primary" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
        {isUploading ? 'アップロード中...' : 'プレイマット画像を追加'}
      </Button>
    </div>
  );
}
