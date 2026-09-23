DROP INDEX "calendar_conn_user_provider_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_conn_user_email_idx" ON "calendar_connections" USING btree ("user_id","provider","email");