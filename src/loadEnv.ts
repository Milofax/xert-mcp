/**
 * Loads the project's .env file as a side effect.
 *
 * Must be imported before any module that reads process.env at import time
 * (e.g. xertClient.ts). ES module imports execute before the rest of a
 * file's top-level code, so calling dotenv.config() from within server.ts's
 * own body runs too late if other imports already pulled in xertClient.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

dotenv.config({ path: envPath });
