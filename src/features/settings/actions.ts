"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name must be less than 80 characters"),
  timezone: z.string().min(1, "Timezone is required"),
  weekStartsOn: z.coerce.number().int().min(0).max(1),
  theme: z.enum(["system", "dark", "light"]),
});

export async function saveSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;
  const rawData = {
    name: formData.get("name"),
    timezone: formData.get("timezone"),
    weekStartsOn: formData.get("weekStartsOn"),
    theme: formData.get("theme"),
  };

  const parsed = settingsSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error.flatten() };
  }

  try {
    await db.transaction(async (tx) => {
      // Update users table for name
      await tx.update(users)
        .set({ name: parsed.data.name })
        .where(eq(users.id, userId));

      // Update or insert user_preferences
      const existing = await tx.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
      
      if (existing.length > 0) {
        await tx.update(userPreferences)
          .set({
            timezone: parsed.data.timezone,
            weekStartsOn: parsed.data.weekStartsOn,
            theme: parsed.data.theme,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId));
      } else {
        await tx.insert(userPreferences).values({
          userId,
          timezone: parsed.data.timezone,
          weekStartsOn: parsed.data.weekStartsOn,
          theme: parsed.data.theme,
        });
      }
    });

    revalidatePath("/settings");
    revalidatePath("/today");
    return { success: true };
  } catch (err) {
    console.error("Failed to save settings:", err);
    return { error: "Failed to save settings" };
  }
}
