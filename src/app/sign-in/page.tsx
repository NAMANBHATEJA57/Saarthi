import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center flex flex-col items-center">
          
          {/* Logo with Next.js Image for proper optimization + fallback */}
          <div className="relative w-16 h-16 rounded-xl mb-4 shadow-sm overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Saarthi"
              width={64}
              height={64}
              priority
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Saarthi</h1>
          <p className="text-sm text-[hsl(var(--ink-secondary))]">
            Enter your credentials to unlock.
          </p>
        </div>
        <form
          action={async (formData) => {
            "use server";
            await signIn("credentials", formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <input
              id="username"
              name="username"
              type="text"
              placeholder="ID"
              required
              className="flex h-12 w-full rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] px-4 py-2 text-base shadow-sm placeholder:text-[hsl(var(--ink-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
            />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              required
              className="flex h-12 w-full rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] px-4 py-2 text-base shadow-sm placeholder:text-[hsl(var(--ink-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full h-12 text-base">
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
