import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackButton({ 
  onClick, 
  className, 
  fallbackHref 
}: { 
  onClick?: () => void; 
  className?: string;
  fallbackHref?: string;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // In Next.js App Router, router.back() works, but if there's no history,
      // it might not do anything. fallbackHref provides a safe alternative if needed.
      if (window.history.length > 1) {
        router.back();
      } else if (fallbackHref) {
        router.push(fallbackHref);
      } else {
        router.push('/');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface))] hover:border-[hsl(var(--ink-secondary))] transition-colors active:scale-[0.98]",
        className
      )}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]" />
    </button>
  );
}
