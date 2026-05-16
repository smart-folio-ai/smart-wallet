import {FormEvent, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/useAuth';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
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
import AdminService from '@/services/admin';

export default function AdminGrants() {
  const {isAdmin} = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [grantType, setGrantType] = useState<'TRIAL_7_DAYS' | 'PERMANENT'>('TRIAL_7_DAYS');
  const [notes, setNotes] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'admin'>('editor');

  const {data: plans} = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => AdminService.getPlans(),
  });

  const activePlans = useMemo(
    () => (plans || []).filter((plan) => plan.isActive),
    [plans],
  );

  const grantMutation = useMutation({
    mutationFn: () =>
      AdminService.grantSubscription({
        email,
        planId,
        grantType,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Concessão manual aplicada com sucesso.');
      setEmail('');
      setPlanId('');
      setNotes('');
      setGrantType('TRIAL_7_DAYS');
      queryClient.invalidateQueries({queryKey: ['admin-overview']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível aplicar a concessão.');
    },
  });

  const roleMutation = useMutation({
    mutationFn: () => AdminService.updateUserRoleByEmail({email: roleEmail, role}),
    onSuccess: () => {
      toast.success('Permissão atualizada com sucesso.');
      setRoleEmail('');
      setRole('editor');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível atualizar a permissão.');
    },
  });

  const handleGrant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    grantMutation.mutate();
  };

  const handleRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    roleMutation.mutate();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Concessão manual de plano</CardTitle>
          <CardDescription>
            Conceda trial de 7 dias ou acesso permanente informando apenas o e-mail do usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grant-email">E-mail do usuário</Label>
              <Input
                id="grant-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo da concessão</Label>
              <Select value={grantType} onValueChange={(value) => setGrantType(value as 'TRIAL_7_DAYS' | 'PERMANENT')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL_7_DAYS">Trial grátis por 7 dias</SelectItem>
                  <SelectItem value="PERMANENT">Plano permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-notes">Observação da auditoria</Label>
              <Textarea
                id="grant-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Motivo interno da concessão"
              />
            </div>

            <Button type="submit" disabled={grantMutation.isPending || !planId}>
              {grantMutation.isPending ? 'Aplicando...' : 'Confirmar concessão'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Delegar permissão de editor/admin</CardTitle>
            <CardDescription>
              Use isso para liberar funcionários que poderão operar a concessão manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRole} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-email">E-mail do usuário</Label>
                <Input
                  id="role-email"
                  type="email"
                  value={roleEmail}
                  onChange={(event) => setRoleEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as 'editor' | 'admin')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={roleMutation.isPending}>
                {roleMutation.isPending ? 'Atualizando...' : 'Salvar permissão'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
