import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-black shadow-[0_14px_36px_rgb(98_255_174_/_0.22)] hover:bg-brand-strong',
  secondary: 'surface-border bg-white/[0.08] text-foreground hover:bg-white/[0.12]',
  ghost: 'text-muted hover:bg-white/[0.08] hover:text-foreground'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base'
};

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/70',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      type={type}
      {...props}
    />
  );
}

type LinkButtonProps = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/70',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      href={href}
      {...props}
    />
  );
}
