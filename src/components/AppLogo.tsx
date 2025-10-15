
import React from "react";
import trakkerLogo from "@/assets/trakker-logo.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export function AppLogo({ size = "md", variant = "full" }: AppLogoProps) {
  const sizeClasses = {
    sm: "h-10",
    md: "h-14",
    lg: "h-16",
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
