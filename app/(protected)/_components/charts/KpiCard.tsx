import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FC } from 'react';


interface KpiCardProps {
  title: string;
  number: string | number;
  icon: React.ReactNode;
  description: string;
}

const KpiCard: FC<KpiCardProps> = ({ title, number, icon, description }) => {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{number}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
