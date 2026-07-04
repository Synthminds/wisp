CREATE TYPE "public"."briefing_audience" AS ENUM('wes', 'ria', 'family');--> statement-breakpoint
CREATE TYPE "public"."captured_by" AS ENUM('wes', 'ria', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."confirmer" AS ENUM('wes', 'ria');--> statement-breakpoint
CREATE TYPE "public"."criticality" AS ENUM('routine', 'critical');--> statement-breakpoint
CREATE TYPE "public"."device_kind" AS ENUM('cozyla', 'satellite_a9', 'satellite_a9plus', 'phone');--> statement-breakpoint
CREATE TYPE "public"."human_owner" AS ENUM('wes', 'ria', 'shared', 'outsource', 'tbd');--> statement-breakpoint
CREATE TYPE "public"."monitoring_tier" AS ENUM('T1_calendar', 'T2_state', 'T3_human_capture');--> statement-breakpoint
CREATE TYPE "public"."observation_state" AS ENUM('new', 'routed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('proposed', 'approved', 'amended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."responsibility_status" AS ENUM('active', 'paused', 'retired');--> statement-breakpoint
CREATE TYPE "public"."signal_kind" AS ENUM('due', 'overdue', 'low_stock', 'conflict', 'gap', 'anomaly');--> statement-breakpoint
CREATE TYPE "public"."signal_state" AS ENUM('open', 'surfaced', 'resolved', 'expired');--> statement-breakpoint
CREATE TABLE "briefing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"for_date" date NOT NULL,
	"audience" "briefing_audience" NOT NULL,
	"body_md" text NOT NULL,
	"signal_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivered_via" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "briefing" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "capture_deadletter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"raw_text" text NOT NULL,
	"reason" text NOT NULL,
	"device_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capture_deadletter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "confirmation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_id" uuid,
	"plan_item_id" uuid,
	"confirmed_by" "confirmer" NOT NULL,
	"photo_url" text,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "confirmation_xor" CHECK (("confirmation"."signal_id" IS NULL) <> ("confirmation"."plan_item_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "confirmation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "device_kind" NOT NULL,
	"room" text NOT NULL,
	"fkb_endpoint" text,
	"fkb_password_env" text,
	"announce_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"raw_text" text NOT NULL,
	"extract" jsonb,
	"responsibility_id" text,
	"captured_by" "captured_by" DEFAULT 'unknown' NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_ref" text NOT NULL,
	"state" "observation_state" DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_of" date NOT NULL,
	"status" "plan_status" DEFAULT 'proposed' NOT NULL,
	"approved_by" "confirmer",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plan_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"responsibility_id" text NOT NULL,
	"proposal" text NOT NULL,
	"due_at" timestamp with time zone,
	"pact" boolean DEFAULT false NOT NULL,
	"pact_owner" "confirmer",
	CONSTRAINT "pact_requires_owner" CHECK ("plan_item"."pact" = false OR "plan_item"."pact_owner" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "plan_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "responsibility" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"planning_description" text NOT NULL,
	"planning_owner" text DEFAULT 'wisp' NOT NULL,
	"planning_owner_legacy" "human_owner" NOT NULL,
	"planning_dod" text NOT NULL,
	"monitoring_description" text NOT NULL,
	"monitoring_owner" text DEFAULT 'wisp' NOT NULL,
	"monitoring_owner_legacy" "human_owner" NOT NULL,
	"monitoring_dod" text NOT NULL,
	"execution_description" text NOT NULL,
	"execution_owner" "human_owner" NOT NULL,
	"execution_dod" text NOT NULL,
	"frequency" text NOT NULL,
	"monitoring_tier" "monitoring_tier" NOT NULL,
	"status" "responsibility_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "planning_owner_is_wisp" CHECK ("responsibility"."planning_owner" = 'wisp'),
	CONSTRAINT "monitoring_owner_is_wisp" CHECK ("responsibility"."monitoring_owner" = 'wisp')
);
--> statement-breakpoint
ALTER TABLE "responsibility" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "signal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"responsibility_id" text NOT NULL,
	"tier" "monitoring_tier" NOT NULL,
	"kind" "signal_kind" NOT NULL,
	"criticality" "criticality" DEFAULT 'routine' NOT NULL,
	"escalation_policy" jsonb,
	"due_at" timestamp with time zone,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state" "signal_state" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_plan_item_id_plan_item_id_fk" FOREIGN KEY ("plan_item_id") REFERENCES "public"."plan_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation" ADD CONSTRAINT "observation_responsibility_id_responsibility_id_fk" FOREIGN KEY ("responsibility_id") REFERENCES "public"."responsibility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_responsibility_id_responsibility_id_fk" FOREIGN KEY ("responsibility_id") REFERENCES "public"."responsibility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_responsibility_id_responsibility_id_fk" FOREIGN KEY ("responsibility_id") REFERENCES "public"."responsibility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "confirmation_signal_uniq" ON "confirmation" USING btree ("signal_id") WHERE "confirmation"."signal_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "confirmation_plan_item_uniq" ON "confirmation" USING btree ("plan_item_id") WHERE "confirmation"."plan_item_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "observation_device_ref_key" ON "observation" USING btree ("device_ref");--> statement-breakpoint
CREATE INDEX "signal_responsibility_idx" ON "signal" USING btree ("responsibility_id");--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "briefing" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "briefing" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "briefing" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "briefing" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "capture_deadletter" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "capture_deadletter" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "capture_deadletter" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "capture_deadletter" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "confirmation" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "confirmation" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "confirmation" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "confirmation" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "device" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "device" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "device" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "device" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "observation" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "observation" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "observation" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "observation" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "plan" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "plan" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "plan" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "plan" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "plan_item" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "plan_item" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "plan_item" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "plan_item" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "responsibility" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "responsibility" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "responsibility" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "responsibility" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "signal" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "signal" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "signal" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "signal" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);