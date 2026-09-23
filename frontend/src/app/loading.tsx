"use client";

import { ThinkingOrb } from 'thinking-orbs';

export default function Loading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center">
      <div className="scale-[2]">
        <ThinkingOrb state="working" size={64} theme="auto" />
      </div>
    </div>
  );
}
