import { statSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { BASE_OUTPUT_DIR } from "../constants";
import { visualizeTrace } from "../visualize-trace";

const latestTrace = await visualizeLatestTrace();
console.log(chalk.bgBlackBright(`\nLatest trace: ${latestTrace}\n`));

async function visualizeLatestTrace(): Promise<string | undefined> {
	try {
		const traces = await fs.readdir(BASE_OUTPUT_DIR);
		if (traces.length === 0) {
			console.log("No traces found.");
			return undefined;
		}

		const latestTrace = await getLatestTrace();
		await visualizeTrace(latestTrace);

		return latestTrace;
	} catch (error) {
		console.error("Error visualizing latest trace:", error);
		return undefined;
	}
}

async function getLatestTrace(): Promise<string> {
	const traces = await fs.readdir(BASE_OUTPUT_DIR);
	return traces.sort((a, b) => {
		return (
			statSync(path.join(BASE_OUTPUT_DIR, b)).mtime.getTime() -
			statSync(path.join(BASE_OUTPUT_DIR, a)).mtime.getTime()
		);
	})[0];
}
