import { useEffect } from 'react';
import { Bell, Check, CheckCircle2, XCircle, Package, Clock, Inbox } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import BackButton from '@/components/BackButton';
import type { AppNotification } from '@/types';

const ICON_MAP = {
  offer_received: Package,
  offer_approved: CheckCircle2,
  offer_rejected: XCircle,
  offer_completed: Check,
};

const COLOR_MAP = {
  offer_received: 'var(--accent)',
  offer_approved: 'var(--success)',
  offer_rejected: 'var(--error)',
  offer_completed: 'var(--secondary)',
};

interface NotificationsViewProps {
  onBack: () => void;
  homeLabel: string;
}

export default function NotificationsView({ onBack, homeLabel }: NotificationsViewProps) {
  const { notifications, markNotificationsRead, currentUser } = useApp();

  const myNotifications = notifications.filter((n) => n.userId === currentUser?.id);
  const unread = myNotifications.filter((n) => !n.read);

  useEffect(() => {
    if (unread.length > 0) {
      const timer = setTimeout(() => {
        markNotificationsRead(unread.map((n) => n.id));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [unread.length, markNotificationsRead, unread]);

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton label={homeLabel} onClick={onBack} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
            <Bell size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Notifications</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {myNotifications.length === 0
                ? 'No notifications yet'
                : `${unread.length} unread of ${myNotifications.length} total`}
            </p>
          </div>
        </div>
      </div>

      {myNotifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>You're all caught up</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Notifications about new offers, approvals, and transaction updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {myNotifications.map((n: AppNotification) => {
            const Icon = ICON_MAP[n.type];
            const color = COLOR_MAP[n.type];
            return (
              <div
                key={n.id}
                className="card p-4 flex gap-3.5 transition-all"
                style={{
                  borderLeft: `3px solid ${color}`,
                  opacity: n.read ? 0.75 : 1,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{n.title}</p>
                    {!n.read && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: 'var(--error)' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} /> {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
