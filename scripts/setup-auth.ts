#!/usr/bin/env tsx
/**
 * XERT MCP Server - OAuth Setup Script
 *
 * This script helps you authenticate with the XERT API and stores
 * the tokens in your .env file.
 *
 * Usage: npm run setup-auth
 */

import * as readline from 'readline';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

const XERT_TOKEN_URL = 'https://www.xertonline.com/oauth/token';
const XERT_PUBLIC_CLIENT = { username: 'xert_public', password: 'xert_public' };

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
}

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function questionHidden(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);

    const stdin = process.stdin;
    const oldRawMode = stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let password = '';

    const onData = (char: Buffer) => {
      const c = char.toString('utf8');

      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          if (stdin.isTTY) {
            stdin.setRawMode(oldRawMode ?? false);
          }
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007F': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += c;
          process.stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
    stdin.resume();
  });
}

async function getTokenWithPassword(username: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post<TokenResponse>(XERT_TOKEN_URL, params.toString(), {
    auth: XERT_PUBLIC_CLIENT,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

function updateEnvFile(accessToken: string, refreshToken: string): void {
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add XERT_ACCESS_TOKEN
  if (envContent.includes('XERT_ACCESS_TOKEN=')) {
    envContent = envContent.replace(/XERT_ACCESS_TOKEN=.*/g, `XERT_ACCESS_TOKEN=${accessToken}`);
  } else {
    envContent += `\nXERT_ACCESS_TOKEN=${accessToken}`;
  }

  // Update or add XERT_REFRESH_TOKEN
  if (envContent.includes('XERT_REFRESH_TOKEN=')) {
    envContent = envContent.replace(/XERT_REFRESH_TOKEN=.*/g, `XERT_REFRESH_TOKEN=${refreshToken}`);
  } else {
    envContent += `\nXERT_REFRESH_TOKEN=${refreshToken}`;
  }

  // Clean up extra newlines
  envContent = envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  fs.writeFileSync(envPath, envContent);
}

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           XERT MCP Server - Authentication Setup             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('This script will authenticate with XERT and save your tokens.');
  console.log('You need your XERT account credentials (email and password).');
  console.log('');

  const rl = createReadlineInterface();

  try {
    // Get credentials
    const username = await question(rl, '📧 Enter your XERT email: ');
    if (!username) {
      console.error('❌ Email is required');
      process.exit(1);
    }

    const password = await questionHidden(rl, '🔑 Enter your XERT password: ');
    if (!password) {
      console.error('❌ Password is required');
      process.exit(1);
    }

    console.log('');
    console.log('🔄 Authenticating with XERT...');

    // Get tokens
    const tokenResponse = await getTokenWithPassword(username, password);

    console.log('✅ Authentication successful!');
    console.log('');
    console.log(`   Token Type: ${tokenResponse.token_type}`);
    console.log(`   Expires In: ${Math.floor(tokenResponse.expires_in / 86400)} days`);
    console.log(`   Scope: ${tokenResponse.scope}`);
    console.log('');

    // Save tokens
    updateEnvFile(tokenResponse.access_token, tokenResponse.refresh_token);

    console.log(`✅ Tokens saved to: ${envPath}`);
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    Setup Complete!                           ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  You can now use the XERT MCP Server with Claude.            ║');
    console.log('║                                                              ║');
    console.log('║  Test the server:  npm run dev                               ║');
    console.log('║  Build for prod:   npm run build && npm start                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('❌ Authentication failed: Invalid email or password');
      } else if (error.response?.status === 400) {
        console.error('❌ Authentication failed: Bad request - check your credentials');
      } else {
        console.error(`❌ Authentication failed: ${error.response?.status} - ${error.message}`);
      }
    } else {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
