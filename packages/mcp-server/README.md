# Fiberplane Model Context Protocol Server

This is a proof of concept model context protocol server for querying Fiberplane Studio local API using the Model Context Protocol.

## Setting up using Claude Desktop

If you have Claude Desktop installed, update the configuration to use the local MCP server.

> **Note**
> If you're using NVM or FNM or any other Node version manager, Claude Desktop will not be able to find the `node` command. Use the following snippet as reference. Issue tracked [here](https://github.com/modelcontextprotocol/servers/issues/64)
>
> ```
> {
>   "mcpServers": {
>     "fiberplane": {
>       "command": "<path_to_node>",
>       "args": [
>         "<path_to_globally_installed_npm_packages_>/@fiberplane/mcp-server-fiberplane/dist/src/index.js"
>       ]
>     }
>   }
> }
> ```
