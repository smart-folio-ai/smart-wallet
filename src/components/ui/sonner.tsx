import {useTheme} from 'next-themes';
import {Toaster as Sonner} from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({...props}: ToasterProps) => {
  const {theme = 'system'} = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg rounded-lg font-medium',
          description: 'group-[.toast]:!text-[#fff] text-sm',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:!text-[#fff]',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:!text-[#fff]',
          success:
            'group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-green-400 group-[.toaster]:!to-emerald-500 group-[.toaster]:!text-white group-[.toaster]:!border-emerald-400',
          error:
            'group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-red-400 group-[.toaster]:!to-rose-500 group-[.toaster]:!text-white group-[.toaster]:!border-rose-400',
          warning:
            'group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-yellow-400 group-[.toaster]:!to-amber-500 group-[.toaster]:!text-white group-[.toaster]:!border-amber-400',
          info: 'group-[.toaster]:!bg-gradient-to-r group-[.toaster]:!from-blue-400 group-[.toaster]:!to-indigo-500 group-[.toaster]:!text-white group-[.toaster]:!border-indigo-400',
        },
      }}
      {...props}
    />
  );
};

export {Toaster};
