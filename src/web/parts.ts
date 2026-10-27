import type {LessonScene, ProducedLesson} from '../core/types';

export interface Part {
  id: string;
  title: string;
  scenes: LessonScene[];
}

/** Consecutive scenes that share a `group` form one part (one screen); every other scene is a part of its own. */
export function groupParts(lesson: ProducedLesson): Part[] {
  const parts: Part[] = [];
  for (const scene of lesson.scenes) {
    const id = scene.group ?? scene.id;
    const last = parts[parts.length - 1];
    if (last && last.id === id) last.scenes.push(scene);
    else parts.push({id, title: scene.groupTitle ?? scene.title, scenes: [scene]});
  }
  return parts;
}
