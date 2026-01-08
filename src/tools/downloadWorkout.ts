/**
 * Tool: xert-download-workout
 *
 * Downloads a workout in ZWO or ERG format.
 */

import { z } from 'zod';
import { downloadWorkout } from '../xertClient.js';

export const downloadWorkoutTool = {
  name: 'xert-download-workout',
  description:
    'Download a XERT workout file in ZWO (Zwift) or ERG format. ' +
    'Returns the raw workout file content that can be saved or imported into your trainer software.',
  inputSchema: {
    shape: {
      workoutId: z
        .string()
        .describe('The workout ID/path from xert-list-workouts'),
      format: z
        .enum(['zwo', 'erg'])
        .default('zwo')
        .describe('Output format: "zwo" for Zwift, "erg" for other trainers (default: zwo)'),
    },
  },
  execute: async (args: { workoutId: string; format?: 'zwo' | 'erg' }) => {
    try {
      if (!args.workoutId) {
        return {
          content: [{ type: 'text' as const, text: 'Error: workoutId is required' }],
          isError: true,
        };
      }

      const format = args.format || 'zwo';
      const content = await downloadWorkout(args.workoutId, format);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Workout file (${format.toUpperCase()}):\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error downloading workout: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
