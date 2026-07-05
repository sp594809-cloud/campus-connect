import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "campus-connect-mcp",
  title: "Campus Connect MCP",
  version: "0.1.0",
  instructions:
    "MCP server for Campus Connect. Use the `echo` tool to verify connectivity.",
  tools: [echoTool],
});