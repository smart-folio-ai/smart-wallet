import {useQuery} from '@tanstack/react-query';
import {BarChart3, BadgeCheck, Crown, Sparkles, Users} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import AdminService from '@/services/admin';

const metricCards = [
  {
    key: 'totalActiveSubscriptions',
    label: 'Assinaturas Ativas',
    icon: BadgeCheck,
  },
  {
    key: 'totalTrialSubscriptions',
    label: 'Trials Ativos',
    icon: Sparkles,
  },
  {
    key: 'totalManualGrants',
    label: 'Concessões Manuais',
    icon: Users,
  },
] as const;

export default function AdminDashboard() {
  const {data, isLoading} = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => AdminService.getOverview(),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({key, label, icon: Icon}) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {isLoading ? '...' : data?.[key] ?? 0}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Mais Usado</CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {isLoading ? 'Carregando...' : data?.mostUsedPlan?.planName ?? 'Sem dados'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.mostUsedPlan ? `${data.mostUsedPlan.count} usuários ativos` : 'Nenhuma assinatura ativa'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Usuários por plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Usuários</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.usersByPlan || []).map((item) => (
                <TableRow key={item.planId}>
                  <TableCell className="font-medium">{item.planName}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                </TableRow>
              ))}
              {!isLoading && !data?.usersByPlan?.length ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Nenhum dado de assinatura disponível.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
