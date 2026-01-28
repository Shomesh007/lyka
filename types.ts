export interface GitHubNode {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface FileContent {
  path: string;
  content: string;
  sha: string;
  isDirty?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum EditorMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DIFF = 'DIFF'
}
