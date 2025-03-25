import {
  pgTable,
  varchar,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  username: varchar("username", { length: 256 }),
  email: varchar("email", { length: 320 }).unique().notNull(),
  profilePhoto: varchar("profile_photo", { length: 500 }),
  xp: integer("xp").default(0),
  points: integer("points").default(0),
  level: integer("level").default(1),
  badges1: boolean("badges1").default(false),
  badges2: boolean("badges2").default(false),
  badges3: boolean("badges3").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  longestQuizStreak: integer("longest_quiz_streak").default(0),
});

// Quiz Levels Table
export const quiz_level = pgTable("quiz_level", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  order: integer("order").notNull(),
});

// Level Streaks Table
export const level_streaks = pgTable("level_streaks", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  levelId: uuid("level_id")
    .notNull()
    .references(() => quiz_level.id),
  currentStreak: integer("current_streak").default(0),
  lastQuestionId: uuid("last_question_id").references(() => quiz_questions.id), // To track where user left off
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Quiz Questions Table
export const quiz_questions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().notNull(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => quiz_level.id),
  type: varchar("type", { length: 256 }).notNull(),
  questionText: varchar("question_text", { length: 500 }).notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  correctAnswer: varchar("correct_answer", { length: 500 }).notNull(),
  options: jsonb("options"),
});

// User Quiz Progress Table
export const user_quiz_progress = pgTable("user_quiz_progress", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  levelId: uuid("level_id")
    .notNull()
    .references(() => quiz_level.id),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quiz_questions.id),
  isCompleted: boolean("is_completed").default(false),
});

// Mission Table
export const mission = pgTable("mission", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: varchar("description", { length: 500 }),
  level: integer("level").default(1).notNull(),
  levelRequirement: integer("level_requirement").notNull(), // Number of completions needed to level up
  xpReward: integer("xp_reward").notNull(), // Base XP reward for current level
  pointsReward: integer("points_reward").notNull(), // Base points reward for current level
  badgeReward: varchar("badge_reward", { length: 500 }), // Badge image URL for current level
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// User Mission Progress Table
export const user_mission_progress = pgTable("user_mission_progress", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  missionId: uuid("mission_id")
    .notNull()
    .references(() => mission.id),
  progress_point: integer("progress_point").default(0), // Track number of times completed
  currentLevel: integer("current_level").default(1), // Current level of this mission for the user
  currentLevelRequirement: integer("current_level_requirement").notNull(), // Current level's completion requirement
  currentXpReward: integer("current_xp_reward").notNull(), // Current level's XP reward
  currentPointsReward: integer("current_points_reward").notNull(), // Current level's points reward
  lastCompletedAt: timestamp("last_completed_at"), // Track when user last completed the mission
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Achievement Table
export const achievement = pgTable("achievement", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: varchar("description", { length: 500 }), // Type of achievement (streak, mission, leaderboard)
  limit: integer("limit").notNull(),
  xpReward: integer("xp_reward").notNull(),
  pointsReward: integer("points_reward").notNull(),
  badgeReward: varchar("badge_reward", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// User Achievement Progress Table
export const user_achievement_progress = pgTable("user_achievement_progress", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  achievementId: uuid("achievement_id")
    .notNull()
    .references(() => achievement.id),
  progress_point: integer("progress_point").default(0),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// basic quote table with its author
export const quote = pgTable("quote", {
  id: uuid("id").primaryKey().notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  author: varchar("author", { length: 500 }).notNull(),
})

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(user_quiz_progress), // A user can have many progress records
  achievementProgress: many(user_achievement_progress), // A user can have many achievement progress records
}));

// Quiz Levels Relations
export const quizLevelRelations = relations(quiz_level, ({ many }) => ({
  questions: many(quiz_questions), // A level can have many questions
  progress: many(user_quiz_progress), // A level can have many progress records
}));

// Quiz Questions Relations
export const quizQuestionsRelations = relations(
  quiz_questions,
  ({ one, many }) => ({
    level: one(quiz_level, {
      // A question belongs to one level
      fields: [quiz_questions.levelId],
      references: [quiz_level.id],
    }),
    progress: many(user_quiz_progress), // A question can have many progress records
  })
);

// User Quiz Progress Relations
export const userQuizProgressRelations = relations(
  user_quiz_progress,
  ({ one }) => ({
    user: one(users, {
      // A progress record belongs to one user
      fields: [user_quiz_progress.userId],
      references: [users.id],
    }),
    level: one(quiz_level, {
      // A progress record belongs to one level
      fields: [user_quiz_progress.levelId],
      references: [quiz_level.id],
    }),
    question: one(quiz_questions, {
      // A progress record belongs to one question
      fields: [user_quiz_progress.questionId],
      references: [quiz_questions.id],
    }),
  })
);

// Mission Relations
export const missionRelations = relations(mission, ({ many }) => ({
  userProgress: many(user_mission_progress), // A mission can have many user progress records
}));

// User Mission Progress Relations
export const userMissionProgressRelations = relations(
  user_mission_progress,
  ({ one }) => ({
    user: one(users, {
      fields: [user_mission_progress.userId],
      references: [users.id],
    }),
    mission: one(mission, {
      fields: [user_mission_progress.missionId],
      references: [mission.id],
    }),
  })
);
// Achievement Relations
export const achievementRelations = relations(achievement, ({ many }) => ({
  userProgress: many(user_achievement_progress), // An achievement can have many user progress records
}));

// User Achievement Progress Relations
export const userAchievementProgressRelations = relations(
  user_achievement_progress,
  ({ one }) => ({
    user: one(users, {
      fields: [user_achievement_progress.userId],
      references: [users.id],
    }),
    achievement: one(achievement, {
      fields: [user_achievement_progress.achievementId],
      references: [achievement.id],
    }),
  })
);
