import { useState } from 'react';
import { Button } from '../common/Button';

type InviteLinkBoxProps = {
  roomId: string;
};

export function InviteLinkBox({ roomId }: InviteLinkBoxProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // fall through to manual-copy display below
    }
    setCopied(false);
  };

  return (
    <div className="invite-link-box">
      <span className="invite-link-room-id">ルーム: {roomId}</span>
      <Button size="sm" onClick={handleCopy}>
        {copied ? 'コピーしました' : '招待URLをコピー'}
      </Button>
      <input className="invite-link-url-input" value={inviteUrl} readOnly onFocus={(event) => event.target.select()} />
    </div>
  );
}
