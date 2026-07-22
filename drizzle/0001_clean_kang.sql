CREATE TABLE "trade_checklist_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" uuid NOT NULL,
	"checklist_rule_id" uuid NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"phase" text
);
--> statement-breakpoint
CREATE TABLE "trade_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"strategy_id" uuid,
	"direction" text NOT NULL,
	"entry_price" double precision NOT NULL,
	"exit_price" double precision,
	"quantity" double precision NOT NULL,
	"stop_loss_price" double precision,
	"take_profit_price" double precision,
	"entered_at" timestamp with time zone NOT NULL,
	"exited_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"pnl_amount" double precision,
	"pnl_override" boolean DEFAULT false NOT NULL,
	"risk_amount" double precision,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trade_checklist_responses" ADD CONSTRAINT "trade_checklist_responses_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_checklist_responses" ADD CONSTRAINT "trade_checklist_responses_checklist_rule_id_checklist_rules_id_fk" FOREIGN KEY ("checklist_rule_id") REFERENCES "public"."checklist_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_screenshots" ADD CONSTRAINT "trade_screenshots_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE no action ON UPDATE no action;