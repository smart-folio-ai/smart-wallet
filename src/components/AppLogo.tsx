import React from 'react';
import trakkerLogo from '@/assets/logo.png';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

export function AppLogo({size = 'md', variant = 'full'}: AppLogoProps) {
  const sizeClasses = {
    sm: 'h-7 w-[124px]',
    md: 'h-8 w-[148px]',
    lg: 'h-10 w-[188px]',
  };

  return (
    <div
      className={`flex items-center ${variant === 'icon' ? '' : 'space-x-2'}`}>
      <div className={`${sizeClasses[size]} overflow-hidden rounded-sm`}>
        <img
          src={trakkerLogo}
          alt="Trackerr"
          className="h-full w-full origin-center scale-[2.55] object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
