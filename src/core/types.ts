export type SceneType = 'concept' | 'code' | 'diagram' | 'terminal' | 'visual';

export interface BaseScene {
  id: string;
  type: SceneType;
  title: string;
  narration: string;
  duration?: number;
  /** Scenes sharing a group form one part (one screen) of the lesson. */
  group?: string;
  groupTitle?: string;
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

export interface VisualItem {
  icon: string;
  label: string;
  detail?: string;
  steps?: string[];
  /** File inside lessons/<slug>/assets/. */
  image?: string;
}

export type VisualKind = 'timeline' | 'browser-download' | 'installer' | 'extensions' | 'open-folder' | 'open-chat' | 'agent-work' | 'browser-page' | 'prompt-anatomy' | 'frontend' | 'backend' | 'database' | 'docker' | 'app-preview' | 'prompt-flow' | 'choices';

export interface VisualScene extends BaseScene {
  type: 'visual';
  visual: VisualKind;
  items?: VisualItem[];
  /** Titled images (label, detail, image) for the visuals that show a catalog. */
  cards?: VisualItem[];
  /** Index of the item to emphasize. */
  focus?: number;
  steps?: string[];
}

export type LessonScene = ConceptScene | CodeScene | DiagramScene | TerminalScene | VisualScene;

interface ExerciseBase {
  id: string;
  type: 'multiple-choice' | 'output-prediction' | 'code-completion' | 'prompt-copy' | 'authorization' | 'checkpoint';
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

export interface PromptCopyExercise extends ExerciseBase {
  type: 'prompt-copy';
  copyText: string;
  buttonLabel?: string;
}

export interface AuthorizationExercise extends ExerciseBase {
  type: 'authorization';
  notice: string;
  consentLabel: string;
  copyText: string;
  buttonLabel?: string;
}

export interface CheckpointExercise extends ExerciseBase {
  type: 'checkpoint';
}

export type Exercise = ChoiceExercise | CodeExercise | PromptCopyExercise | AuthorizationExercise | CheckpointExercise;

export interface LessonDefinition {
  schemaVersion: 1;
  slug: string;
  title: string;
  courseTitle?: string;
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
