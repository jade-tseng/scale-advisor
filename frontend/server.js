#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy requests to MCP server
app.post('/api/*', async (req, res) => {
    try {
        const mcpUrl = `http://localhost:8080${req.path.replace('/api', '')}`;
        const response = await fetch(mcpUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to connect to MCP server',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Scale Advisor Frontend running at http://localhost:${PORT}`);
    console.log(`📡 Connecting to MCP Server at http://localhost:8080`);
    console.log(`\n🚀 Open http://localhost:${PORT} in your browser to get started!`);
});
