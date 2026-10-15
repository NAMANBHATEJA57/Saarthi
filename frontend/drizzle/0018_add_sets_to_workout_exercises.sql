ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "sets" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "reps" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "rest" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "instructions" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN IF NOT EXISTS "is_optional" boolean DEFAULT false NOT NULL;
