
import React from "react";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export function AppLogo({ size = "md", variant = "full" }: AppLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div className={`flex items-center ${variant === 'icon' ? '' : 'space-x-2'}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className={`relative ${sizeClasses[size]} aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary to-info flex items-center justify-center`}>
          <span className="text-white font-bold text-xl">S</span>
          <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-white/30 rounded-full blur-sm" />
        </div>
      </div>
      {variant === "full" && (
        <span className="font-bold text-foreground text-xl leading-tight">
          Smart<span className="text-primary">Folio</span>
        </span>
      )}
    </div>
  );
}
