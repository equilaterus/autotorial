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
  /** Show the code in two columns, the first one with this many lines. */
  split?: number;
  /** Language of each column when they differ (for example C# next to JavaScript). */
  languages?: string[];
  /** Highlighted lines that change in order, spread evenly over the scene while it is narrated. */
  focus?: Array<number[] | {lines: number[]; at?: string}>;
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
  /** Percentage (0-100) for meters such as usage-panel. */
  value?: number;
  /** Phrase of the narration at which this item becomes the active one (otherwise items are spread evenly). */
  at?: string;
  /** annotated-screenshot: box over the image as [x, y, width, height] in percent. */
  area?: number[];
}

export type VisualKind = 'timeline' | 'browser-download' | 'installer' | 'extensions' | 'open-folder' | 'open-chat' | 'agent-work' | 'browser-page' | 'prompt-anatomy' | 'model-picker' | 'usage-panel' | 'frontend' | 'backend' | 'database' | 'docker' | 'app-preview' | 'prompt-flow' | 'choices' | 'swagger-mock' | 'task-board' | 'url-anatomy' | 'request-flow' | 'memory-list' | 'vscode' | 'async-lanes' | 'table-relation' | 'screenshot' | 'hub' | 'annotated-screenshot' | 'jsx-preview';

export interface VisualScene extends BaseScene {
  type: 'visual';
  visual: VisualKind;
  items?: VisualItem[];
  /** Titled images (label, detail, image) for the visuals that show a catalog. */
  cards?: VisualItem[];
  /** Index of the item to emphasize. */
  focus?: number;
  steps?: string[];
  /** Render items without card background or border (opt-in; supported by timeline and backend). */
  plain?: boolean;
  /** vscode: the file shown in the editor (code), with items as the explorer tree (value = depth, focus = open file). */
  code?: string;
  /** request-flow: labels that travel on each arrow: request, query, data, response. */
  packets?: string[];
  /** jsx-preview: the HTML the code renders, shown in a browser next to the code. */
  html?: string;
  /** jsx-preview: lines highlighted in each phase (one entry per stepAt phrase). */
  focusLines?: number[][];
  /** jsx-preview: a label shown next to the first highlighted line in each phase (empty for none), for example "hook". */
  notes?: string[];
  /** jsx-preview: show the result from the start of the scene instead of at the last phase. */
  showResult?: 'start' | 'end';
  /** vscode: narration phrase at which the file items[openFocus] is opened and openCode is shown. */
  openAt?: string;
  openFocus?: number;
  openCode?: string;
  /** Narration phrases at which each step (request-flow, vscode) becomes active. */
  stepAt?: string[];
  /** swagger-mock: which Swagger view to draw. */
  stage?: 'overview' | 'method-map' | 'request-response' | 'hands-on';
  /** swagger-mock: API title, or the URL shown in the browser bar for hands-on. */
  header?: string;
  operations?: Array<{method: string; path: string; caption?: string}>;
  request?: {method: string; path: string; json?: string};
  response?: {status: number; json?: string};
  followup?: {method: string; path: string; status: number; json?: string};
}

export type LessonScene = ConceptScene | CodeScene | DiagramScene | TerminalScene | VisualScene;

interface ExerciseBase {
  id: string;
  type: 'multiple-choice' | 'output-prediction' | 'code-completion' | 'prompt-copy' | 'authorization' | 'checkpoint' | 'playground';
  prompt: string;
  /** Short heading; when present the prompt is shown below it as the description. */
  title?: string;
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
  /** Language of the editor highlighting; the sandbox runs JavaScript. */
  language?: 'javascript' | 'csharp';
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

/** A React component the learner edits and sees running next to the editor; checks run in the preview after a fresh render. */
export interface PlaygroundExercise extends ExerciseBase {
  type: 'playground';
  /** JSX that defines an App component (useState and useEffect are available). */
  starter: string;
  solution?: string;
  /** Expressions evaluated in the preview (document is the rendered page). */
  checks: CodeTest[];
}

export type Exercise = ChoiceExercise | CodeExercise | PromptCopyExercise | AuthorizationExercise | CheckpointExercise | PlaygroundExercise;

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
