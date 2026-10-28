import YAML from 'yaml';

export interface CourseEntry {
  number: number;
  title: string;
  description: string;
  /** Lesson folder under lessons/: lesson N lives in `session-N`. */
  slug: string;
}

export interface CourseIndex {
  title: string;
  contents: CourseEntry[];
}

/**
 * `lessons/INDEX.md` is the course table of contents: optional frontmatter with `title` and a Markdown table
 * `| # | Lección | Contenido |`. Row N is the lesson in `lessons/session-N/`.
 */
export function parseCourseIndex(source: string): CourseIndex {
  let title = '';
  let body = source;
  if (source.startsWith('---\n')) {
    const end = source.indexOf('\n---\n', 4);
    if (end > 0) {
      title = String((YAML.parse(source.slice(4, end)) as {title?: unknown} | null)?.title ?? '');
      body = source.slice(end + 5);
    }
  }
  const contents: CourseEntry[] = [];
  for (const line of body.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
    const number = Number(cells[0]);
    if (cells.length < 3 || !Number.isInteger(number) || number < 1) continue;
    contents.push({number, title: cells[1], description: cells.slice(2).join('|').trim(), slug: `session-${number}`});
  }
  return {title, contents};
}
