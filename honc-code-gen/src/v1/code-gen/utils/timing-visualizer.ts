import chalk from "chalk";

export interface TimingData {
	[key: string]: number;
}

export function visualizeTimingData(timings: TimingData | string): string {
	let timingData: TimingData;

	if (typeof timings === "string") {
		try {
			timingData = JSON.parse(timings);
		} catch (error) {
			console.error("Error parsing timing data:", error);
			return "Error: Invalid timing data format";
		}
	} else if (typeof timings === "object" && timings !== null) {
		timingData = timings;
	} else {
		console.error("Invalid timings data:", timings);
		return "Error: Invalid timing data";
	}

	const entries = Object.entries(timingData);
	if (entries.length === 0) {
		return "No timing data available";
	}

	const longestKeyLength = Math.max(...entries.map(([key]) => key.length));

	return entries
		.map(([key, value]) => {
			const paddedKey = key.padEnd(longestKeyLength);
			const formattedTime = formatTime(value);
			return `${chalk.blue(paddedKey)}: ${chalk.yellow(formattedTime)}`;
		})
		.join("\n");
}

function formatTime(ms: number): string {
	if (ms < 1) {
		return `${(ms * 1000).toFixed(2)}µs`;
	}
	if (ms < 1000) {
		return `${ms.toFixed(2)}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}
