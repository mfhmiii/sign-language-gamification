CREATE TABLE "achievement" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(500),
	"type" varchar(50) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"level_requirement" integer NOT NULL,
	"xp_reward" integer NOT NULL,
	"points_reward" integer NOT NULL,
	"badge_reward" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievement_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"progress_point" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"current_level_requirement" integer NOT NULL,
	"current_xp_reward" integer NOT NULL,
	"current_points_reward" integer NOT NULL,
	"last_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_achievement_progress" ADD CONSTRAINT "user_achievement_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievement_progress" ADD CONSTRAINT "user_achievement_progress_achievement_id_achievement_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE no action ON UPDATE no action;