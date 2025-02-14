import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { type DBSchema, users } from "../db";

/**
 * Upserts a user in the database.
 * If the user exists, it simply updates the email.
 * If not, it inserts a new user and gives them 100 aiRequestCredits.
 */
export async function upsertUser(
  db: DrizzleD1Database<DBSchema>,
  user: typeof users.$inferInsert,
) {
  return await db
    .insert(users)
    .values({
      ...user,
      aiRequestCredits: 100,
    })
    .onConflictDoUpdate({
      target: users.githubUsername,
      set: {
        email: user.email,
      },
    })
    .returning();
}

export async function getUserById(
  db: DrizzleD1Database<DBSchema>,
  userId: number,
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    console.warn("user not found, id:", userId);
  }

  return user ?? null;
}

export async function decrementAiCredits(
  db: DrizzleD1Database<DBSchema>,
  userId: number,
) {
  const user = await getUserById(db, userId);

  const decrementedCredits = user.aiRequestCredits - 1;

  return await db
    .insert(users)
    .values({
      ...user,
      aiRequestCredits: decrementedCredits,
    })
    .onConflictDoUpdate({
      target: users.githubUsername,
      set: {
        aiRequestCredits: decrementedCredits,
      },
    })
    .returning();
}
