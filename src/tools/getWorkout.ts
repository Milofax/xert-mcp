/**
 * Tool: xert-get-workout
 *
 * Retrieves detailed workout information including intervals.
 */

import { z } from 'zod';
import { getWorkout } from '../xertClient.js';
import { formatWorkoutDetail } from '../formatters.js';

export const getWorkoutTool = {
  name: 'xert-get-workout',
  description:
    'Get detailed information about a specific XERT workout, including all intervals, ' +
    'power targets, and durations. The workout is resolved using your current fitness signature.',
  inputSchema: {
    shape: {
      workoutId: z
        .string()
        .describe('The workout ID/path from xert-list-workouts (e.g., "ISm75NAmocJ7eUHr")'),
    },
  },
  execute: async (args: { workoutId: string }) => {
    try {
      if (!args.workoutId) {
        return {
          content: [{ type: 'text' as const, text: 'Error: workoutId is required' }],
          isError: true,
        };
      }

      const workout = await getWorkout(args.workoutId);

      if (!workout.success) {
        return {
          content: [{ type: 'text' as const, text: 'Failed to retrieve workout from XERT.' }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: formatWorkoutDetail(workout) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching workout: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
