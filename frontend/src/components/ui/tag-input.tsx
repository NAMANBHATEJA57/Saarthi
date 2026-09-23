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
  suggestions?: string[];
}

export function TagInput({ value, onChange, placeholder, icon, className, suggestions = [], ...props }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

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

  const addTag = (tagToAdd: string) => {
    if (!value.includes(tagToAdd)) {
      onChange([...value, tagToAdd]);
    }
    setInputValue("");
  };

  return (
    <div className="relative">
      <div className={cn(
        "relative flex min-h-10 w-full flex-wrap gap-2 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] px-3 py-2 text-sm transition-colors",
        "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
        icon && "pl-9",
        className
      )}>
        {icon && (
          <div className="absolute left-3 top-3 flex h-4 w-4 items-center justify-center text-[hsl(var(--ink-muted))]">
            {icon}
          </div>
        )}
        
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-[hsl(var(--surface-elevated))] px-2 py-1 text-xs font-medium text-[hsl(var(--ink))]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-3 w-3 text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]" />
            </button>
          </span>
        ))}
        
        <input
          type="text"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-[hsl(var(--ink-muted))] min-w-[120px]"
          )}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            const val = inputValue.trim();
            if (val && !value.includes(val)) {
              onChange([...value, val]);
            }
            setInputValue("");
            setIsFocused(false);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          {...props}
        />
      </div>

      {isFocused && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] py-1 shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                addTag(suggestion);
                setIsFocused(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-[hsl(var(--ink))] hover:bg-[hsl(var(--surface))] transition-colors"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
