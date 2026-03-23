import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import React, {Component} from 'react';

interface SeletorPriceProps {
  pricingPeriod: 'monthly' | 'annual';
  setPricingPeriod: (period: 'monthly' | 'annual') => void;
  leftSeletorName: string;
  rightSeletorName: string;
  badgeName?: string;
}

export const SeletorPrice: React.FC<SeletorPriceProps> = ({
  pricingPeriod,
  setPricingPeriod,
  leftSeletorName,
  rightSeletorName,
  badgeName = 'Economize 30%',
}) => {
  return (
    <div className="flex items-center justify-center bg-secondary/60 backdrop-blur-sm p-1.5 rounded-2xl w-fit mx-auto mb-8 border border-border shadow-inner">
      <Button
        variant={pricingPeriod === 'monthly' ? 'default' : 'ghost'}
        className={`rounded-xl px-6 h-10 transition-all ${pricingPeriod === 'monthly' ? 'bg-background text-foreground shadow-sm font-semibold hover:bg-background/90' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setPricingPeriod('monthly')}>
        {leftSeletorName}
      </Button>
      <Button
        variant={pricingPeriod === 'annual' ? 'default' : 'ghost'}
        className={`rounded-xl px-6 h-10 transition-all ${pricingPeriod === 'annual' ? 'bg-background text-foreground shadow-sm font-semibold hover:bg-background/90' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => setPricingPeriod('annual')}>
        <span>{rightSeletorName}</span>
        {badgeName && (
          <Badge
            variant="secondary"
            className="ml-2.5 bg-primary/10 text-primary font-bold border-none px-2 py-0.5 whitespace-nowrap">
            {badgeName}
          </Badge>
        )}
      </Button>
    </div>
  );
};

