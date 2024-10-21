import { exportKey, generateKeyPair } from "./src/lib/crypto";

generateKeyPair().then(async (keys) => {
  const publicKeyExport = await exportKey("public", keys.publicKey);
  console.log("public key export\n\n", publicKeyExport);
  const privateKeyExport = await exportKey("private", keys.privateKey);
  console.log("\n\n\nprivate key export\n\n", privateKeyExport);

  console.log(
    "!!! When adding to .dev.vars, use double quotes and write literal newlines !!!",
  );
});
