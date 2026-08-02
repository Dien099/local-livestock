import { Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface NotificationBellProps {
  onClick: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { notifications, currentUser } = useApp();

  const myNotifications = notifications.filter((n) => n.userId === currentUser?.id);
  const unread = myNotifications.filter((n) => !n.read);

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
      style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
      aria-label="View notifications"
    >
      <Bell size={20} />
      {unread.length > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse"
          style={{ backgroundColor: 'var(--error)' }}
        >
          {unread.length > 9 ? '9+' : unread.length}
        </span>
      )}
    </button>
  );
}
