CREATE TABLE IF NOT EXISTS "accounts" (
	"uid" serial PRIMARY KEY NOT NULL,
	"screenname" varchar(24) NOT NULL,
	CONSTRAINT "accounts_screenname_unique" UNIQUE("screenname")
);
