import { useOnlineStore } from '../../store/useOnlineStore';

export function ConnectionStatusBanner() {
  const connectionStatus = useOnlineStore((state) => state.connectionStatus);
  const errorMessage = useOnlineStore((state) => state.errorMessage);

  if (connectionStatus === 'reconnecting') {
    return <div className="connection-status-banner reconnecting">再接続中...</div>;
  }
  if (connectionStatus === 'error' && errorMessage) {
    return <div className="connection-status-banner error">接続エラー: {errorMessage}</div>;
  }
  return null;
}
