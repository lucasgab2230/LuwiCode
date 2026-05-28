import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Editor: { fileId?: string; initialContent?: string };
  Terminal: undefined;
  FileExplorer: undefined;
  Settings: undefined;
};

export type BottomTabParamList = {
  Editor: undefined;
  Terminal: undefined;
  Files: undefined;
  Settings: undefined;
};

// File types
export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  language?: string;
  lastModified?: number;
  children?: FileItem[];
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export interface AISettings {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface EditorState {
  currentFile: FileItem | null;
  files: FileItem[];
  unsavedChanges: Record<string, boolean>;
  recentFiles: string[];
}

// Terminal types
export interface TerminalSession {
  id: string;
  name: string;
  history: TerminalLine[];
  cwd: string;
  isActive: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export interface GitState {
  isTermuxAvailable: boolean;
  isGitAvailable: boolean;
  statusMessage: string;
  lastCheckedAt: number | null;
}

export interface TermuxCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface PersistedAppState {
  isDarkMode: boolean;
  files: FileItem[];
  currentFilePath: string | null;
  terminalSession: TerminalSession;
  editorSettings: EditorSettings;
  aiSettings: AISettings;
}

// Theme types
export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    editorBackground: string;
    lineNumber: string;
    selection: string;
    cursor: string;
    terminalBackground: string;
    terminalText: string;
    terminalPrompt: string;
  };
}
