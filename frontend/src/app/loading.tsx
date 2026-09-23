import { ThinkingOrb } from 'thinking-orbs';

export default function Loading() {
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center py-12">
      <ThinkingOrb state="working" size={64} theme="auto" />
      <p className="mt-8 text-sm font-medium text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  );
}
