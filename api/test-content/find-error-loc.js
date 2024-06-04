const { SourceMapConsumer } = require("source-map");
const fs = require("fs");

async function findOriginalPosition(jsFile, line, column) {
	// Load the source map from the same directory as the JS file
	const mapFile = jsFile + ".map"; // Adjust if your source map is located elsewhere
	const sourceMap = JSON.parse(fs.readFileSync(mapFile, "utf8"));

	const consumer = await new SourceMapConsumer(sourceMap);

	const pos = consumer.originalPositionFor({
		line: line,
		column: column,
	});

	console.log("Original position:", pos);
	consumer.destroy();

	return pos;
}

const stack = `
ReferenceError: process is not defined at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:12662:19 at dispatch (file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6029:23) at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6030:20 at logger2 (file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:12584:11) at dispatch (file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6029:23) at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6030:20 at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:12623:9 at dispatch (file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6029:23) at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6006:12 at file:///Users/brettbeutell/fiber/bug/.wrangler/tmp/dev-makb1q/index.js:6608:31
`.trim();

findOriginalPosition("./scripts/index.js", 12662, 19).then((pos) => {
	const vscodeLink = `vscode://file/${pos.source}:${pos.line}:${pos.column}`;
	console.log("vscodeLink", vscodeLink);
});
