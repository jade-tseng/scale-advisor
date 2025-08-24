#!/usr/bin/env node

import { ClaudeClient } from './dist/client.js';
import { handleComprehensiveAnalysisTool } from './dist/tools/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testComprehensiveAnalysis() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        console.error('❌ CLAUDE_API_KEY not found in environment variables');
        console.error('💡 Please set CLAUDE_API_KEY in your .env file or environment');
        process.exit(1);
    }

    console.log('🚀 Testing comprehensive analysis tool...\n');

    try {
        // Create Claude client
        const claudeClient = new ClaudeClient(apiKey);

        // Test arguments
        const testArgs = {
            repository_url: "https://github.com/jade-tseng/scale-advisor", // change to test repository
            analysis_depth: "detailed",
            focus_areas: ["scalability", "security", "performance"]
        };

        console.log('📊 Running comprehensive analysis with:');
        console.log(`   Repository: ${testArgs.repository_url}`);
        console.log(`   Depth: ${testArgs.analysis_depth}`);
        console.log(`   Focus Areas: ${testArgs.focus_areas.join(', ')}`);
        console.log('\n⏳ This may take 30-60 seconds due to multi-agent workflow with multiple API calls...\n');

        const startTime = Date.now();
        
        // Call the tool handler directly
        const result = await handleComprehensiveAnalysisTool(claudeClient, testArgs);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Analysis completed in ${duration} seconds\n`);
        console.log('📋 COMPREHENSIVE ANALYSIS REPORT:');
        console.log('=' .repeat(80));
        
        if (result.content && result.content[0] && result.content[0].text) {
            console.log(result.content[0].text);
        } else {
            console.log('❌ Unexpected result format:', JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testComprehensiveAnalysis().catch(console.error);
