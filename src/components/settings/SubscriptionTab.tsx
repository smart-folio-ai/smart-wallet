
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check } from 'lucide-react';

interface Subscription {
  planId: string;
  planName: string;
  status: string;
  expiresAt?: string;
  features: string[];
}

interface SubscriptionTabProps {
  subscription: Subscription | undefined;
  formatDate: (date: string | Date) => string;
}

export function SubscriptionTab({ subscription, formatDate }: SubscriptionTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-primary" />
          <CardTitle>Plano Atual</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              {subscription?.planName}
            </h3>
            <p className="text-muted-foreground">
              Status:{' '}
              <Badge variant="default">
                {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </p>
            {subscription?.expiresAt && (
              <p className="text-sm text-muted-foreground">
                Expira em: {formatDate(subscription.expiresAt)}
              </p>
            )}
          </div>
          <Button asChild>
            <a href="/subscription">Gerenciar Plano</a>
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Recursos inclusos:</h4>
          <ul className="space-y-1">
            {subscription?.features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
