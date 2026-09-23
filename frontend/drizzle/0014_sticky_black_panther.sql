CREATE TABLE "finance_recurring_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" double precision NOT NULL,
	"currency_code" text DEFAULT 'INR' NOT NULL,
	"account_id" uuid,
	"destination_account_id" uuid,
	"category_id" uuid,
	"income_type_id" uuid,
	"savings_goal_id" uuid,
	"description" text,
	"merchant" text,
	"notes" text,
	"frequency" text NOT NULL,
	"next_due_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_accounts" ALTER COLUMN "opening_balance" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_accounts" ALTER COLUMN "credit_limit" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_accounts" ALTER COLUMN "opening_outstanding" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD COLUMN "savings_goal_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "expected_monthly_income" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_account_id_finance_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_destination_account_id_finance_accounts_id_fk" FOREIGN KEY ("destination_account_id") REFERENCES "public"."finance_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_income_type_id_finance_income_types_id_fk" FOREIGN KEY ("income_type_id") REFERENCES "public"."finance_income_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_transactions" ADD CONSTRAINT "finance_recurring_transactions_savings_goal_id_finance_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."finance_savings_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_savings_goal_id_finance_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."finance_savings_goals"("id") ON DELETE no action ON UPDATE no action;