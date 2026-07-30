import { Moon, Sun } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ThemeToggle() {
  const { state, dispatch } = useApp();

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          size={20}
          className={`absolute inset-0 transition-all duration-300 ${
            state.isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{ color: 'var(--accent)' }}
        />
        <Moon
          size={20}
          className={`absolute inset-0 transition-all duration-300 ${
            state.isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          style={{ color: 'var(--accent)' }}
        />
      </div>
    </button>
  );
}
