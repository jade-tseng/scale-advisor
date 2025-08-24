# Scale Advisor Frontend

A modern web interface for the Scale Advisor MCP (Model Context Protocol) server that provides AI-powered infrastructure analysis and Terraform generation.

## Features

### 🛠️ Available Tools
- **GitHub Analyzer** - Analyze repository architecture and technologies
- **Cloud Analyzer** - Analyze cloud resource usage and costs  
- **Security Analyzer** - Analyze security posture and vulnerabilities
- **Infrastructure Generator** - Generate Terraform infrastructure code
- **GitHub PR Creator** - Create pull requests with generated code
- **Comprehensive Analysis** - Full repository and cloud analysis

### 🎨 Modern UI
- Responsive design with gradient backgrounds
- Real-time connection status indicator
- Interactive tool cards with hover effects
- Loading animations and progress feedback
- Professional styling with Font Awesome icons

### 🔌 MCP Integration
- Full MCP protocol support with session management
- CORS-enabled communication with the backend
- Real-time status monitoring
- Error handling and user feedback

## Quick Start

### Prerequisites
- Node.js (v18+)
- Scale Advisor MCP Server running on port 8080

### Installation
```bash
cd frontend/
npm install
```

### Running the Frontend
```bash
npm start
```

The frontend will be available at http://localhost:3000

### Running the MCP Server
```bash
cd ../
npm run build
node dist/index.js
```

The MCP server will be available at http://localhost:8080

## Usage

1. **Open the frontend** at http://localhost:3000
2. **Check connection status** - Should show "Connected" if MCP server is running
3. **Select a tool** by clicking on any tool card
4. **Fill out the form** with required parameters
5. **Execute the tool** and view results in real-time

## Architecture

```
Frontend (Port 3000)     MCP Server (Port 8080)
┌─────────────────┐     ┌──────────────────────┐
│                 │────▶│                      │
│ React-like SPA  │     │ Claude MCP Server    │
│ - Modern UI     │     │ - 8 AI Tools        │
│ - MCP Client    │     │ - HTTP Transport     │
│ - Tool Forms    │     │ - Session Management │
└─────────────────┘     └──────────────────────┘
```

## Tool Examples

### GitHub Repository Analysis
```javascript
{
  "repository_url": "https://github.com/jade-tseng/scale-advisor",
  "analysis_depth": "detailed",
  "include_dependencies": true
}
```

### Infrastructure Generation
```javascript
{
  "repository_url": "https://github.com/jade-tseng/scale-advisor",
  "cloud_provider": "aws",
  "environment": "production"
}
```

### GitHub PR Creation
```javascript
{
  "repository_url": "https://github.com/jade-tseng/scale-advisor",
  "branch_name": "feature/terraform-infrastructure",
  "infra_directory": "infra-gen"
}
```

## Development

### File Structure
```
frontend/
├── index.html          # Main HTML structure
├── script.js           # MCP client and UI logic
├── styles.css          # Modern CSS styling
├── server.js           # Express server for serving frontend
├── package.json        # Dependencies
└── README.md          # This file
```

### Key Components
- **ScaleAdvisorClient** - Main JavaScript class handling MCP communication
- **Tool Forms** - Dynamic form generation for each tool
- **Results Display** - Formatted output with copy/download functionality
- **Session Management** - MCP protocol session handling

## Troubleshooting

### Connection Issues
- Ensure MCP server is running on port 8080
- Check browser console for CORS errors
- Verify both servers are running

### Tool Execution Errors
- Check that required environment variables are set (CLAUDE_API_KEY, GITHUB_TOKEN)
- Verify input parameters match tool schemas
- Check MCP server logs for detailed error messages

## Next Steps

- Add authentication and user management
- Implement real-time updates via WebSockets
- Add tool result caching and history
- Integrate with CI/CD pipelines
- Add more visualization for analysis results
