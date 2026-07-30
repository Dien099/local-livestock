import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

export default function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 min-h-[44px]"
      style={{
        border: '1px solid var(--border)',
        color: 'var(--text)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <ArrowLeft size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
