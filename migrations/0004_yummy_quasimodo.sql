CREATE TABLE "user_level_streaks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0,
	"last_question_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "longest_quiz_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_level_streaks" ADD CONSTRAINT "user_level_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_level_streaks" ADD CONSTRAINT "user_level_streaks_level_id_quiz_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."quiz_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_level_streaks" ADD CONSTRAINT "user_level_streaks_last_question_id_quiz_questions_id_fk" FOREIGN KEY ("last_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "rank";