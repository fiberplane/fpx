# xtasks

The xtask crate allows us to perform actions on this workspace, using Rust
code. It not only allows for strongly typed commands, but also allows for
integration with our existing Rust codebase.

For more information about the xtask pattern, see this site: [matklad/cargo-xtask](https://github.com/matklad/cargo-xtask?tab=readme-ov-file#cargo-xtask)

## Usage

An cargo alias is defined with the `xtask` alias, so you can run `cargo xtask`
xtask in any directory of this git repository (note that some commands do
require that the working directory is in a specific directory).

# Commands

## `cargo xtask generate-schemas`

This commands takes the definitions from our Rust models and generate TS schemas
from them. This command can be executed without requiring any arguments.

```
cargo xtask generate-schemas
```
