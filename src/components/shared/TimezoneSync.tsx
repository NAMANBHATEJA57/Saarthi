"use client";

import { useEffect, useRef } from "react";
import { updateTimezone } from "@/features/settings/actions";

export function TimezoneSync({ serverTimezone }: { serverTimezone: string }) {
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (syncAttempted.current) return;
    syncAttempted.current = true;
    
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Only update if the browser timezone differs from what the server thinks it is.
    // E.g., if the user is new and the server defaulted to UTC, this will automatically set it to their local timezone.
    if (tz && tz !== serverTimezone) {
      updateTimezone(tz);
    }
  }, [serverTimezone]);

  return null;
}
