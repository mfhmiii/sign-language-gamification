import { pgTable, varchar, uuid, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().notNull(), 
    username: varchar("username", { length: 256 }),
    email: varchar("email", { length: 320 }).unique().notNull(),
    profilePhoto: varchar("profile_photo", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
