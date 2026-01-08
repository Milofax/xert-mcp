/**
 * Tool: xert-upload-fit
 *
 * Uploads a FIT file to XERT for analysis.
 */

import { z } from 'zod';
import { uploadFitFile } from '../xertClient.js';
import * as fs from 'fs';

export const uploadFitTool = {
  name: 'xert-upload-fit',
  description:
    'Upload a FIT file to XERT for analysis. The activity will be processed and added to your XERT account. ' +
    'XERT will calculate XSS, detect breakthroughs, and update your fitness signature if applicable.',
  inputSchema: {
    shape: {
      filePath: z
        .string()
        .describe('Absolute path to the .FIT file to upload'),
      name: z
        .string()
        .optional()
        .describe('Optional name for the activity (defaults to filename)'),
    },
  },
  execute: async (args: { filePath: string; name?: string }) => {
    try {
      if (!args.filePath) {
        return {
          content: [{ type: 'text' as const, text: 'Error: filePath is required' }],
          isError: true,
        };
      }

      // Check if file exists
      if (!fs.existsSync(args.filePath)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: File not found: ${args.filePath}`,
            },
          ],
          isError: true,
        };
      }

      // Check file extension
      if (!args.filePath.toLowerCase().endsWith('.fit')) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: Only .FIT files are supported',
            },
          ],
          isError: true,
        };
      }

      const result = await uploadFitFile(args.filePath, args.name);

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: 'Failed to upload FIT file to XERT.' }],
          isError: true,
        };
      }

      const uploadedFile = result.json?.files?.[0];
      let output = '✅ FIT file uploaded successfully!\n\n';

      if (uploadedFile) {
        output += `   File: ${uploadedFile.name}\n`;
        output += `   Size: ${(uploadedFile.size / 1024).toFixed(1)} KB\n`;
        output += `   Activity URL: https://www.xertonline.com${uploadedFile.url}\n`;
      }

      output += '\nThe activity will be processed by XERT. Use xert-list-activities to see it.';

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error uploading FIT file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
