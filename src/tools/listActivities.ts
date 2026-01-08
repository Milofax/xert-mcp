/**
 * Tool: xert-list-activities
 *
 * Lists activities within a specified time range.
 */

import { z } from 'zod';
import { listActivities } from '../xertClient.js';
import { formatActivityList } from '../formatters.js';

export const listActivitiesTool = {
  name: 'xert-list-activities',
  description:
    'List your XERT activities within a specified time range. ' +
    'Returns activity names, types, dates, and IDs. ' +
    'Use the activity ID with xert-get-activity to get detailed metrics.',
  inputSchema: {
    shape: {
      from: z
        .string()
        .describe('Start date in ISO format (e.g., "2024-01-01") or Unix timestamp'),
      to: z
        .string()
        .describe('End date in ISO format (e.g., "2024-12-31") or Unix timestamp'),
      daysAgo: z
        .number()
        .optional()
        .describe('Alternative: get activities from the last N days (overrides from/to)'),
    },
  },
  execute: async (args: { from?: string; to?: string; daysAgo?: number }) => {
    try {
      let fromTimestamp: number;
      let toTimestamp: number;

      if (args.daysAgo) {
        const now = Date.now();
        toTimestamp = Math.floor(now / 1000);
        fromTimestamp = Math.floor((now - args.daysAgo * 24 * 60 * 60 * 1000) / 1000);
      } else {
        if (!args.from || !args.to) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: Either provide "from" and "to" dates, or use "daysAgo"',
              },
            ],
            isError: true,
          };
        }

        // Parse dates - support both ISO strings and timestamps
        fromTimestamp = isNaN(Number(args.from))
          ? Math.floor(new Date(args.from).getTime() / 1000)
          : Number(args.from);

        toTimestamp = isNaN(Number(args.to))
          ? Math.floor(new Date(args.to).getTime() / 1000)
          : Number(args.to);
      }

      const activities = await listActivities(fromTimestamp, toTimestamp);

      return {
        content: [{ type: 'text' as const, text: formatActivityList(activities) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
