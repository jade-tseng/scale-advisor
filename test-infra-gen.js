#!/usr/bin/env node

import { ClaudeClient } from './dist/client.js';
import { handleInfraGenTool } from './dist/tools/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testInfraGen() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        console.error('❌ CLAUDE_API_KEY not found in environment variables');
        process.exit(1);
    }

    console.log('🏗️ Testing Terraform infrastructure generation...\n');

    try {
        // Create Claude client
        const claudeClient = new ClaudeClient(apiKey);

        // Test arguments - using defaults
        const testArgs = {
            input_file: "mockdata.json",
            output_directory: "infra-gen",
            terraform_version: ">= 1.0",
            provider_version: "~> 5.0"
        };

        console.log('📊 Generating Terraform code with:');
        console.log(`   Input File: ${testArgs.input_file}`);
        console.log(`   Output Directory: ${testArgs.output_directory}`);
        console.log(`   Terraform Version: ${testArgs.terraform_version}`);
        console.log(`   Provider Version: ${testArgs.provider_version}`);
        console.log('\n⏳ Generating Terraform files...\n');

        const startTime = Date.now();
        
        // Call the tool handler directly
        const result = await handleInfraGenTool(claudeClient, testArgs);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Generation completed in ${duration} seconds\n`);
        console.log('📋 TERRAFORM GENERATION RESULT:');
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
testInfraGen().catch(console.error);
