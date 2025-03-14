ALTER TABLE "users" RENAME COLUMN "coins" TO "points";--> statement-breakpoint
ALTER TABLE "quiz_level" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rank" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badges1" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badges2" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badges3" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_rank_unique" UNIQUE("rank");