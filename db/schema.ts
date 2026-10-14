import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  data: text("data").notNull(),
  publishedData: text("published_data"),
  ownerId: text("owner_id").notNull(),
  status: text("status").notNull().default("draft"),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const team = sqliteTable("team", {
  email: text("email").primaryKey(),
  userId: text("user_id").unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("author"),
  createdAt: text("created_at").notNull(),
});

export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull(),
  data: text("data").notNull(),
  savedBy: text("saved_by").notNull(),
  savedAt: text("saved_at").notNull(),
});


export const contributors = sqliteTable("contributors", {
  id: text("id").primaryKey(), slug: text("slug").notNull().unique(),
  data: text("data").notNull(), publishedData: text("published_data"),
  ownerId: text("owner_id").notNull(), status: text("status").notNull().default("draft"),
  revision: integer("revision").notNull().default(1), updatedAt: text("updated_at").notNull(),
});
