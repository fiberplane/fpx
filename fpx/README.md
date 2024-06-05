# fpx

The fpx command is a command line tool that hosts the API and UI.

The fpx tool is intended to be used within a repository as it will use the code
in the repository for retrieving data while also storing cache in the same
repository.

## Usage

To run the fpx tool, download en install it first, then run the following command:

```
fpx dev
```

Depending on your configuration some background tasks will be started and a web
server will be started. By default this will be available at
`http://localhost:6767`.

## Installation

### npm

> TODO: Publish to npm

- npm install -g @fiberplane/fpx

### Homebrew

> TODO: Create homebrew repo

- brew install fiberplane/fpx/fpx

### Cargo

> TODO: Publish to crates.io

- Run `cargo install fpx`

### Manual installation

> TODO: Create releases

- Download the latest release from the [releases page](https://github.com/fiberplane/fpx/releases).
- Make it available in you `$PATH`
