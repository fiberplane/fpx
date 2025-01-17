import { randomBytes } from "node:crypto";

const generateSessionSecret = () => randomBytes(64).toString("hex");

const sessionSecret = generateSessionSecret();
console.log(`Your session secret:\n\n${sessionSecret}\n`);
