import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CodeEditor } from '@components/CodeEditor';
import { Terminal } from '@components/Terminal';
import { FileExplorer } from '@components/FileExplorer';
import { Settings } from '@components/Settings';
import { darkTheme, lightTheme } from '@utils/theme';
import { aiService } from '@utils/aiService';
import { termuxService } from '@utils/termuxService';
import {
  createDefaultAppState,
  findCurrentFile,
  loadAppState,
  saveAppState,
} from '@utils/storage';
import {
  AISettings,
  EditorSettings,
  FileItem,
  GitState,
  TerminalLine,
  TerminalSession,
} from '@app-types/index';
import { createFileItem } from '@utils/helpers';

const Tab = createBottomTabNavigator();

const defaultAppState = createDefaultAppState();
const terminalLineDelayMs = 60;

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const expandOutput = (lines: TerminalLine[]): TerminalLine[] => {
  return lines.flatMap(line => {
    const chunks = line.content.split('\n');
    if (chunks.length === 1) {
      return [line];
    }

    return chunks.map((chunk, index) => ({
      ...line,
      id: `${line.id}-${index}`,
      content: chunk,
    }));
  });
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(defaultAppState.isDarkMode);
  const [files, setFiles] = useState<FileItem[]>(defaultAppState.files);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(findCurrentFile(defaultAppState.files, defaultAppState.currentFilePath));
  const [terminalSession, setTerminalSession] = useState<TerminalSession>(defaultAppState.terminalSession);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultAppState.editorSettings);
  const [aiSettings, setAiSettings] = useState<AISettings>(defaultAppState.aiSettings);
  const [gitState, setGitState] = useState<GitState>({
    isTermuxAvailable: false,
    isGitAvailable: false,
    statusMessage: 'Checking Termux environment...',
    lastCheckedAt: null,
  });
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const persistableState = useMemo(() => ({
    isDarkMode,
    files,
    currentFilePath: currentFile?.path ?? null,
    terminalSession,
    editorSettings,
    aiSettings,
  }), [aiSettings, currentFile?.path, editorSettings, files, isDarkMode, terminalSession]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loadedState = await loadAppState();
      if (cancelled) {
        return;
      }

      setIsDarkMode(loadedState.isDarkMode);
      setFiles(loadedState.files);
      setCurrentFile(findCurrentFile(loadedState.files, loadedState.currentFilePath));
      setTerminalSession(loadedState.terminalSession);
      setEditorSettings(loadedState.editorSettings);
      setAiSettings(loadedState.aiSettings);

      const environment = await termuxService.refreshEnvironment();
      if (!cancelled) {
        setGitState(environment);
      }

      setIsHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timer = setTimeout(() => {
      void saveAppState({
        ...persistableState,
        terminalSession: {
          ...terminalSession,
          history: terminalSession.history,
        },
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [isHydrated, persistableState, terminalSession]);

  const handleFileSelect = useCallback((file: FileItem) => {
    if (file.type === 'file') {
      setCurrentFile(file);
    }
  }, []);

  const handleContentChange = useCallback((content: string) => {
    if (!currentFile) {
      return;
    }

    const now = Date.now();
    const updatedFile = {
      ...currentFile,
      content,
      lastModified: now,
    };

    setCurrentFile(updatedFile);
    setFiles(previousFiles => previousFiles.map(file => (file.id === currentFile.id ? updatedFile : file)));
  }, [currentFile]);

  const handleSave = useCallback(() => {
    if (!currentFile) {
      return;
    }

    const now = Date.now();
    setCurrentFile(previous => previous ? { ...previous, lastModified: now } : previous);
    setFiles(previousFiles => previousFiles.map(file => (
      file.id === currentFile.id
        ? { ...file, lastModified: now }
        : file
    )));
  }, [currentFile]);

  const handleFileCreate = useCallback((name: string, type: 'file' | 'directory') => {
    const newFile = createFileItem(name, `/${name}`, type, type === 'file' ? '' : undefined);
    setFiles(previousFiles => [...previousFiles, newFile]);
    if (type === 'file') {
      setCurrentFile(newFile);
    }
  }, []);

  const handleFileDelete = useCallback((file: FileItem) => {
    setFiles(previousFiles => previousFiles.filter(existing => existing.id !== file.id));
    setCurrentFile(previous => (previous?.id === file.id ? null : previous));
  }, []);

  const appendTerminalLines = useCallback(async (lines: TerminalLine[]) => {
    for (const line of expandOutput(lines)) {
      setTerminalSession(previous => ({
        ...previous,
        history: [...previous.history, line],
      }));
      await delay(terminalLineDelayMs);
    }
  }, []);

  const handleCommandExecute = useCallback(async (command: string) => {
    const inputLine: TerminalLine = {
      id: `${Date.now()}-input`,
      type: 'input',
      content: `~ $ ${command}`,
      timestamp: Date.now(),
    };

    setTerminalSession(previous => ({
      ...previous,
      history: [...previous.history, inputLine],
    }));

    const [commandName, ...args] = command.trim().split(/\s+/);
    if (!commandName) {
      return;
    }

    if (commandName === 'clear') {
      setTerminalSession(previous => ({
        ...previous,
        history: [defaultAppState.terminalSession.history[0]],
      }));
      return;
    }

    const result = await termuxService.executeCommand({
      command: commandName,
      args,
      cwd: terminalSession.cwd,
    });

    await appendTerminalLines(result);
  }, [appendTerminalLines, terminalSession.cwd]);

  const handleRefreshEnvironment = useCallback(async () => {
    const environment = await termuxService.refreshEnvironment();
    setGitState(environment);
  }, []);

  const handleGitAction = useCallback(async (action: 'status' | 'add' | 'commit' | 'pull' | 'push' | 'branches', message?: string) => {
    if (!gitState.isGitAvailable) {
      setGitState(previous => ({
        ...previous,
        statusMessage: 'Git is unavailable in the current environment.',
      }));
      return;
    }

    let output: TerminalLine[] = [];
    switch (action) {
      case 'status':
        output = await termuxService.executeGitStatus(terminalSession.cwd);
        break;
      case 'add':
        output = await termuxService.executeGitAdd(terminalSession.cwd);
        break;
      case 'commit':
        output = await termuxService.executeGitCommit(message || 'Update from LuwiCode', terminalSession.cwd);
        break;
      case 'pull':
        output = await termuxService.executeGitPull(terminalSession.cwd);
        break;
      case 'push':
        output = await termuxService.executeGitPush(terminalSession.cwd);
        break;
      case 'branches':
        output = await termuxService.executeGitBranches(terminalSession.cwd);
        break;
      default:
        break;
    }

    if (output.length) {
      await appendTerminalLines(output);
    }

    setGitState(previous => ({
      ...previous,
      statusMessage: `git ${action} completed`,
      lastCheckedAt: Date.now(),
    }));
  }, [appendTerminalLines, gitState.isGitAvailable, terminalSession.cwd]);

  const handleTestAiConnection = useCallback(async () => {
    try {
      const message = await aiService.testConnection(aiSettings);
      setAiStatusMessage(`AI connected: ${message}`);
    } catch (error) {
      setAiStatusMessage(error instanceof Error ? error.message : 'AI connection failed');
    }
  }, [aiSettings]);

  const handleExplainCode = useCallback(async (code: string): Promise<string> => {
    const result = await aiService.explainCode(code, aiSettings);
    return result.text;
  }, [aiSettings]);

  const handleGenerateCode = useCallback(async (prompt: string): Promise<string> => {
    const result = await aiService.generateCode(prompt, aiSettings);
    return result.text;
  }, [aiSettings]);

  const handleAutocomplete = useCallback(async (content: string, cursorOffset: number): Promise<string | null> => {
    try {
      const result = await aiService.autocomplete({ content, cursorOffset }, aiSettings);
      return result.text || null;
    } catch {
      return null;
    }
  }, [aiSettings]);

  const handleResetSettings = useCallback(() => {
    setIsDarkMode(true);
    setEditorSettings(defaultAppState.editorSettings);
    setAiSettings(defaultAppState.aiSettings);
    setAiStatusMessage('');
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
          />
          <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: React.ComponentProps<typeof Ionicons>['name'];

                  switch (route.name) {
                    case 'Editor':
                      iconName = focused ? 'code-slash' : 'code-slash-outline';
                      break;
                    case 'Terminal':
                      iconName = focused ? 'terminal' : 'terminal-outline';
                      break;
                    case 'Files':
                      iconName = focused ? 'folder' : 'folder-outline';
                      break;
                    case 'Settings':
                      iconName = focused ? 'settings' : 'settings-outline';
                      break;
                    default:
                      iconName = 'ellipsis-horizontal';
                  }

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                  height: 60,
                  paddingBottom: 8,
                  paddingTop: 8,
                },
                tabBarLabelStyle: {
                  fontSize: 12,
                  fontWeight: '600',
                },
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                },
                headerTitleStyle: {
                  color: theme.colors.text,
                  fontWeight: 'bold',
                },
              })}
            >
              <Tab.Screen name="Editor" options={{ title: 'Editor' }}>
                {() => (
                  <CodeEditor
                    file={currentFile}
                    content={currentFile?.content || ''}
                    onContentChange={handleContentChange}
                    onSave={handleSave}
                    settings={editorSettings}
                    theme={theme}
                    aiSettings={aiSettings}
                    onExplainCode={handleExplainCode}
                    onGenerateCode={handleGenerateCode}
                    onRequestAutocomplete={handleAutocomplete}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen name="Terminal" options={{ title: 'Terminal' }}>
                {() => (
                  <Terminal
                    session={terminalSession}
                    onCommandExecute={handleCommandExecute}
                    theme={theme}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen name="Files" options={{ title: 'Files' }}>
                {() => (
                  <FileExplorer
                    files={files}
                    onFileSelect={handleFileSelect}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                    theme={theme}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen name="Settings" options={{ title: 'Settings' }}>
                {() => (
                  <Settings
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={setIsDarkMode}
                    onResetSettings={handleResetSettings}
                    editorSettings={editorSettings}
                    onEditorSettingsChange={setEditorSettings}
                    aiSettings={aiSettings}
                    onAiSettingsChange={setAiSettings}
                    onTestAiConnection={handleTestAiConnection}
                    aiStatusMessage={aiStatusMessage}
                    gitState={gitState}
                    onRefreshEnvironment={handleRefreshEnvironment}
                    onGitAction={handleGitAction}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
