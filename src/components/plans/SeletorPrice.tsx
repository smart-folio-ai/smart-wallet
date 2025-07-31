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
    <div className="flex items-center justify-center bg-muted p-1 rounded-lg w-fit mx-auto mb-8">
      <Button
        variant={pricingPeriod === 'monthly' ? 'default' : 'ghost'}
        className="rounded-lg"
        onClick={() => setPricingPeriod('monthly')}>
        {leftSeletorName}
      </Button>
      <Button
        variant={pricingPeriod === 'annual' ? 'default' : 'ghost'}
        className="rounded-lg"
        onClick={() => setPricingPeriod('annual')}>
        <span>{rightSeletorName}</span>
        {badgeName && (
          <Badge
            variant="outline"
            className="ml-2 bg-primary/20 text-primary-foreground border-none">
            {badgeName}
          </Badge>
        )}
      </Button>
    </div>
  );
};
