/**
 * Output formatters for XERT data
 *
 * These functions convert API responses into human-readable text
 * suitable for LLM consumption.
 */

import type {
  TrainingInfo,
  Workout,
  WorkoutDetail,
  ActivitySummary,
  ActivityDetail,
} from './xertClient.js';

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateObj: { date: string; timezone: string }): string {
  const date = new Date(dateObj.date.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTrainingInfo(info: TrainingInfo): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    XERT Training Info');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  // Fitness Signature
  lines.push('📊 FITNESS SIGNATURE');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   FTP (Threshold Power):      ${Math.round(info.signature.ftp)} W`);
  lines.push(`   LTP (Lower Threshold):      ${Math.round(info.signature.ltp)} W`);
  lines.push(`   HIE (High Intensity Energy): ${info.signature.hie.toFixed(1)} kJ`);
  lines.push(`   PP (Peak Power):            ${Math.round(info.signature.pp)} W`);
  lines.push('');

  // Status
  lines.push('🎯 TRAINING STATUS');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   Status:  ${info.status}`);
  lines.push(`   Weight:  ${info.weight} kg`);
  lines.push(`   Source:  ${info.source}`);
  lines.push('');

  // Training Load
  lines.push('📈 CURRENT TRAINING LOAD (XSS)');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   Low Strain:   ${info.tl.low.toFixed(1)}`);
  lines.push(`   High Strain:  ${info.tl.high.toFixed(1)}`);
  lines.push(`   Peak Strain:  ${info.tl.peak.toFixed(1)}`);
  lines.push(`   Total:        ${info.tl.total.toFixed(1)}`);
  lines.push('');

  // Target XSS
  lines.push('🎯 TARGET XSS (Recommended)');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   Low:   ${info.targetXSS.low.toFixed(1)}`);
  lines.push(`   High:  ${info.targetXSS.high.toFixed(1)}`);
  lines.push(`   Peak:  ${info.targetXSS.peak.toFixed(1)}`);
  lines.push(`   Total: ${info.targetXSS.total.toFixed(1)}`);
  lines.push('');

  // Workout of the Day
  if (info.wotd && info.wotd.type !== 'None') {
    lines.push('🏋️ WORKOUT OF THE DAY');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`   Type:       ${info.wotd.type}`);
    lines.push(`   Name:       ${info.wotd.name || 'N/A'}`);
    lines.push(`   Workout ID: ${info.wotd.workoutId || 'N/A'}`);
    if (info.wotd.difficulty) {
      lines.push(`   Difficulty: ${info.wotd.difficulty.toFixed(2)}`);
    }
    if (info.wotd.description) {
      lines.push(`   Description: ${info.wotd.description}`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export function formatWorkoutList(workouts: Workout[]): string {
  if (workouts.length === 0) {
    return 'No workouts found.';
  }

  const lines: string[] = [];
  lines.push(`Found ${workouts.length} workout(s):`);
  lines.push('');

  for (const workout of workouts) {
    const modified = new Date(workout.last_modified * 1000).toLocaleDateString('de-DE');
    lines.push(`📋 ${workout.name}`);
    lines.push(`   ID: ${workout.path}`);
    lines.push(`   Modified: ${modified}`);
    if (workout.description) {
      lines.push(`   Description: ${workout.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatWorkoutDetail(workout: WorkoutDetail): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`   WORKOUT: ${workout.name}`);
  lines.push('═══════════════════════════════════════════════════════════');

  if (workout.description) {
    lines.push('');
    lines.push(`Description: ${workout.description}`);
  }

  lines.push('');
  lines.push('INTERVALS:');
  lines.push('───────────────────────────────────────────────────────────');

  for (const interval of workout.workout) {
    const duration = formatDuration(interval.duration);
    lines.push(`   ${interval.name} (${interval.interval_count}x)`);
    lines.push(`      Power: ${Math.round(interval.power)} W for ${duration}`);
    if (interval.power_rest !== undefined && interval.duration_rest !== undefined) {
      const restDuration = formatDuration(interval.duration_rest);
      lines.push(`      Rest:  ${Math.round(interval.power_rest)} W for ${restDuration}`);
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export function formatActivityList(activities: ActivitySummary[]): string {
  if (activities.length === 0) {
    return 'No activities found in the specified time range.';
  }

  const lines: string[] = [];
  lines.push(`Found ${activities.length} activity/activities:`);
  lines.push('');

  for (const activity of activities) {
    const date = formatDate(activity.start_date);
    const typeEmoji = activity.activity_type === 'Cycling' ? '🚴' : '🏃';

    lines.push(`${typeEmoji} ${activity.name}`);
    lines.push(`   ID: ${activity.path}`);
    lines.push(`   Type: ${activity.activity_type}`);
    lines.push(`   Date: ${date}`);
    if (activity.description) {
      lines.push(`   Description: ${activity.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatActivityDetail(activity: ActivityDetail): string {
  const lines: string[] = [];
  const s = activity.summary;

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`   ${activity.name}`);
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  // Basic info
  lines.push('📋 BASIC INFO');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   Type:     ${s.activity_type}`);
  lines.push(`   Date:     ${formatDate(s.start_date)}`);
  lines.push(`   Distance: ${s.distance.toFixed(2)} km`);
  lines.push(`   Duration: ${formatDuration(s.duration)}`);
  if (activity.description) {
    lines.push(`   Notes:    ${activity.description}`);
  }
  lines.push('');

  // XSS Metrics
  lines.push('📊 XSS METRICS');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   Total XSS:     ${s.xss.toFixed(1)}`);
  lines.push(`   Low Strain:    ${s.xlss.toFixed(1)}`);
  lines.push(`   High Strain:   ${s.xhss.toFixed(1)}`);
  lines.push(`   Peak Strain:   ${s.xpss.toFixed(1)}`);
  lines.push(`   Focus:         ${s.focus}`);
  lines.push(`   Specificity:   ${s.specificity}`);
  lines.push(`   Difficulty:    ${s.difficulty_rating}`);
  lines.push('');

  // Power metrics
  lines.push('⚡ POWER METRICS');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   XEP (Xert Equivalent Power): ${Math.round(s.xep)} W`);
  lines.push(`   MEP (Mean Equivalent Power): ${Math.round(s.mep)} W`);
  if (s.session) {
    lines.push(`   Max Power:                   ${s.session.max_power} W`);
    lines.push(`   Avg Power:                   ${Math.round(s.session.avg_power)} W`);
  }
  lines.push('');

  // Signature after activity
  lines.push('📈 FITNESS SIGNATURE (After Activity)');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`   FTP: ${Math.round(s.sig.ftp)} W`);
  if (s.sig.ltp) lines.push(`   LTP: ${Math.round(s.sig.ltp)} W`);
  if (s.sig.hie) lines.push(`   HIE: ${s.sig.hie.toFixed(1)} kJ`);
  lines.push(`   PP:  ${Math.round(s.sig.pp)} W`);
  lines.push('');

  // Breakthrough / Medal
  if (s.breakthrough || s.medal) {
    lines.push('🏆 ACHIEVEMENTS');
    lines.push('───────────────────────────────────────────────────────────');
    if (s.breakthrough) {
      lines.push('   🎉 BREAKTHROUGH!');
    }
    if (s.medal) {
      const medals = ['🥇 Gold', '🥈 Silver', '🥉 Bronze'];
      lines.push(`   Medal: ${medals[s.medal - 1] || s.medal}`);
    }
    lines.push('');
  }

  // Training status
  if (s.freshness) {
    lines.push('🎯 TRAINING STATUS');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`   Freshness: ${s.freshness}`);
    if (s.training_status) {
      lines.push(`   Status Score: ${s.training_status.toFixed(2)}`);
    }
    lines.push('');
  }

  // Nutrition
  if (s.total_grams_carbs || s.total_grams_fat) {
    lines.push('🍎 ESTIMATED NUTRITION');
    lines.push('───────────────────────────────────────────────────────────');
    if (s.total_grams_carbs) lines.push(`   Carbs burned: ${Math.round(s.total_grams_carbs)} g`);
    if (s.total_grams_fat) lines.push(`   Fat burned:   ${Math.round(s.total_grams_fat)} g`);
    if (s.session?.total_calories) lines.push(`   Total calories: ${s.session.total_calories} kcal`);
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
