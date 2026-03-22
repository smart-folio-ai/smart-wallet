import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export function AppLogo({ size = 'md', variant = 'full' }: AppLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center ${variant === 'icon' ? '' : 'space-x-2'}`}>
      <span
        className={`font-share-tech ${sizeClasses[size]} font-semibold tracking-[0.04em] text-sidebar-foreground`}
        aria-label="Trackerr"
      >
        Trackerr
      </span>
    </div>
  );
}
