ALTER TABLE "finance_monthly_plan_items" ALTER COLUMN "amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ALTER COLUMN "ultimate_target_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ALTER COLUMN "monthly_target_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ALTER COLUMN "current_saved_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_transactions" ALTER COLUMN "amount" SET DATA TYPE double precision;