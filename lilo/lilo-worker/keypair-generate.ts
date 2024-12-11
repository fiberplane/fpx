import { exportKey, generateKeyPair } from "./src/lib/crypto";

generateKeyPair().then(async (keys) => {
  const publicKeyExport = await exportKey("public", keys.publicKey);
  console.log(
    "\n\npublic key export:\n",
    `"${publicKeyExport.trim().replace(/[\r\n]+/g, "\\n")}"`,
  );

  const privateKeyExport = await exportKey("private", keys.privateKey);
  console.log(
    "\n\n\nprivate key export:\n",
    `"${privateKeyExport.trim().replace(/[\r\n]+/g, "\\n")}"`,
  );

  console.log(
    "\n\n!!! When adding to .dev.vars, use double quotes and write literal newlines !!!",
  );
});
