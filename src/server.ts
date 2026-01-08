/**
 * XERT MCP Server
 *
 * Model Context Protocol server for accessing XERT training data.
 * Provides tools for fitness signature, training load, workouts, and activities.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { SERVER_NAME, getServerInfo } from './serverInfo.js';

// Import all tools
import {
  getTrainingInfoTool,
  listWorkoutsTool,
  getWorkoutTool,
  downloadWorkoutTool,
  listActivitiesTool,
  getActivityTool,
  uploadFitTool,
} from './tools/index.js';

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

// IMPORTANT: Load env BEFORE any client initialization
dotenv.config({ path: envPath });

const { version: serverVersion } = getServerInfo();

// Create MCP server
const server = new McpServer({
  name: SERVER_NAME,
  version: serverVersion,
});

// Register tools
// Note: Using server.tool() which is the v1.x API

server.tool(
  getTrainingInfoTool.name,
  getTrainingInfoTool.description,
  getTrainingInfoTool.inputSchema?.shape ?? {},
  getTrainingInfoTool.execute
);

server.tool(
  listWorkoutsTool.name,
  listWorkoutsTool.description,
  listWorkoutsTool.inputSchema?.shape ?? {},
  listWorkoutsTool.execute
);

server.tool(
  getWorkoutTool.name,
  getWorkoutTool.description,
  getWorkoutTool.inputSchema?.shape ?? {},
  getWorkoutTool.execute
);

server.tool(
  downloadWorkoutTool.name,
  downloadWorkoutTool.description,
  downloadWorkoutTool.inputSchema?.shape ?? {},
  downloadWorkoutTool.execute
);

server.tool(
  listActivitiesTool.name,
  listActivitiesTool.description,
  listActivitiesTool.inputSchema?.shape ?? {},
  listActivitiesTool.execute
);

server.tool(
  getActivityTool.name,
  getActivityTool.description,
  getActivityTool.inputSchema?.shape ?? {},
  getActivityTool.execute
);

server.tool(
  uploadFitTool.name,
  uploadFitTool.description,
  uploadFitTool.inputSchema?.shape ?? {},
  uploadFitTool.execute
);

// Server startup
async function startServer(): Promise<void> {
  try {
    // CRITICAL: Only use console.error for STDIO servers!
    // console.log would corrupt the JSON-RPC protocol
    console.error(`Starting ${SERVER_NAME} v${serverVersion}...`);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error(`${SERVER_NAME} v${serverVersion} connected via STDIO.`);
    console.error('Available tools:');
    console.error('  - xert-get-training-info');
    console.error('  - xert-list-workouts');
    console.error('  - xert-get-workout');
    console.error('  - xert-download-workout');
    console.error('  - xert-list-activities');
    console.error('  - xert-get-activity');
    console.error('  - xert-upload-fit');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
