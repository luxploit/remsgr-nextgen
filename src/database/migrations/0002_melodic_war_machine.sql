ALTER TABLE "accounts" ADD COLUMN "guid" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_guid_unique" UNIQUE("guid");