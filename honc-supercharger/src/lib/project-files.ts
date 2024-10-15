export const readIndexFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<string | null> => {
  const indexKey = `${sessionId}/index.ts`;
  const object = await R2.get(indexKey);
  return object ? await object.text() : null;
};

export const writeIndexFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<string> => {
  const indexKey = `${sessionId}/index.ts`;
  await R2.put(indexKey, content);
  return indexKey;
};

export const readSchemaFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<string | null> => {
  const schemaKey = `${sessionId}/schema.ts`;
  const object = await R2.get(schemaKey);
  return object ? await object.text() : null;
};

export const writeSchemaFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<string> => {
  const schemaKey = `${sessionId}/schema.ts`;
  await R2.put(schemaKey, content);
  return schemaKey;
};

export const readSeedFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<string | null> => {
  const seedKey = `${sessionId}/seed.ts`;
  const object = await R2.get(seedKey);
  return object ? await object.text() : null;
};

export const writeSeedFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<string> => {
  const seedKey = `${sessionId}/seed.ts`;
  await R2.put(seedKey, content);
  return seedKey;
};

export const readProjectFiles = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<{
  indexFile: string | null;
  schemaFile: string | null;
  seedFile: string | null;
}> => {
  const [indexFile, schemaFile, seedFile] = await Promise.all([
    readIndexFile(R2, sessionId),
    readSchemaFile(R2, sessionId),
    readSeedFile(R2, sessionId),
  ]);

  return { indexFile, schemaFile, seedFile };
};
