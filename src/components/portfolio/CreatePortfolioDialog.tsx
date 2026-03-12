import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Plus, Loader2} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import portfolioService from '@/services/portfolio';

const formSchema = z.object({
  name: z.string().min(3, 'Nome muito curto').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  ownerType: z.enum(['self', 'spouse', 'child', 'other']),
  ownerName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreatePortfolioDialog() {
  const [open, setOpen] = useState(false);
  const {toast} = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ownerType: 'self',
      ownerName: '',
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return portfolioService.createPortfolio({
        name: data.name,
        ownerType: data.ownerType,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Carteira criada com sucesso!',
      });
      queryClient.invalidateQueries({queryKey: ['portfolios']});
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar carteira',
        description:
          error?.response?.data?.message ||
          'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createPortfolioMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteira
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Carteira</DialogTitle>
          <DialogDescription>
            Adicione um novo portfólio para organizar seus investimentos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Nome da Carteira</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Aposentadoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerType"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Tipo de Titular</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self">Eu mesmo</SelectItem>
                      <SelectItem value="spouse">Cônjuge</SelectItem>
                      <SelectItem value="child">Filho(a)</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Carteira
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
