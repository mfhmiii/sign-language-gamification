CREATE TABLE "mission" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(500),
	"current_level" integer DEFAULT 1 NOT NULL,
	"level_requirement" integer NOT NULL,
	"xp_reward" integer NOT NULL,
	"points_reward" integer NOT NULL,
	"badge_reward" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mission_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"completion_count" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"last_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_level_streaks" RENAME TO "level_streaks";--> statement-breakpoint
ALTER TABLE "level_streaks" DROP CONSTRAINT "user_level_streaks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "level_streaks" DROP CONSTRAINT "user_level_streaks_level_id_quiz_level_id_fk";
--> statement-breakpoint
ALTER TABLE "level_streaks" DROP CONSTRAINT "user_level_streaks_last_question_id_quiz_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_mission_id_mission_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."mission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_streaks" ADD CONSTRAINT "level_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_streaks" ADD CONSTRAINT "level_streaks_level_id_quiz_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."quiz_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_streaks" ADD CONSTRAINT "level_streaks_last_question_id_quiz_questions_id_fk" FOREIGN KEY ("last_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;