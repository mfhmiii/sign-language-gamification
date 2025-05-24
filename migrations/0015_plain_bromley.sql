CREATE TABLE "gesture_to_text_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid NOT NULL,
	"correct_answer" varchar(500) NOT NULL,
	"gesture_video_url" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_match_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"grid_size" integer DEFAULT 4
);
--> statement-breakpoint
CREATE TABLE "multiple_choice_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_id" uuid NOT NULL,
	"correct_answer" varchar(500) NOT NULL,
	"options" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_dictionary_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"dictionary_id" uuid NOT NULL,
	"is_learned" boolean DEFAULT false,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_questions" ALTER COLUMN "type" SET DEFAULT 'multiple_choice';--> statement-breakpoint
ALTER TABLE "dictionary" ADD COLUMN "type" varchar;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "dictionary_id" uuid;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "gesture_to_text_questions" ADD CONSTRAINT "gesture_to_text_questions_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_match_questions" ADD CONSTRAINT "memory_match_questions_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multiple_choice_questions" ADD CONSTRAINT "multiple_choice_questions_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dictionary_progress" ADD CONSTRAINT "user_dictionary_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dictionary_progress" ADD CONSTRAINT "user_dictionary_progress_dictionary_id_dictionary_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_dictionary_id_dictionary_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" DROP COLUMN "correct_answer";--> statement-breakpoint
ALTER TABLE "quiz_questions" DROP COLUMN "options";