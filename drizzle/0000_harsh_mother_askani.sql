CREATE TABLE "category_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "category_rules_pattern_unique" UNIQUE("pattern")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"category" text,
	"account" text,
	"transaction_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"openai_api_key" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vector_store" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"source_id" text NOT NULL,
	"text" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_category_rules_pattern" ON "category_rules" USING btree ("pattern");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_transactions_category" ON "transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_date" ON "transactions" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_settings_user_id" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vector_store_user_id" ON "vector_store" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vector_store_doc_type" ON "vector_store" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "idx_vector_store_user_doctype" ON "vector_store" USING btree ("user_id","doc_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vector_store_unique" ON "vector_store" USING btree ("user_id","doc_type","source_id");