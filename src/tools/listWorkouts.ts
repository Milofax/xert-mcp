/**
 * Tool: xert-list-workouts
 *
 * Lists all workouts available for the authenticated user.
 */

import { listWorkouts } from '../xertClient.js';
import { formatWorkoutList } from '../formatters.js';

export const listWorkoutsTool = {
  name: 'xert-list-workouts',
  description:
    'List all your saved XERT workouts. Returns workout names, IDs, and last modified dates. ' +
    'Use the workout ID with xert-get-workout to get details or xert-download-workout to export.',
  inputSchema: {
    shape: {},
  },
  execute: async () => {
    try {
      const workouts = await listWorkouts();
      return {
        content: [{ type: 'text' as const, text: formatWorkoutList(workouts) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing workouts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
