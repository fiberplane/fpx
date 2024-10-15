export const readIndexFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<R2ObjectBody | null> => {
  const indexKey = `${sessionId}/index.ts`;
  return R2.get(indexKey);
};

export const writeIndexFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<void> => {
  const indexKey = `${sessionId}/index.ts`;
  await R2.put(indexKey, content);
};

export const readSchemaFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<R2ObjectBody | null> => {
  const schemaKey = `${sessionId}/schema.ts`;
  return R2.get(schemaKey);
};

export const writeSchemaFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<void> => {
  const schemaKey = `${sessionId}/schema.ts`;
  await R2.put(schemaKey, content);
};

export const readSeedFile = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<R2ObjectBody | null> => {
  const seedKey = `${sessionId}/seed.ts`;
  return R2.get(seedKey);
};

export const writeSeedFile = async (
  R2: R2Bucket,
  sessionId: string,
  content: string,
): Promise<void> => {
  const seedKey = `${sessionId}/seed.ts`;
  await R2.put(seedKey, content);
};

export const readProjectFiles = async (
  R2: R2Bucket,
  sessionId: string,
): Promise<{
  indexFile: R2ObjectBody | null;
  schemaFile: R2ObjectBody | null;
  seedFile: R2ObjectBody | null;
}> => {
  const [indexFile, schemaFile, seedFile] = await Promise.all([
    readIndexFile(R2, sessionId),
    readSchemaFile(R2, sessionId),
    readSeedFile(R2, sessionId),
  ]);

  return { indexFile, schemaFile, seedFile };
};
