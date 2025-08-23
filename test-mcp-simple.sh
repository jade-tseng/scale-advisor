#!/bin/bash

# Simple test script for MCP server
# Make sure your server is running first: npm start

echo "Testing MCP Server Health Check..."
curl -s http://localhost:8080/health | jq .

echo -e "\n\nTesting GitHub Repository Analysis Tool..."
echo "Repository: https://github.com/facebook/react"

# Create a session and call the GitHub analyzer tool
curl -s -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
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
  }' > /tmp/session_response.json

# Create session and extract session ID from response headers
echo "Creating MCP session..."
curl -s -D /tmp/headers.txt -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
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
  }' > /tmp/init_response.json

echo "Response headers:"
cat /tmp/headers.txt

SESSION_ID=$(grep -i "mcp-session-id" /tmp/headers.txt | cut -d':' -f2 | tr -d ' \r\n')

if [ -n "$SESSION_ID" ]; then
  echo "Session ID: $SESSION_ID"
  
  # List available tools
  echo -e "\nAvailable tools:"
  curl -s -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list"
    }' | jq '.result.tools[].name'
  
  # Test GitHub analyzer
  echo -e "\nAnalyzing React repository..."
  curl -s -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -H "mcp-session-id: $SESSION_ID" \
    -d '{
      "jsonrpc": "2.0",
      "id": 3,
      "method": "tools/call",
      "params": {
        "name": "github_analyze_repository",
        "arguments": {
          "repository_url": "https://github.com/facebook/react",
          "analysis_depth": "basic"
        }
      }
    }' | jq '.result.content[0].text'
else
  echo "Failed to get session ID"
fi
