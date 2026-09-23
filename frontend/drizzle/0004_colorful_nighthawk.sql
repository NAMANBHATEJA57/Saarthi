CREATE TABLE "finance_allocation_rule_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_allocation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"label" text NOT NULL,
	"purpose" text NOT NULL,
	"percentage_basis_points" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"expense_category_id" uuid
);
--> statement-breakpoint
CREATE TABLE "finance_allocation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"income_transaction_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"label" text NOT NULL,
	"purpose" text NOT NULL,
	"percentage_basis_points" integer NOT NULL,
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"is_system_other" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"suggestion_keys" jsonb
);
--> statement-breakpoint
CREATE TABLE "finance_recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency_code" text NOT NULL,
	"category_id" uuid NOT NULL,
	"remark_template" text,
	"frequency" text DEFAULT 'MONTHLY' NOT NULL,
	"day_of_month" integer NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"next_occurrence_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"replaced_by_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency_code" text NOT NULL,
	"transaction_date" date NOT NULL,
	"category_id" uuid NOT NULL,
	"remark" text,
	"source" text NOT NULL,
	"recurring_rule_id" uuid,
	"status" text DEFAULT 'POSTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_allocation_rule_sets" ADD CONSTRAINT "finance_allocation_rule_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_allocation_rules" ADD CONSTRAINT "finance_allocation_rules_rule_set_id_finance_allocation_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."finance_allocation_rule_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_allocation_rules" ADD CONSTRAINT "finance_allocation_rules_expense_category_id_finance_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_allocation_snapshots" ADD CONSTRAINT "finance_allocation_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_allocation_snapshots" ADD CONSTRAINT "finance_allocation_snapshots_income_transaction_id_finance_transactions_id_fk" FOREIGN KEY ("income_transaction_id") REFERENCES "public"."finance_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_rules" ADD CONSTRAINT "finance_recurring_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_recurring_rules" ADD CONSTRAINT "finance_recurring_rules_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_allocation_snapshots_income_rule_idx" ON "finance_allocation_snapshots" USING btree ("income_transaction_id","rule_id");--> statement-breakpoint
CREATE INDEX "finance_transactions_user_id_date_idx" ON "finance_transactions" USING btree ("user_id","transaction_date");--> statement-breakpoint
CREATE INDEX "finance_transactions_user_id_type_date_idx" ON "finance_transactions" USING btree ("user_id","type","transaction_date");--> statement-breakpoint
CREATE INDEX "finance_transactions_recurring_rule_idx" ON "finance_transactions" USING btree ("recurring_rule_id");