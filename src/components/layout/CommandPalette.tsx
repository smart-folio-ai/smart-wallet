import {useNavigate} from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Settings, Sun} from '@/components/ui/icons';
import {useThemeToggle} from '@/components/ThemeToggle';
import {sections} from './nav-data';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({open, onOpenChange}: CommandPaletteProps) {
  const navigate = useNavigate();
  const {toggleTheme} = useThemeToggle();

  const go = (to: string) => {
    navigate(to);
    onOpenChange(false);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar uma tela ou ação..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ir para">
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => go(item.to)}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            )),
          )}
        </CommandGroup>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => go('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Abrir configurações
          </CommandItem>
          <CommandItem onSelect={handleToggleTheme}>
            <Sun className="mr-2 h-4 w-4" />
            Alternar tema
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
