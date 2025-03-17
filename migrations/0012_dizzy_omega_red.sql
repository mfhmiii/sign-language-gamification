ALTER TABLE "achievement" RENAME COLUMN "level_requirement" TO "limit";--> statement-breakpoint
ALTER TABLE "achievement" DROP COLUMN "level";--> statement-breakpoint
ALTER TABLE "user_achievement_progress" DROP COLUMN "current_level";--> statement-breakpoint
ALTER TABLE "user_achievement_progress" DROP COLUMN "current_level_requirement";--> statement-breakpoint
ALTER TABLE "user_achievement_progress" DROP COLUMN "current_xp_reward";--> statement-breakpoint
ALTER TABLE "user_achievement_progress" DROP COLUMN "current_points_reward";