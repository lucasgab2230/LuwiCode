import * as FileSystem from 'expo-file-system';

import { AISettings, EditorSettings, FileItem, PersistedAppState, TerminalSession } from '@app-types/index';
import { createDefaultAISettings, createDefaultEditorSettings, createTerminalSession } from '@utils/helpers';

const STORAGE_FILE = 'luwicode-state.json';

const getStorageUri = (): string | null => {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  return `${FileSystem.documentDirectory}${STORAGE_FILE}`;
};

const createDefaultFiles = (): FileItem[] => ([
  {
    id: 'welcome-app',
    name: 'app.ts',
    path: '/app.ts',
    type: 'file',
    content: '// Welcome to LuwiCode\nconsole.log("Hello, World!");\n',
    language: 'typescript',
    lastModified: Date.now(),
  },
  {
    id: 'welcome-utils',
    name: 'utils.ts',
    path: '/utils.ts',
    type: 'file',
    content: '// Utility functions\nexport const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};\n',
    language: 'typescript',
    lastModified: Date.now(),
  },
  {
    id: 'welcome-readme',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    content: '# LuwiCode\n\nA mobile code editor for Android with Termux and AI support.\n',
    language: 'markdown',
    lastModified: Date.now(),
  },
  {
    id: 'welcome-src',
    name: 'src',
    path: '/src',
    type: 'directory',
    lastModified: Date.now(),
  },
]);

export const createDefaultAppState = (): PersistedAppState => {
  const files = createDefaultFiles();

  return {
    isDarkMode: true,
    files,
    currentFilePath: '/app.ts',
    terminalSession: createTerminalSession('Terminal 1'),
    editorSettings: createDefaultEditorSettings(),
    aiSettings: createDefaultAISettings(),
  };
};

export const loadAppState = async (): Promise<PersistedAppState> => {
  const storageUri = getStorageUri();

  if (!storageUri) {
    return createDefaultAppState();
  }

  try {
    const info = await FileSystem.getInfoAsync(storageUri);
    if (!info.exists) {
      return createDefaultAppState();
    }

    const contents = await FileSystem.readAsStringAsync(storageUri);
    const parsed = JSON.parse(contents) as Partial<PersistedAppState>;
    const defaults = createDefaultAppState();

    return {
      ...defaults,
      ...parsed,
      files: parsed.files?.length ? parsed.files : defaults.files,
      terminalSession: parsed.terminalSession ?? defaults.terminalSession,
      editorSettings: parsed.editorSettings ?? defaults.editorSettings,
      aiSettings: parsed.aiSettings ?? defaults.aiSettings,
    };
  } catch {
    return createDefaultAppState();
  }
};

export const saveAppState = async (state: PersistedAppState): Promise<void> => {
  const storageUri = getStorageUri();

  if (!storageUri) {
    return;
  }

  await FileSystem.writeAsStringAsync(storageUri, JSON.stringify(state, null, 2));
};

export const buildFileContentMap = (files: FileItem[]): Record<string, string> => {
  return files.reduce<Record<string, string>>((accumulator, file) => {
    if (file.type === 'file') {
      accumulator[file.path] = file.content ?? '';
    }

    return accumulator;
  }, {});
};

export const findCurrentFile = (files: FileItem[], currentFilePath: string | null): FileItem | null => {
  if (!currentFilePath) {
    return files.find(file => file.type === 'file') ?? null;
  }

  return files.find(file => file.path === currentFilePath) ?? files.find(file => file.type === 'file') ?? null;
};

export const mergeFileContents = (files: FileItem[], contents: Record<string, string>): FileItem[] => {
  return files.map(file => (
    file.type === 'file'
      ? {
          ...file,
          content: contents[file.path] ?? file.content ?? '',
        }
      : file
  ));
};
