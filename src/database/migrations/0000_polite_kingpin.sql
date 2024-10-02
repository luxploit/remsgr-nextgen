DO $$ BEGIN
 CREATE TYPE "public"."list" AS ENUM('FL', 'RL', 'AL', 'BL', 'PL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('superuser', 'moderator', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"uid" serial PRIMARY KEY NOT NULL,
	"screen_name" varchar(32) NOT NULL,
	"email" varchar(128) NOT NULL,
	"password_md5" varchar(32) NOT NULL,
	"password_sha224" varchar(64) NOT NULL,
	"last_modified" timestamp NOT NULL,
	CONSTRAINT "accounts_screen_name_unique" UNIQUE("screen_name"),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "details" (
	"uid" serial PRIMARY KEY NOT NULL,
	"phone_home" varchar(95),
	"phone_work" varchar(95),
	"phone_mobile" varchar(95),
	"last_modified" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lists" (
	"uid" serial NOT NULL,
	"contact_id" serial NOT NULL,
	"list_type" "list" NOT NULL,
	"reason" varchar,
	"friended_on" timestamp NOT NULL,
	CONSTRAINT "friend_unique_idx" UNIQUE("uid","contact_id","list_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"uid" serial PRIMARY KEY NOT NULL,
	"display_name" varchar(387) NOT NULL,
	"groups" varchar[],
	"allow_list" integer[],
	"block_list" integer[],
	"forward_list" integer[],
	"privacy_flags" integer DEFAULT 0 NOT NULL,
	"role" "role",
	"cl_version" integer DEFAULT 0 NOT NULL,
	"last_login" timestamp,
	"signup_date" timestamp DEFAULT now() NOT NULL,
	"last_modified" timestamp NOT NULL,
	CONSTRAINT "users_display_name_unique" UNIQUE("display_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "details" ADD CONSTRAINT "details_uid_accounts_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."accounts"("uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lists" ADD CONSTRAINT "lists_uid_accounts_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."accounts"("uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lists" ADD CONSTRAINT "lists_contact_id_accounts_uid_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."accounts"("uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_uid_accounts_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."accounts"("uid") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
