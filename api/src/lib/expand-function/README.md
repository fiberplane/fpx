# Static Analysis to Expand Functions

## Overview

The `expand-function` library provides functionality to look up and "expand"
functions in a user's codebase.

Given the text of a function definition (an api handler), it will:

1. Search for the function definition in the user's codebase
2. Parse the function definition into a `ts.Node`
3. Expand the function definition by looking up identifiers that are in scope,
   but not local to the function
4. Return the definitions of those identifiers
5. Recursively expand the function definitions of any of the identifiers from
   (4) that are also functions

This library is used by the Studio to look for Hono api handler definitions, and
provide an LLM with more context about the handler. This, in turn, allows the
LLM to provide more accurate and helpful request completions for the developer.

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
  (webpack, etc) -- right now only works with Wrangler projects
