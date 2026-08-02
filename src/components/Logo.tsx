import { Sprout } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const dimensions = {
    sm: { box: 'w-8 h-8', icon: 18, text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', icon: 22, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 'w-14 h-14', icon: 30, text: 'text-xl', sub: 'text-xs' },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dimensions.box} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
      >
        <Sprout size={dimensions.icon} className="text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${dimensions.text} font-bold tracking-tight`} style={{ color: 'var(--text)' }}>
            Local Livestock
          </span>
          <span className={`${dimensions.sub} font-medium tracking-wide uppercase`} style={{ color: 'var(--text-muted)' }}>
            Provincial Trading
          </span>
        </div>
      )}
    </div>
  );
}
