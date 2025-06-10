import React from 'react';
import {Loader as LoaderIcon} from 'lucide-react';

interface LoaderProps {
  text: string;
}

function Loader({text}: LoaderProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/30 opacity-75"></div>
          </div>
          <LoaderIcon className="h-16 w-16 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-medium text-foreground animate-pulse">
          {text}
        </h2>
      </div>
    </div>
  );
}

export default Loader;
