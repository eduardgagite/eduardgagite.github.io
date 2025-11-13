import type { ReactNode } from 'react';

export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'subtle';
  external?: boolean;
  className?: string;
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  external = false,
  className = '',
}: ButtonLinkProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 transform-gpu hover:-translate-y-0.5';
  const styles: Record<NonNullable<ButtonLinkProps['variant']>, string> = {
    primary:
      'bg-primary text-white hover:opacity-95 shadow-sm ring-1 ring-black/0',
    outline:
      'border border-white/15 hover:bg-white/5',
    subtle:
      'bg-white/5 hover:bg-white/10 ring-1 ring-white/10 backdrop-blur',
  };
  const props = external ? { target: '_blank', rel: 'noreferrer' } : {};
  return (
    <a href={href} {...props} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </a>
  );
}


