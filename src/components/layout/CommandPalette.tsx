import {useNavigate} from 'react-router-dom';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {Command as CommandPrimitive} from 'cmdk';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  ArrowRight,
  Search,
  Settings,
  Sun,
  X,
} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {useThemeToggle} from '@/components/ThemeToggle';
import {sections} from './nav-data';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ActionItem = {
  label: string;
  hint: string;
  icon: typeof Settings;
  run: () => void;
};

export function CommandPalette({open, onOpenChange}: CommandPaletteProps) {
  const navigate = useNavigate();
  const {toggleTheme} = useThemeToggle();

  const go = (to: string) => {
    navigate(to);
    onOpenChange(false);
  };

  const actions: ActionItem[] = [
    {
      label: 'Abrir configurações',
      hint: 'preferências da conta',
      icon: Settings,
      run: () => go('/settings'),
    },
    {
      label: 'Alternar tema',
      hint: 'claro / escuro',
      icon: Sun,
      run: () => {
        toggleTheme();
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-brand/30 p-0 shadow-lg sm:max-w-[620px]">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-3.5 py-3">
            <Search className="h-[17px] w-[17px] shrink-0 text-brand" />
            <CommandPrimitive.Input
              placeholder="Buscar tela, ativo ou ação…"
              className="h-8 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              esc
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar busca"
              className="h-7 w-7 border-border/60 text-muted-foreground hover:border-brand/60 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <CommandList className="max-h-[52vh] px-2 py-2">
            <CommandEmpty>
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-[13px] text-foreground">
                  Nada encontrado para esse termo
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Tente o código de um ativo, o nome de uma tela ou uma ação como
                  &quot;DARF&quot;.
                </p>
              </div>
            </CommandEmpty>

            {sections.map((section) => (
              <CommandGroup key={section.label} heading={section.label}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.to}
                    value={`${section.label} ${item.label} ${item.hint ?? ''}`}
                    onSelect={() => go(item.to)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-[13px] font-medium text-foreground data-[selected=true]:bg-brand/10">
                    <item.icon className="text-brand" />
                    <span>{item.label}</span>
                    {item.hint ? (
                      <span className="flex-1 text-[11.5px] font-normal text-muted-foreground">
                        {item.hint}
                      </span>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandGroup heading="Ações">
              {actions.map((action) => (
                <CommandItem
                  key={action.label}
                  value={`Ação ${action.label} ${action.hint}`}
                  onSelect={action.run}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-[13px] font-medium text-foreground data-[selected=true]:bg-brand/10">
                  <action.icon className="text-brand" />
                  <span>{action.label}</span>
                  <span className="flex-1 text-[11.5px] font-normal text-muted-foreground">
                    {action.hint}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2.5 text-[10.5px] text-muted-foreground">
            <span>⌘K abre esta busca em qualquer tela</span>
            <span className="ml-auto">↑↓ navegar · ⏎ abrir · esc fechar</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
