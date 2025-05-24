CREATE TABLE "daily_mission" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(500),
	"xp_reward" integer NOT NULL,
	"points_reward" integer NOT NULL,
	"reset_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_daily_mission_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_mission_id" uuid NOT NULL,
	"progress_point" integer DEFAULT 0,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_dictionary_progress" RENAME COLUMN "is_learned" TO "progress_point";--> statement-breakpoint
ALTER TABLE "mission" ALTER COLUMN "level_requirement" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_daily_mission_progress" ADD CONSTRAINT "user_daily_mission_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_mission_progress" ADD CONSTRAINT "user_daily_mission_progress_daily_mission_id_daily_mission_id_fk" FOREIGN KEY ("daily_mission_id") REFERENCES "public"."daily_mission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission" DROP COLUMN "is_daily";--> statement-breakpoint
ALTER TABLE "mission" DROP COLUMN "reset_time";