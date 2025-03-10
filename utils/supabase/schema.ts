import {
  pgTable,
  varchar,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  username: varchar("username", { length: 256 }),
  email: varchar("email", { length: 320 }).unique().notNull(),
  profilePhoto: varchar("profile_photo", { length: 500 }),
  xp: integer("xp").default(0),
  coins: integer("coins").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Quiz Levels Table
export const quiz_level = pgTable("quiz_level", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  order: integer("order").notNull(),
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

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(user_quiz_progress), // A user can have many progress records
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
