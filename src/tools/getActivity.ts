/**
 * Tool: xert-get-activity
 *
 * Retrieves detailed activity information including XSS metrics and MPA data.
 */

import { z } from 'zod';
import { getActivity } from '../xertClient.js';
import { formatActivityDetail } from '../formatters.js';

export const getActivityTool = {
  name: 'xert-get-activity',
  description:
    'Get detailed information about a specific XERT activity, including XSS metrics, ' +
    'power data, fitness signature changes, breakthroughs, and focus type. ' +
    'Optionally include per-second MPA (Maximum Power Available) session data.',
  inputSchema: {
    shape: {
      activityId: z
        .string()
        .describe('The activity ID/path from xert-list-activities'),
      includeSessionData: z
        .boolean()
        .default(false)
        .describe('Include per-second MPA/power session data (can be large)'),
    },
  },
  execute: async (args: { activityId: string; includeSessionData?: boolean }) => {
    try {
      if (!args.activityId) {
        return {
          content: [{ type: 'text' as const, text: 'Error: activityId is required' }],
          isError: true,
        };
      }

      const activity = await getActivity(args.activityId, args.includeSessionData || false);

      if (!activity.success) {
        return {
          content: [{ type: 'text' as const, text: 'Failed to retrieve activity from XERT.' }],
          isError: true,
        };
      }

      let output = formatActivityDetail(activity);

      // If session data was requested and is available, add summary
      if (args.includeSessionData && activity.session_data && activity.session_data.length > 0) {
        const sessionData = activity.session_data;
        output += '\n\n📊 SESSION DATA SUMMARY';
        output += '\n───────────────────────────────────────────────────────────';
        output += `\n   Data points: ${sessionData.length}`;
        output += `\n   Duration: ${Math.round(sessionData.length / 60)} minutes`;

        // Calculate some stats
        const powers = sessionData.map((p) => p.power).filter((p) => p > 0);
        const mpas = sessionData.map((p) => p.mpa).filter((m) => m > 0);

        if (powers.length > 0) {
          const maxPower = Math.max(...powers);
          const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
          output += `\n   Max Power: ${Math.round(maxPower)} W`;
          output += `\n   Avg Power: ${Math.round(avgPower)} W`;
        }

        if (mpas.length > 0) {
          const minMpa = Math.min(...mpas);
          output += `\n   Lowest MPA: ${Math.round(minMpa)} W`;
        }

        output += '\n\n   (Full session_data array available in raw response)';
      }

      return {
        content: [{ type: 'text' as const, text: output }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
