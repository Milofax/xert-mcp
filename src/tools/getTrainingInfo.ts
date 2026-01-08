/**
 * Tool: xert-get-training-info
 *
 * Retrieves current fitness signature, training status,
 * training load, and workout of the day.
 */

import { z } from 'zod';
import { getTrainingInfo } from '../xertClient.js';
import { formatTrainingInfo } from '../formatters.js';

export const getTrainingInfoTool = {
  name: 'xert-get-training-info',
  description:
    'Get your current XERT fitness signature (FTP, LTP, HIE, PP), training status, ' +
    'training load (XSS), target XSS, and workout of the day (WOTD). ' +
    'This is the most important tool for understanding your current fitness and training recommendations.',
  inputSchema: {
    shape: {
      format: z
        .enum(['zwo', 'erg'])
        .optional()
        .describe('Workout file format for WOTD download URL (optional). Use "zwo" for Zwift or "erg" for other trainers.'),
    },
  },
  execute: async (args: { format?: 'zwo' | 'erg' }) => {
    try {
      const data = await getTrainingInfo(args.format);

      if (!data.success) {
        return {
          content: [{ type: 'text' as const, text: 'Failed to retrieve training info from XERT.' }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: formatTrainingInfo(data) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching training info: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
