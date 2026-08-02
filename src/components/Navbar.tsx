import { useState } from 'react';
import { Menu, X, MapPin, ShoppingBag, Store, LogOut, ChevronDown, UserCircle, Bell } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useApp } from '@/context/AppContext';
import type { AccountType } from '@/types';

type View = 'browse' | 'myOffers' | 'inventory' | 'incoming' | 'profile' | 'notifications';

interface NavbarProps {
  onNavigate: (view: View) => void;
  activeView: string;
}

export default function Navbar({ onNavigate, activeView }: NavbarProps) {
  const { signOut, currentUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!currentUser) return null;

  const role: AccountType = currentUser.accountType;

  const customerTabs = [
    { id: 'browse', label: 'Browse Listings', icon: MapPin },
    { id: 'myOffers', label: 'My Offers', icon: ShoppingBag },
  ];

  const dealerTabs = [
    { id: 'inventory', label: 'Active Inventory', icon: Store },
    { id: 'incoming', label: 'Incoming Offers', icon: ShoppingBag },
  ];

  const tabs = role === 'customer' ? customerTabs : dealerTabs;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-lg"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate(role === 'customer' ? 'browse' : 'inventory')} className="flex items-center">
            <Logo size="md" />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id as View)}
                  className={`tab-btn flex items-center gap-2 ${activeView === tab.id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell onClick={() => onNavigate('notifications')} />
            <ThemeToggle />

            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-56 card p-2 animate-fade-in z-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{currentUser.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{currentUser.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
                      {role === 'customer' ? 'Customer / Buyer' : 'Livestock Dealer'}
                    </p>
                  </div>
                  <button
                    onClick={() => { onNavigate('profile'); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text)' }}
                  >
                    <UserCircle size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--error)' }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ border: '1px solid var(--border)', color: 'var(--error)' }}
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          <nav className="px-4 py-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onNavigate(tab.id as View);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[48px]"
                  style={
                    activeView === tab.id
                      ? { backgroundColor: 'var(--primary)', color: 'white' }
                      : { color: 'var(--text)' }
                  }
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                onNavigate('notifications');
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[48px]"
              style={
                activeView === 'notifications'
                  ? { backgroundColor: 'var(--primary)', color: 'white' }
                  : { color: 'var(--text)' }
              }
            >
              <Bell size={18} />
              Notifications
            </button>
            <button
              onClick={() => {
                onNavigate('profile');
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[48px]"
              style={
                activeView === 'profile'
                  ? { backgroundColor: 'var(--primary)', color: 'white' }
                  : { color: 'var(--text)' }
              }
            >
              <UserCircle size={18} />
              My Profile
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
