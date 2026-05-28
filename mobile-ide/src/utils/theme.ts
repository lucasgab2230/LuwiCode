import { Theme } from '@app-types/index';

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    primary: '#58a6ff',
    secondary: '#8b949e',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    border: '#30363d',
    error: '#f85149',
    success: '#3fb950',
    warning: '#d29922',
    info: '#58a6ff',
    editorBackground: '#0d1117',
    lineNumber: '#484f58',
    selection: '#264f78',
    cursor: '#58a6ff',
    terminalBackground: '#0d1117',
    terminalText: '#c9d1d9',
    terminalPrompt: '#3fb950',
  },
};

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#ffffff',
    surface: '#f6f8fa',
    primary: '#0969da',
    secondary: '#57606a',
    text: '#24292f',
    textSecondary: '#57606a',
    border: '#d0d7de',
    error: '#cf222e',
    success: '#1a7f37',
    warning: '#9a6700',
    info: '#0969da',
    editorBackground: '#ffffff',
    lineNumber: '#8c959f',
    selection: '#b6e3ff',
    cursor: '#0969da',
    terminalBackground: '#1e1e1e',
    terminalText: '#cccccc',
    terminalPrompt: '#4ec9b0',
  },
};

export const syntaxHighlighting = {
  keyword: '#ff7b72',
  string: '#a5d6ff',
  comment: '#8b949e',
  function: '#d2a8ff',
  number: '#79c0ff',
  operator: '#79c0ff',
  variable: '#ffa657',
  type: '#7ee787',
  tag: '#7ee787',
  attribute: '#79c0ff',
};
