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
  badges4: boolean("badges4").default(false),
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

// Login Streaks Table
export const login_streaks = pgTable("login_streaks", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  lastLoginDate: timestamp("last_login_date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Quiz Types Enum
export const QuizType = {
  MULTIPLE_CHOICE: "multiple_choice",
  GESTURE_TO_TEXT: "gesture_to_text",
  MEMORY_MATCH: "memory_match",
} as const;

// Quiz Questions Table (Base table)
export const quiz_questions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().notNull(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => quiz_level.id),
  type: varchar("type", { length: 256 })
    .notNull()
    .default(QuizType.MULTIPLE_CHOICE),
  dictionaryId: uuid("dictionary_id").references(() => dictionary.id),
  questionText: varchar("question_text", { length: 500 }).notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  stage:integer("stage"),
  order: integer("order").default(0),
});

// Multiple Choice Questions Table
export const multiple_choice_questions = pgTable("multiple_choice_questions", {
  id: uuid("id").primaryKey().notNull(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quiz_questions.id),
  correctAnswer: varchar("correct_answer", { length: 500 }).notNull(),
  options: jsonb("options").notNull(),
});

// Gesture to Text Questions Table
export const gesture_to_text_questions = pgTable("gesture_to_text_questions", {
  id: uuid("id").primaryKey().notNull(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quiz_questions.id),
  correctAnswer: varchar("correct_answer", { length: 500 }).notNull(),
  gestureVideoUrl: varchar("gesture_video_url", { length: 500 }).notNull(),
});

// Memory Match Questions Table
export const memory_match_questions = pgTable("memory_match_questions", {
  id: uuid("id").primaryKey().notNull(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quiz_questions.id),
  correctAnswer: jsonb("correct_answer").notNull(), // Array of {text: string, videoUrl: string} pairs
  options: jsonb("options").notNull(), // Array of possible matches including distractors
  gridSize: integer("grid_size").default(4), // Number of pairs to show (2x2, 3x3, etc)
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
  level: integer("level").default(0),
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
  progressPoint: integer("progress_point").default(0), // Track number of times completed
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

export const daily_mission = pgTable("daily_mission", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: varchar("description", { length: 500 }),
  xpReward: integer("xp_reward").notNull(),
  pointsReward: integer("points_reward").notNull(),
  levelRequirement: integer("level_requirement").default(1), // Added level_requirement field
  resetTime: timestamp("reset_time").notNull(), // When the daily mission resets
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// User Daily Mission Progress Table
export const user_daily_mission_progress = pgTable(
  "user_daily_mission_progress",
  {
    id: uuid("id").primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    dailyMissionId: uuid("daily_mission_id")
      .notNull()
      .references(() => daily_mission.id),
    progressPoint: integer("progress_point").default(0),
    // Removed currentLevelRequirement field
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }
);

// basic quote table with its author
export const quote = pgTable("quote", {
  id: uuid("id").primaryKey().notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  author: varchar("author", { length: 500 }).notNull(),
});

export const dictionary = pgTable("dictionary", {
  id: uuid("id").primaryKey().notNull(),
  value: varchar("value", { length: 500 }).notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  type: varchar("type"),
});

// User Dictionary Progress Table
export const user_dictionary_progress = pgTable("user_dictionary_progress", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  dictionaryId: uuid("dictionary_id")
    .notNull()
    .references(() => dictionary.id),
  progressPoint: integer("progress_point").default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Dictionary Relations
export const dictionaryRelations = relations(dictionary, ({ many }) => ({
  userProgress: many(user_dictionary_progress), // A dictionary entry can have many user progress records
}));

// User Dictionary Progress Relations
export const userDictionaryProgressRelations = relations(
  user_dictionary_progress,
  ({ one }) => ({
    user: one(users, {
      fields: [user_dictionary_progress.userId],
      references: [users.id],
    }),
    dictionary: one(dictionary, {
      fields: [user_dictionary_progress.dictionaryId],
      references: [dictionary.id],
    }),
  })
);

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(user_quiz_progress), // A user can have many progress records
  missionProgress: many(user_mission_progress), // A user can have many mission progress records
  dailyMissionProgress: many(user_daily_mission_progress), // A user can have many daily mission progress records
  loginStreak: many(login_streaks), // A user can have login streak records
}));

// Login Streaks Relations
export const loginStreaksRelations = relations(login_streaks, ({ one }) => ({
  user: one(users, {
    fields: [login_streaks.userId],
    references: [users.id],
  }),
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

export const dailyMissionRelations = relations(daily_mission, ({ many }) => ({
  userProgress: many(user_daily_mission_progress),
}));

export const userDailyMissionProgressRelations = relations(
  user_daily_mission_progress,
  ({ one }) => ({
    user: one(users, {
      fields: [user_daily_mission_progress.userId],
      references: [users.id],
    }),
    dailyMission: one(daily_mission, {
      fields: [user_daily_mission_progress.dailyMissionId],
      references: [daily_mission.id],
    }),
  })
);
