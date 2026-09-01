ALTER TABLE "finance_income_types" ADD COLUMN "expected_amount" double precision;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD COLUMN "income_type_id" uuid;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD COLUMN "target_percentage" double precision;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_income_type_id_finance_income_types_id_fk" FOREIGN KEY ("income_type_id") REFERENCES "public"."finance_income_types"("id") ON DELETE no action ON UPDATE no action;