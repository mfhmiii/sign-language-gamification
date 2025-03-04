CREATE TABLE "quiz_level" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"level_id" uuid NOT NULL,
	"type" varchar(256) NOT NULL,
	"question_text" varchar(500) NOT NULL,
	"video_url" varchar(500),
	"correct_answer" varchar(500) NOT NULL,
	"options" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_quiz_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "coins" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_level_id_quiz_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."quiz_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_level_id_quiz_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."quiz_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;