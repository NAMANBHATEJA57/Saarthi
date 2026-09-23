CREATE TABLE "food_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"nutrient_key" text NOT NULL,
	"amount" numeric NOT NULL,
	"unit" text NOT NULL,
	"basis" text,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "food_portions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"label" text NOT NULL,
	"grams" numeric,
	"milliliters" numeric,
	"ordering" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_search_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_key" text NOT NULL,
	"query_key" text NOT NULL,
	"result_refs" jsonb NOT NULL,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stale_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "food_source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"normalized_record_version" text NOT NULL,
	"normalized_identity" text NOT NULL,
	"provenance" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stale_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "food_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"reliability_config" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"attribution" text
);
--> statement-breakpoint
CREATE TABLE "meal_item_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_item_id" uuid NOT NULL,
	"nutrient_key" text NOT NULL,
	"amount" numeric NOT NULL,
	"unit" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"ordering" integer DEFAULT 0 NOT NULL,
	"selected_source_ref" text,
	"selected_user_food_id" uuid,
	"display_snapshot" jsonb NOT NULL,
	"selected_portion_snapshot" jsonb NOT NULL,
	"quantity" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload_summary" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"local_date" date NOT NULL,
	"meal_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_food_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_food_id" uuid NOT NULL,
	"nutrient_key" text NOT NULL,
	"amount" numeric NOT NULL,
	"unit" text NOT NULL,
	"basis" text,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "user_food_portions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_food_id" uuid NOT NULL,
	"label" text NOT NULL,
	"measure" numeric,
	"amount" numeric NOT NULL,
	"equivalent_grams" numeric,
	"equivalent_milliliters" numeric
);
--> statement-breakpoint
CREATE TABLE "user_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"search_fields" text,
	"linked_public_record_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_record_id_food_source_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."food_source_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_portions" ADD CONSTRAINT "food_portions_record_id_food_source_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."food_source_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_source_records" ADD CONSTRAINT "food_source_records_source_id_food_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."food_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_item_nutrients" ADD CONSTRAINT "meal_item_nutrients_meal_item_id_meal_items_id_fk" FOREIGN KEY ("meal_item_id") REFERENCES "public"."meal_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_selected_user_food_id_user_foods_id_fk" FOREIGN KEY ("selected_user_food_id") REFERENCES "public"."user_foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_revisions" ADD CONSTRAINT "meal_revisions_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_nutrients" ADD CONSTRAINT "user_food_nutrients_user_food_id_user_foods_id_fk" FOREIGN KEY ("user_food_id") REFERENCES "public"."user_foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_portions" ADD CONSTRAINT "user_food_portions_user_food_id_user_foods_id_fk" FOREIGN KEY ("user_food_id") REFERENCES "public"."user_foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_foods" ADD CONSTRAINT "user_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_foods" ADD CONSTRAINT "user_foods_linked_public_record_id_food_source_records_id_fk" FOREIGN KEY ("linked_public_record_id") REFERENCES "public"."food_source_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_nutrients_rec_idx" ON "food_nutrients" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "food_search_cache_src_query_idx" ON "food_search_cache" USING btree ("source_key","query_key");--> statement-breakpoint
CREATE UNIQUE INDEX "food_src_rec_ext_ver_idx" ON "food_source_records" USING btree ("source_id","external_id","normalized_record_version");--> statement-breakpoint
CREATE INDEX "meal_items_meal_id_idx" ON "meal_items" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meals_user_date_idx" ON "meals" USING btree ("user_id","local_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_foods_user_id_idx" ON "user_foods" USING btree ("user_id");