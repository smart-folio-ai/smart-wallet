
import React from "react";
import trakkerLogo from "@/assets/trakker-logo.png";

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
      <img 
        src={trakkerLogo} 
        alt="Trakker" 
        className={sizeClasses[size]}
      />
    </div>
  );
}
