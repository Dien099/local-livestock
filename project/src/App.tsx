import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import AuthScreen from '@/views/AuthScreen';
import CustomerBrowse from '@/views/customer/CustomerBrowse';
import CustomerOffers from '@/views/customer/CustomerOffers';
import DealerInventory from '@/views/dealer/DealerInventory';
import DealerIncoming from '@/views/dealer/DealerIncoming';
import ProfileView from '@/views/ProfileView';
import NotificationsView from '@/views/NotificationsView';

type View = 'browse' | 'myOffers' | 'inventory' | 'incoming' | 'profile' | 'notifications';

function AppContent() {
  const { currentUser } = useApp();
  const [view, setView] = useState<View>('browse');

  if (!currentUser) {
    return <AuthScreen />;
  }

  const role = currentUser.accountType;
  const validViews: View[] = role === 'customer'
    ? ['browse', 'myOffers', 'profile', 'notifications']
    : ['inventory', 'incoming', 'profile', 'notifications'];
  const effectiveView: View = validViews.includes(view) ? view : (role === 'customer' ? 'browse' : 'inventory');
  const homeView: View = role === 'customer' ? 'browse' : 'inventory';
  const homeLabel = role === 'customer' ? 'Back to Marketplace' : 'Back to Dashboard';

  const goBack = () => setView(homeView);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar onNavigate={setView} activeView={effectiveView} />
      <main>
        {effectiveView === 'profile' ? (
          <ProfileView onBack={goBack} homeLabel={homeLabel} />
        ) : effectiveView === 'notifications' ? (
          <NotificationsView onBack={goBack} homeLabel={homeLabel} />
        ) : role === 'customer' ? (
          effectiveView === 'myOffers' ? (
            <CustomerOffers onBack={goBack} />
          ) : (
            <CustomerBrowse />
          )
        ) : (
          effectiveView === 'incoming' ? (
            <DealerIncoming onBack={goBack} />
          ) : (
            <DealerInventory onIncoming={() => setView('incoming')} />
          )
        )}
      </main>
      <footer className="mt-8 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Local Livestock · Provincial Trading Platform
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
