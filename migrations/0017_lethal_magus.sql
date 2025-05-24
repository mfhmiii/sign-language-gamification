CREATE TABLE "login_streaks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0,
	"last_login_date" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mission" ALTER COLUMN "level_requirement" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "login_streaks" ADD CONSTRAINT "login_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;