import { useUiStore } from '../../store/useUiStore';

export function NotificationBanner() {
  const notification = useUiStore((state) => state.notification);
  const clearNotification = useUiStore((state) => state.clearNotification);

  if (!notification) return null;

  return (
    <div className="notification-banner" role="status" onClick={clearNotification}>
      {notification}
    </div>
  );
}
