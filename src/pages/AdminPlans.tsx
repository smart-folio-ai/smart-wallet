import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {FormEvent, useState} from 'react';
import {toast} from 'sonner';
import {AdminPlan} from '@/interface/admin';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import AdminService from '@/services/admin';

type PlanFormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: string;
  features: string;
};

const initialForm: PlanFormState = {
  name: '',
  description: '',
  price: '',
  currency: 'brl',
  interval: 'month',
  intervalCount: '1',
  features: '',
};

function mapPlanToForm(plan: AdminPlan): PlanFormState {
  return {
    name: plan.name,
    description: plan.description || '',
    price: String(plan.price),
    currency: plan.currency || 'brl',
    interval: (plan.interval as PlanFormState['interval']) || 'month',
    intervalCount: String(plan.intervalCount || 1),
    features: (plan.features || []).join('\n'),
  };
}

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(initialForm);

  const {data: plans, isLoading} = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => AdminService.getPlans(),
  });

  const resetForm = () => {
    setEditingPlan(null);
    setForm(initialForm);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency.trim().toLowerCase(),
        interval: form.interval,
        intervalCount: Number(form.intervalCount),
        features: form.features
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingPlan) {
        return AdminService.updatePlan(editingPlan._id, payload);
      }

      return AdminService.createPlan(payload);
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.');
      queryClient.invalidateQueries({queryKey: ['admin-plans']});
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível salvar o plano.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (planId: string) => AdminService.deactivatePlan(planId),
    onSuccess: () => {
      toast.success('Plano desativado com sucesso.');
      queryClient.invalidateQueries({queryKey: ['admin-plans']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível desativar o plano.');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingPlan ? 'Editar plano' : 'Novo plano'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nome</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Descrição</Label>
              <Textarea
                id="plan-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Preço</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({...prev, price: event.target.value}))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-currency">Moeda</Label>
                <Input
                  id="plan-currency"
                  value={form.currency}
                  onChange={(event) => setForm((prev) => ({...prev, currency: event.target.value}))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Intervalo</Label>
                <Select
                  value={form.interval}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      interval: value as PlanFormState['interval'],
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mensal</SelectItem>
                    <SelectItem value="year">Anual</SelectItem>
                    <SelectItem value="week">Semanal</SelectItem>
                    <SelectItem value="day">Diário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-interval-count">Qtd. de intervalos</Label>
                <Input
                  id="plan-interval-count"
                  type="number"
                  min="1"
                  step="1"
                  value={form.intervalCount}
                  onChange={(event) => setForm((prev) => ({...prev, intervalCount: event.target.value}))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-features">Features (uma por linha)</Label>
              <Textarea
                id="plan-features"
                value={form.features}
                onChange={(event) => setForm((prev) => ({...prev, features: event.target.value}))}
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : editingPlan ? 'Atualizar plano' : 'Criar plano'}
              </Button>
              {editingPlan ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plans || []).map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{plan.intervalCount}x {plan.interval}</div>
                  </TableCell>
                  <TableCell>
                    {plan.currency?.toUpperCase()} {plan.price.toFixed(2)}
                  </TableCell>
                  <TableCell>{plan.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingPlan(plan);
                        setForm(mapPlanToForm(plan));
                      }}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!plan.isActive || deactivateMutation.isPending}
                        onClick={() => deactivateMutation.mutate(plan._id)}>
                        Desativar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !plans?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum plano cadastrado.
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
