# xtasks

The xtask crate allows us to perform actions on Rust related code within this
workspace, using Rust code. Think of things like generating code, or running
build tasks.

For more information about the xtask pattern, see this site: [matklad/cargo-xtask](https://github.com/matklad/cargo-xtask?tab=readme-ov-file#cargo-xtask)

## Usage

An cargo alias is defined with the `xtask` alias, so you can run `cargo xtask`
xtask in any directory of this git repository (note that some commands do
require that the working directory is in a specific directory).

# Commands

## `cargo xtask generate-schemas`

This commands takes the definitions from our Rust models and generate TS schemas
from them. This command can be executed without requiring any arguments, but
should be run within the root of this repository.

```
cargo xtask generate-schemas
```
