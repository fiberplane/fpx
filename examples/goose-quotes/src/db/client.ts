import { neon } from "@neondatabase/serverless";
import { asc, eq, ilike } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/neon-http";
import { geese } from "./schema";

export const getAllGeese = async (db: ReturnType<typeof drizzle>) => {
  console.log("Fetching all geese");
  return await db.select().from(geese);
};

export const searchGeese = async (
  db: ReturnType<typeof drizzle>,
  name: string,
) => {
  console.log({ action: "searchGeese", name });
  return await db
    .select()
    .from(geese)
    .where(ilike(geese.name, `%${name}%`))
    .orderBy(asc(geese.name));
};

export const createGoose = async (
  db: ReturnType<typeof drizzle>,
  gooseData: Partial<typeof geese.$inferInsert>,
) => {
  const { name, isFlockLeader, programmingLanguage, motivations, location } =
    gooseData;
  const description = `A person named ${name} who talks like a Goose`;

  console.log({
    action: "createGoose",
    name,
    isFlockLeader,
    programmingLanguage,
  });

  return await db
    .insert(geese)
    .values({
      name,
      description,
      isFlockLeader,
      programmingLanguage,
      motivations,
      location,
    })
    .returning({
      id: geese.id,
      name: geese.name,
      description: geese.description,
      isFlockLeader: geese.isFlockLeader,
      programmingLanguage: geese.programmingLanguage,
      motivations: geese.motivations,
      location: geese.location,
    });
};

export const getGooseById = async (
  db: ReturnType<typeof drizzle>,
  id: number,
) => {
  console.log(`Fetching goose with id: ${id}`);
  return (await db.select().from(geese).where(eq(geese.id, id)))?.[0];
};

export const getFlockLeaders = async (db: ReturnType<typeof drizzle>) => {
  console.log("Fetching flock leaders");
  return await db.select().from(geese).where(eq(geese.isFlockLeader, true));
};

export const updateGooseName = async (
  db: ReturnType<typeof drizzle>,
  id: number,
  name: string,
) => {
  console.log({ action: "updateGooseName", id, name });
  return (
    await db.update(geese).set({ name }).where(eq(geese.id, id)).returning()
  )?.[0];
};

export const getGeeseByLanguage = async (
  db: ReturnType<typeof drizzle>,
  language: string,
) => {
  console.log(`Fetching geese with programming language: ${language}`);
  return await db
    .select()
    .from(geese)
    .where(ilike(geese.programmingLanguage, `%${language}%`));
};

export const updateGooseMotivations = async (
  db: ReturnType<typeof drizzle>,
  id: number,
  motivations: string,
) => {
  console.log({ action: "updateGooseMotivations", id, motivations });
  return (
    await db
      .update(geese)
      .set({ motivations })
      .where(eq(geese.id, id))
      .returning()
  )?.[0];
};

export const updateGooseAvatar = async (
  db: ReturnType<typeof drizzle>,
  id: number,
  avatarKey: string,
) => {
  console.log(`Updating avatar for goose with id: ${id}`);
  return (
    await db
      .update(geese)
      .set({ avatar: avatarKey })
      .where(eq(geese.id, id))
      .returning()
  )[0];
};

export const updateGoose = async (
  db: ReturnType<typeof drizzle>,
  id: number,
  updateData: Partial<typeof geese.$inferInsert>,
) => {
  console.log({ action: "updateGoose", id, updateData });

  // Simulate a race condition by splitting the update into two parts
  const updatePromises = Object.entries(updateData).map(
    async ([key, value]) => {
      // Introduce a random delay to increase the chance of interleaved updates
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

      return db
        .update(geese)
        .set({ [key]: value })
        .where(eq(geese.id, id))
        .returning();
    },
  );

  // Wait for all updates to complete
  const results = await Promise.alla(updatePromises);

  // Return the last result, which may not contain all updates
  return results[results.length - 1][0];
};
