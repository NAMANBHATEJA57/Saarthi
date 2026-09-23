CREATE TABLE "finance_income_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_monthly_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"expense_category_id" uuid,
	"savings_goal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_monthly_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"ultimate_target_amount" integer,
	"account_id" uuid,
	"monthly_target_amount" integer,
	"current_saved_amount" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_allocation_rule_sets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_allocation_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_allocation_snapshots" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_recurring_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "finance_allocation_rule_sets" CASCADE;--> statement-breakpoint
DROP TABLE "finance_allocation_rules" CASCADE;--> statement-breakpoint
DROP TABLE "finance_allocation_snapshots" CASCADE;--> statement-breakpoint
DROP TABLE "finance_recurring_rules" CASCADE;--> statement-breakpoint
DROP INDEX "finance_transactions_recurring_rule_idx";--> statement-breakpoint
DROP INDEX "tasks_open_idx";--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD COLUMN "opening_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD COLUMN "opening_balance_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "finance_accounts" RENAME COLUMN "credit_limit_minor" TO "credit_limit";--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD COLUMN "opening_outstanding" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD COLUMN "opening_outstanding_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "finance_accounts" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "finance_transactions" RENAME COLUMN "amount_minor" TO "amount";--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "external_recipient_name" text;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "income_type_id" uuid;--> statement-breakpoint
ALTER TABLE "finance_transactions" RENAME COLUMN "remark" TO "description";--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "merchant" text;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status" text DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "all_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminder_minutes" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_provider" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_account_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_calendar_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_event_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sync_hash" text;--> statement-breakpoint
ALTER TABLE "finance_income_types" ADD CONSTRAINT "finance_income_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_plan_id_finance_monthly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."finance_monthly_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_expense_category_id_finance_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plan_items" ADD CONSTRAINT "finance_monthly_plan_items_savings_goal_id_finance_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."finance_savings_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_monthly_plans" ADD CONSTRAINT "finance_monthly_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_monthly_plans_user_month_year_idx" ON "finance_monthly_plans" USING btree ("user_id","month","year");--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_income_type_id_finance_income_types_id_fk" FOREIGN KEY ("income_type_id") REFERENCES "public"."finance_income_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_external_sync_idx" ON "tasks" USING btree ("external_provider","external_account_id","external_event_id");--> statement-breakpoint
CREATE INDEX "tasks_open_idx" ON "tasks" USING btree ("user_id","status","priority","position");--> statement-breakpoint

ALTER TABLE "finance_categories" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "finance_categories" DROP COLUMN "is_system_other";--> statement-breakpoint

ALTER TABLE "finance_transactions" DROP COLUMN "recurring_rule_id";