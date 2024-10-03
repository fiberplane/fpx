# Static Analysis to Expand Functions

> **NOTE** The original Pull Request for this functionality can be found [here](https://github.com/fiberplane/fpx/pull/291).

## Overview

The `expand-function` library provides functionality to look up and "expand"
functions in a user's codebase, providing more context to the LLM when generating
requests using AI.

### The Problem

Right now, when we need to generate a request with AI, all we have at our disposal are the stringified versions of compiled handler and middleware functions.

If those functions rely on helper utilities to, say, validate certain headers or parameters, we end up in a pickle. The LLM doesn't have enough context to give a valid request back to us. It's effectively blind to certain critical logic.

### The Solution

So, our job is to locate the handler and middleware definitions in the code, and then statically analyze them, to find the definitions of any constants or utilities that they use to execute an incoming request.

To achieve this, we have to do some terrible things.

1. Map the compiled functions back to their locations in the source
2. Parse and analyze the abstract syntax tree of the source function
3. Apply heuristics to identify out-of-scope identifiers in the source function
4. Traverse the codebase to find the definitions of said out-of-scope identifiers
5. Repeat steps (3) and (4) recursively on any utility functions that are used in the functions we analyze

The rest of the pr description will go through the decisions made to implement each of these steps.

The 3rd party libraries/tools at our disposal are:

- `acorn` and `source-map` - libraries for parsing source maps to go from compiled code back to the source
- `typescript` - the typescript compiler api, for parsing and traversing ASTs
- `typescript-language-server`  - wrapper around `tsserver` (with which we communicate over stdio)
- `vscode-jsonrpc` - helpers for interfacing with the ts language server

## Testing

To play with this while developing locally, you need `FPX_WATCH_DIR` to be set
to the root of the example codebase you're testing against:

```bash
FPX_WATCH_DIR=../examples/goose-quotes pnpm dev
```

Otherwise, you can just run the tests and develop from there.

The most useful test is `expand-function.test.ts`, as it is effectively an
integration test for the library.

```bash
pnpm test expand-function.test
```

Separately, there are unit tests for:

- Source map resolution: `find-source-function.test.ts` (outside this lib, in the `lib/find-source-function` directory)
- Identifier analysis: `analyze-identifiers.test.ts`
- File search: `search-file.test.ts`
- Function search: `search-function.test.ts`

If you find yourself wanting to use the node debugger, you can do so by adding
`debugger;` somewhere in the code, then modifying the smoke test located in
`expand-function-smoke-test.ts`. You can call this with:

```bash
pnpm expand-function:debug
```

Then, launch the node debugger in Chrome (`chrome://inspect`) to attach to the
process and set additional breakpoints.

## Usage

The return result of `expandFunction` should be recursed in order to build up
the necessary context for the LLM to make an accurate assessment of the
function. Note that the return result contains a key, `context`, which is an
array of `ExpandedFunctionContext` objects. Each of those context objects may,
in turn, also contain a `context` key.

Look in the `inference` routes in the Studio to see how this is ultimately done.

## Improvements (TODOs)

- Cache results of `searchForFunction` to reduce filesystem lookups
- Remove dependency on `typescript-language-server`
  - Take inspiration from Ade's experiments with only using `createProgram` to
    provide import resolution
    (https://github.com/fiberplane/fpx/commit/c477a0986660497201c359afc7540970b6adada3)
- Re-introduce the `typescript-language-server`, and write a typescript plugin
  to provide the same functionality via custom workspace commands (this will
  allow us to use the typescript version of the user's project, rather than our
  version in this repo)
- Look for other common source maps in the project to provide more context
  (webpack, etc) -- **right now only works with Wrangler projects**

