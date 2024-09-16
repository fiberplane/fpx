# fpx

The fpx tool is a command line tool to launch a local HTTP or gRPC OTEL
ingestion endpoint. It also includes a CLI client to interact with some of the
Rest and web-socket endpoints.

NOTE: Currently only a in-memory storage is supported.

## Usage

First, make sure you have Rust installed on your machine. You can install Rust
using [rustup](https://rustup.rs/) or take a look at the
[official instructions](https://www.rust-lang.org/tools/install).

Then run the following command to execute the local dev server:

```
cargo run -- dev
```

See `Commands` for more information.

## Commands

The fpx binary is primarily used to start a local dev server, but it is also
possible to run some other commands.

For ease of use, the `fpx` cargo alias has been added, meaning you can run
`cargo fpx` in any directory in this repository and compile and then invoke
`fpx`.

### `fpx dev`

Starts the local dev server.

Use `-e` or `--enable-tracing` to send otlp payloads to `--otlp-endpoint`. Note
that this should not be used to send traces to itself, as that will create an
infinite loop.

### `fpx client`

Invokes endpoints on a fpx server.

This command can also send traces to a otel endpoint. NOTE: there are some known
issues where it doesn't seem to work properly.

Examples:

```
# Fetch all traces
fpx client traces list

# Fetch a specific span
fpx client spans get aa aa
```
