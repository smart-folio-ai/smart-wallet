import {useState} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface FeatureTourItem {
  title: string;
  description: string;
}

interface FeatureTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  subheading: string;
  items: FeatureTourItem[];
  onExit: () => void;
  onSkip: () => void;
  onStartTutorial: () => void;
}

export function FeatureTourModal({
  open,
  onOpenChange,
  heading,
  subheading,
  items,
  onExit,
  onSkip,
  onStartTutorial,
}: FeatureTourModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = items[activeIndex];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl overflow-hidden border border-primary/20 bg-card p-0">
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 px-8 py-12 text-center text-slate-900">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-4xl font-black tracking-tight sm:text-5xl">
              {heading}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xl font-semibold text-blue-700 sm:text-2xl">
              {subheading}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-6 text-slate-100">
          <p className="mb-2 text-xl font-bold sm:text-2xl">{current?.title}</p>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            {current?.description}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={`tour-dot-${index}`}
                type="button"
                aria-label={`Ir para item ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-emerald-400'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <AlertDialogFooter className="mt-6 border-t border-slate-700 pt-4">
            <AlertDialogCancel
              className="border-slate-500 bg-transparent text-white hover:bg-slate-700"
              onClick={onExit}>
              Sair
            </AlertDialogCancel>
            <AlertDialogCancel
              className="border-slate-500 bg-transparent text-white hover:bg-slate-700"
              onClick={onSkip}>
              Pular tutorial
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={onStartTutorial}>
              Ver tutorial
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

