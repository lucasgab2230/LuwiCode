import { FileItem, TerminalSession, TerminalLine, EditorSettings, AISettings } from '@app-types/index';

// Generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

// Detect language from file extension
export const detectLanguage = (filename: string): string => {
  const ext = getFileExtension(filename).toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    kt: 'kotlin',
    cpp: 'cpp',
    c: 'c',
    h: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    sql: 'sql',
    graphql: 'graphql',
    dockerfile: 'dockerfile',
    gitignore: 'gitignore',
  };
  return languageMap[ext] || 'plaintext';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Create a new file item
export const createFileItem = (
  name: string,
  path: string,
  type: 'file' | 'directory' = 'file',
  content?: string
): FileItem => {
  return {
    id: generateId(),
    name,
    path,
    type,
    content,
    language: type === 'file' ? detectLanguage(name) : undefined,
    lastModified: Date.now(),
  };
};

// Create a new terminal session
export const createTerminalSession = (
  name: string = 'Terminal',
  cwd: string = '~'
): TerminalSession => {
  return {
    id: generateId(),
    name,
    history: [
      {
        id: generateId(),
        type: 'system',
        content: `Welcome to Mobile IDE Terminal\nType 'help' for available commands`,
        timestamp: Date.now(),
      },
    ],
    cwd,
    isActive: true,
  };
};

export const createDefaultEditorSettings = (): EditorSettings => ({
  fontSize: 14,
  tabSize: 2,
  autoSave: true,
  showLineNumbers: true,
  wordWrap: false,
});

export const createDefaultAISettings = (): AISettings => ({
  enabled: false,
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 512,
});

// Add line to terminal history
export const addTerminalLine = (
  session: TerminalSession,
  type: TerminalLine['type'],
  content: string
): TerminalSession => {
  const newLine: TerminalLine = {
    id: generateId(),
    type,
    content,
    timestamp: Date.now(),
  };
  return {
    ...session,
    history: [...session.history, newLine],
  };
};

// Simple path utilities
export const joinPath = (...paths: string[]): string => {
  return paths.join('/').replace(/\/+/g, '/');
};

export const getParentPath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
};

export const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
};

// Validate code syntax (basic validation)
export const validateSyntax = (code: string, language: string): string[] => {
  const errors: string[] = [];
  
  // Basic bracket matching
  const brackets: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };
  
  const stack: string[] = [];
  let lineNum = 1;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '\n') lineNum++;
    
    if (char in brackets) {
      stack.push(brackets[char]);
    } else if (Object.values(brackets).includes(char)) {
      const expected = stack.pop();
      if (expected !== char) {
        errors.push(`Line ${lineNum}: Mismatched bracket '${char}'`);
      }
    }
  }
  
  if (stack.length > 0) {
    errors.push(`Unclosed brackets: ${stack.join(', ')}`);
  }
  
  return errors;
};
