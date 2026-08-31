"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAccountDialog } from "@/components/finance/AddAccountDialog";

export function SettingsFinanceSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
      <h3 className="text-sm font-semibold">Finance Integration</h3>
      <p className="text-xs text-[hsl(var(--ink-secondary))]">
        Link bank accounts or credit cards to manage your ledger directly in Saarthi.
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="w-4 h-4" /> Add Account or Card
      </Button>

      <AddAccountDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        onSuccess={() => window.location.href = '/finance'} 
      />
    </div>
  );
}
