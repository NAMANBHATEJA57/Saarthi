import { Apple, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FoodPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
      <EmptyState
        icon={<Apple className="w-8 h-8" />}
        title="Food Tracking"
        description="Search for foods and log your daily meals here. Start building your nutritional database."
        action={
          <Link 
            href="/today"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--surface-elevated))] hover:bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-[var(--radius)] text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Today
          </Link>
        }
      />
    </div>
  );
}
