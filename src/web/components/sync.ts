import {AUDIO_LEAD_IN} from '../../core/timing';

/** Speech-equivalent weight of a text: characters plus a pause allowance after punctuation. */
function spokenWeight(text: string): number {
  return text.length + (text.match(/[.!?:;]/g)?.length ?? 0) * 10 + (text.match(/,/g)?.length ?? 0) * 4;
}

/**
 * Scene progress (0..1) at which `phrase` starts being narrated, estimated from where it sits in the narration.
 * Returns undefined when the phrase is not part of the narration.
 */
export function phraseProgress(narration: string, phrase: string, durationSeconds: number): number | undefined {
  const index = narration.indexOf(phrase);
  if (index < 0 || durationSeconds <= 0) return undefined;
  const speech = Math.max(0.1, durationSeconds - AUDIO_LEAD_IN - 0.6);
  const start = AUDIO_LEAD_IN + (spokenWeight(narration.slice(0, index)) / spokenWeight(narration)) * speech - 0.15;
  return Math.max(0, start / durationSeconds);
}

/** Index of the last phase already started at progress `p`, or -1 before the first one. */
export function currentPhase(starts: number[], p: number): number {
  let current = -1;
  starts.forEach((start, i) => { if (p >= start) current = i; });
  return current;
}

/** Start progress of every phrase, or undefined if any is missing (callers then fall back to an even spread). */
export function phraseStarts(narration: string, phrases: Array<string | undefined>, durationSeconds: number): number[] | undefined {
  if (!phrases.length || phrases.some((phrase) => !phrase)) return undefined;
  const starts = phrases.map((phrase) => phraseProgress(narration, phrase as string, durationSeconds));
  return starts.some((start) => start === undefined) ? undefined : (starts as number[]);
}
