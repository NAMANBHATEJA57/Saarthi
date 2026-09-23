ALTER TABLE "finance_income_types" ADD CONSTRAINT "finance_income_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_plan_id_finance_monthly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."finance_monthly_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_expense_category_id_finance_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_savings_goal_id_finance_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."finance_savings_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plans" ADD CONSTRAINT "finance_monthly_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_monthly_plans_user_month_year_idx" ON "finance_monthly_plans" USING btree ("user_id","month","year");--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_income_type_id_finance_income_types_id_fk" FOREIGN KEY ("income_type_id") REFERENCES "public"."finance_income_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "finance_categories" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "finance_categories" DROP COLUMN "is_system_other";--> statement-breakpoint

ALTER TABLE "finance_transactions" DROP COLUMN "recurring_rule_id";
