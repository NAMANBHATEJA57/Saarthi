"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function TagInput({ value, onChange, placeholder, icon, className, ...props }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !value.includes(val)) {
        onChange([...value, val]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={cn("relative flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))] focus-within:ring-offset-2", className)}>
      {icon && (
        <div className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--ink-muted))]">
          {icon}
        </div>
      )}
      
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded bg-[hsl(var(--surface-elevated))] px-2 py-1 text-xs font-medium text-[hsl(var(--ink))]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          >
            <X className="h-3 w-3 text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]" />
          </button>
        </span>
      ))}
      
      <input
        type="text"
        className={cn(
          "flex-1 bg-transparent outline-none placeholder:text-[hsl(var(--ink-muted))] min-w-[120px]",
          icon && value.length === 0 ? "ml-6" : ""
        )}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const val = inputValue.trim();
          if (val && !value.includes(val)) {
            onChange([...value, val]);
          }
          setInputValue("");
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        {...props}
      />
    </div>
  );
}
