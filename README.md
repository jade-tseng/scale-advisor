# scale-advisor
An agentic system for solo builders and early-stage startups. It connects to your codebase and cloud provider, runs a DevOps best practices audit, and generates actionable, context-aware scaling recommendations to prepare your stack for growth.

# Claude MCP Server

A Model Context Protocol (MCP) server that provides access to Claude AI through standardized tools. This server follows the Dedalus platform guidelines and supports both HTTP and STDIO transports.

## Features

- **Claude Chat Completion**: Multi-turn conversations with system prompts
- **Claude Text Completion**: Simple text completion interface
- **Streamable HTTP Transport**: Production-ready HTTP server
- **STDIO Transport**: Development-friendly stdio interface
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management
- **Session Management**: HTTP session handling with cleanup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your Claude API key:

```bash
cp .env.example .env
```

**⚠️ IMPORTANT: Add your Claude API key to the `.env` file:**

```env
CLAUDE_API_KEY=your_actual_claude_api_key_here
PORT=8080
NODE_ENV=development
```

### 3. Build and Run

```bash
# Build the project
npm run build

# Run with HTTP transport (default)
npm start

# Run with STDIO transport (for development)
npm run start:stdio
```

## API Key Configuration

You need to provide your Claude API key in one of these ways:

1. **Environment file (recommended)**: Add `CLAUDE_API_KEY=your_key_here` to `.env`
2. **Environment variable**: Set `CLAUDE_API_KEY` in your shell
3. **Production deployment**: Set the environment variable in your deployment platform

## Available Tools

### `claude_chat`
Multi-turn conversational interface with Claude.

**Parameters:**
- `messages` (required): Array of message objects with `role` and `content`
- `model` (optional): Claude model to use (default: claude-3-5-sonnet-20241022)
- `max_tokens` (optional): Maximum response tokens (default: 1024)
- `temperature` (optional): Response creativity 0-1 (default: 0.7)
- `system` (optional): System prompt to guide behavior

### `claude_completion`
Simple text completion interface.

**Parameters:**
- `prompt` (required): Text prompt to complete
- `model` (optional): Claude model to use (default: claude-3-5-sonnet-20241022)
- `max_tokens` (optional): Maximum response tokens (default: 1024)
- `temperature` (optional): Response creativity 0-1 (default: 0.7)

## Transport Methods

### HTTP Transport (Default)
- **Endpoint**: `http://localhost:8080/mcp`
- **Health Check**: `http://localhost:8080/health`
- **SSE Endpoint**: `http://localhost:8080/sse` (backward compatibility)

### STDIO Transport
Use `--stdio` flag for development with MCP clients that support stdio.

## Client Configuration

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "claude": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

## Development

```bash
# Watch mode for development
npm run watch

# Development with auto-rebuild
npm run dev

# Development with STDIO
npm run dev:stdio
```

## Project Structure

```
src/
├── index.ts            # Main entry point
├── cli.ts              # Command-line argument parsing
├── config.ts           # Configuration management
├── server.ts           # Server instance creation
├── client.ts           # Claude API client
├── types.ts            # TypeScript type definitions
├── tools/
│   ├── index.ts        # Tool exports
│   └── claude.ts       # Claude tool definitions and handlers
└── transport/
    ├── index.ts        # Transport exports
    ├── http.ts         # HTTP transport (primary)
    └── stdio.ts        # STDIO transport (development)
```

## Environment Variables

- `CLAUDE_API_KEY` (required): Your Claude API key
- `PORT` (optional): HTTP server port (default: 8080)
- `NODE_ENV` (optional): Set to 'production' for production mode

## Error Handling

The server includes comprehensive error handling:
- API key validation on startup
- Claude API error responses with detailed messages
- Session management with automatic cleanup
- Graceful transport error handling
