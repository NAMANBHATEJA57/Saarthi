CREATE TABLE "object_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"relationship_type" text DEFAULT 'RELATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "object_relationships" ADD CONSTRAINT "object_relationships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rel_source_idx" ON "object_relationships" USING btree ("user_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "rel_target_idx" ON "object_relationships" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rel_unique_idx" ON "object_relationships" USING btree ("user_id","source_type","source_id","target_type","target_id");