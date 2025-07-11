import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RulesCardProps {
  title: string;
  rules: string[];
}

export function RulesCard({ title, rules }: RulesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs md:text-sm space-y-1 md:space-y-2 text-muted-foreground">
          {rules.map((rule, index) => (
            <p key={index}>• {rule}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 