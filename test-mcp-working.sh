#!/bin/bash

# Working MCP endpoint test with proper session handling
echo "Testing MCP endpoint with proper headers and session..."

# Step 1: Initialize session
echo "1. Initializing MCP session..."
INIT_RESPONSE=$(curl -s -D /tmp/mcp_headers.txt -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }')

echo "Init response: $INIT_RESPONSE"

# Extract session ID from headers
SESSION_ID=$(grep -i "mcp-session-id" /tmp/mcp_headers.txt | cut -d':' -f2 | tr -d ' \r\n')

if [ -n "$SESSION_ID" ]; then
  echo "Session ID: $SESSION_ID"
  
  # Step 2: List tools
  echo -e "\n2. Listing available tools..."
  TOOLS_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list"
    }')
  
  echo "Tools: $TOOLS_RESPONSE" | jq '.result.tools[].name' 2>/dev/null || echo "$TOOLS_RESPONSE"
  
  # Step 3: Test GitHub analyzer
  echo -e "\n3. Testing GitHub analyzer tool..."
  ANALYZE_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{
      "jsonrpc": "2.0",
      "id": 3,
      "method": "tools/call",
      "params": {
        "name": "github_analyze_repository",
        "arguments": {
          "repository_url": "https://github.com/vercel/next.js",
          "analysis_depth": "basic"
        }
      }
    }')
  
  echo "Analysis result:"
  echo "$ANALYZE_RESPONSE" | jq '.result.content[0].text' 2>/dev/null || echo "$ANALYZE_RESPONSE"
  
else
  echo "Failed to get session ID from headers:"
  cat /tmp/mcp_headers.txt
fi
