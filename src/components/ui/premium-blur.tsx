
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumBlurProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const PremiumBlur = ({ 
  children, 
  title = "Recurso Premium", 
  description = "Faça upgrade para acessar este recurso",
  className = ""
}: PremiumBlurProps) => {
  const navigate = useNavigate();

  return (
    <div className={`relative ${className}`}>
      {/* Conteúdo com blur */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay premium */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4 border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full">
                <Crown className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-primary">{title}</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {description}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/subscription')}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold"
              >
                <Zap className="mr-2 h-4 w-4" />
                Fazer Upgrade
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Acesse análises avançadas, insights de IA e muito mais!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
