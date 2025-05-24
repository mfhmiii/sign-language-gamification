DROP TABLE "achievement" CASCADE;--> statement-breakpoint
DROP TABLE "user_achievement_progress" CASCADE;--> statement-breakpoint
ALTER TABLE "mission" ADD COLUMN "is_daily" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "mission" ADD COLUMN "reset_time" timestamp;