import { Apple, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FoodPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="p-4 bg-[hsl(var(--surface-elevated))] rounded-full border border-[hsl(var(--hairline))]">
        <Apple className="w-12 h-12 text-[hsl(var(--ink-secondary))]" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Food Module</h1>
        <p className="text-sm text-[hsl(var(--ink-secondary))] leading-relaxed">
          The Food module is coming in Phase 2. It will enable comprehensive nutrition tracking, recipe management, and meal logging.
        </p>
      </div>

      <Link 
        href="/today"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-md text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Today
      </Link>
    </div>
  );
}
