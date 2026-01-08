/**
 * Server metadata and version info
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SERVER_NAME = 'xert-mcp-server';

interface PackageJson {
  version: string;
  description: string;
}

export function getServerInfo(): { version: string; description: string } {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return {
      version: packageJson.version,
      description: packageJson.description,
    };
  } catch {
    return {
      version: '1.0.0',
      description: 'XERT MCP Server',
    };
  }
}
