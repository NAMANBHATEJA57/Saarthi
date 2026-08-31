"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, LayoutDashboard, Settings, Plus, Apple, Scale, Search, Dumbbell, IndianRupee, CheckSquare, StickyNote } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { GlobalCaptureModal } from "./GlobalCaptureModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const primaryLinks = [
  { name: "Today", href: "/today", icon: Calendar },
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
];

const lifeLinks = [
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: StickyNote },
];

const healthLinks = [
  { name: "Workout", href: "/workout", icon: Dumbbell },
  { name: "Weight", href: "/weight", icon: Scale },
  { name: "Food", href: "/food", icon: Apple },
];

const financeLinks = [
  { name: "Finance", href: "/finance", icon: IndianRupee },
];

type NavItem = { name: string; href: string; icon: React.ElementType; comingSoon?: boolean };

const NavLink = ({ item, isMobile = false, pathname }: { item: NavItem, isMobile?: boolean, pathname: string }) => {
  const isActive = pathname.startsWith(item.href) && (pathname === item.href || item.href !== '/');
  
  if (isMobile) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 py-2",
          isActive
            ? "text-[hsl(var(--ink))]"
            : "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
        )}
      >
        <item.icon className="w-6 h-6" />
        <span className="text-[10px] font-medium">{item.name}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md text-[14px] font-medium transition-all duration-200 group active:scale-[0.98]",
        isActive
          ? "bg-[hsl(var(--surface-elevated))] text-[hsl(var(--ink))] font-semibold shadow-sm"
          : "text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface))] hover:text-[hsl(var(--ink))] hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className="w-4 h-4" />
        {item.name}
      </div>
      {item.comingSoon && (
        <span className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-elevated))] opacity-0 group-hover:opacity-100 transition-opacity">
          Next
        </span>
      )}
    </Link>
  );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] w-full bg-[hsl(var(--canvas))] text-[hsl(var(--ink))]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] sticky top-0 h-[100dvh]">
        <div className="p-4 flex items-center gap-2 mb-2 h-14 border-b border-[hsl(var(--hairline))]">
          <img src="/logo.png" alt="Saarthi Logo" className="w-6 h-6 rounded-[4px] object-cover" />
          <span className="font-semibold text-[14px]">Saarthi</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {primaryLinks.map((item) => (
              <NavLink key={item.name} item={item} pathname={pathname} />
            ))}
          </div>

          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">
              LIFE
            </div>
            <div className="space-y-1">
              {lifeLinks.map((item) => (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
          
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">
              HEALTH
            </div>
            <div className="space-y-1">
              {healthLinks.map((item) => (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
          
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">
              WEALTH
            </div>
            <div className="space-y-1">
              {financeLinks.map((item) => (
                <NavLink key={item.name} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-[hsl(var(--hairline))]">
          <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} pathname={pathname} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col pb-16 md:pb-0 min-h-0">
        
        {/* Contextual Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))]/80 backdrop-blur-md px-4 md:px-8">
          <div className="flex items-center gap-4">
            <span className="font-medium text-[15px] capitalize text-[hsl(var(--ink))]">
              {pathname === '/' ? 'Today' : pathname.split('/')[1]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:flex items-center justify-between px-3 py-1.5 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))] rounded-[var(--radius)] text-[13px] font-medium transition-colors text-[hsl(var(--ink-secondary))] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--ink-muted))] min-w-[200px]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search...
              </div>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-1.5 font-mono text-[10px] font-medium text-[hsl(var(--ink-muted))]">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <Button variant="primary" className="h-8 px-3 text-xs" onClick={() => setIsCaptureOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 max-w-[1024px]">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[hsl(var(--canvas))]/90 backdrop-blur-md border-t border-[hsl(var(--hairline))] flex items-center justify-around px-2 pb-safe z-50">
        <NavLink item={primaryLinks[0]} isMobile pathname={pathname} />
        <NavLink item={healthLinks[0]} isMobile pathname={pathname} />
        
        {/* Mobile FAB-style New Button */}
        <div className="flex-1 flex justify-center -mt-8">
          <button 
            onClick={() => setIsCaptureOpen(true)}
            className="flex items-center justify-center w-14 h-14 bg-[hsl(var(--primary))] text-white rounded-full shadow-lg border-4 border-[hsl(var(--canvas))] active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <NavLink item={financeLinks[0]} isMobile pathname={pathname} />
        <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} isMobile pathname={pathname} />
      </nav>
      
      <CommandMenu />
      <GlobalCaptureModal open={isCaptureOpen} onOpenChange={setIsCaptureOpen} />
    </div>
  );
}
