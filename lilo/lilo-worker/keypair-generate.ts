import { exportKey, generateKeyPair } from "./src/lib/crypto";

const IS_LOCAL = process.env.ENVIRONMENT !== "production";

function formatForLocal(key: string) {
  return `"${key.trim().replace(/[\r\n]+/g, "\\n")}"`
}

generateKeyPair().then(async (keys) => {
  const publicKeyExport = await exportKey("public", keys.publicKey);
  const formattedPublicKey = IS_LOCAL ? formatForLocal(publicKeyExport) : publicKeyExport;
  console.log(
    `\n\n\npublic key export:\n\n${formattedPublicKey}\n`,
  );

  const privateKeyExport = await exportKey("private", keys.privateKey);
  const formattedPrivateKey = IS_LOCAL ? formatForLocal(privateKeyExport) : privateKeyExport;
  console.log(
    `\n\n\nprivate key export:\n\n${formattedPrivateKey}\n`,
  );

  console.log(
    "\n\n!!! When adding to .dev.vars, use double quotes and write literal newlines !!!",
  );
});
