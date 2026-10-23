export type SceneType = 'concept' | 'code' | 'diagram' | 'terminal';

export interface BaseScene {
  id: string;
  type: SceneType;
  title: string;
  narration: string;
  duration?: number;
}

export interface ConceptScene extends BaseScene {
  type: 'concept';
  body: string;
  bullets?: string[];
}

export interface CodeScene extends BaseScene {
  type: 'code';
  code: string;
  language?: string;
  reveal?: number[];
  highlights?: number[];
}

export interface DiagramNode {
  id: string;
  label: string;
}

export interface DiagramScene extends BaseScene {
  type: 'diagram';
  nodes: DiagramNode[];
  edges: Array<[string, string]>;
}

export interface TerminalScene extends BaseScene {
  type: 'terminal';
  command: string;
  output: string;
}

export type LessonScene = ConceptScene | CodeScene | DiagramScene | TerminalScene;

interface ExerciseBase {
  id: string;
  type: 'multiple-choice' | 'output-prediction' | 'code-completion';
  prompt: string;
  explanation: string;
  afterScene: string;
}

export interface ChoiceExercise extends ExerciseBase {
  type: 'multiple-choice' | 'output-prediction';
  choices: string[];
  answer: number;
}

export interface CodeTest {
  name: string;
  expression: string;
  expected: unknown;
}

export interface CodeExercise extends ExerciseBase {
  type: 'code-completion';
  starter: string;
  solution?: string;
  tests: CodeTest[];
}

export type Exercise = ChoiceExercise | CodeExercise;

export interface LessonDefinition {
  schemaVersion: 1;
  slug: string;
  title: string;
  language: string;
  objectives: string[];
  prerequisites: string[];
  scenes: LessonScene[];
  exercises: Exercise[];
}

export interface AudioSegment {
  sceneId: string;
  src: string;
  duration: number;
  provider: string;
  cacheKey: string;
}

export interface ProducedLesson extends LessonDefinition {
  producedAt: string;
  sourceHash: string;
  audio: AudioSegment[];
  totalDuration: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}
