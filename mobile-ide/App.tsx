import React, { useState, useCallback, useEffect } from 'react';
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
import { FileItem, TerminalSession, TerminalLine } from '@types/index';
import { createFileItem, createTerminalSession, addTerminalLine } from '@utils/helpers';

const Tab = createBottomTabNavigator();

// Sample initial files
const initialFiles: FileItem[] = [
  createFileItem('app.ts', '/app.ts', 'file', '// Welcome to Mobile IDE\nconsole.log("Hello, World!");\n'),
  createFileItem('utils.ts', '/utils.ts', 'file', '// Utility functions\nexport const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};\n'),
  createFileItem('README.md', '/README.md', 'file', '# Mobile IDE\n\nA code editor for Android with Termux integration.\n\n## Features\n- Code editing with syntax highlighting\n- Integrated terminal with Termux support\n- File management\n- Customizable settings\n'),
  createFileItem('src', '/src', 'directory'),
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    '/app.ts': '// Welcome to Mobile IDE\nconsole.log("Hello, World!");\n',
    '/utils.ts': '// Utility functions\nexport const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};\n',
    '/README.md': '# Mobile IDE\n\nA code editor for Android with Termux integration.\n\n## Features\n- Code editing with syntax highlighting\n- Integrated terminal with Termux support\n- File management\n- Customizable settings\n',
  });
  const [terminalSession, setTerminalSession] = useState<TerminalSession>(
    createTerminalSession('Terminal 1')
  );

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleFileSelect = useCallback((file: FileItem) => {
    if (file.type === 'file') {
      setCurrentFile(file);
    }
  }, []);

  const handleContentChange = useCallback((content: string) => {
    if (currentFile) {
      setFileContents(prev => ({
        ...prev,
        [currentFile.path]: content,
      }));
    }
  }, [currentFile]);

  const handleSave = useCallback(() => {
    if (currentFile) {
      // In a real app, this would save to disk
      console.log('Saving file:', currentFile.path);
      // Update last modified
      setFiles(prev => prev.map(f => 
        f.id === currentFile.id 
          ? { ...f, lastModified: Date.now() }
          : f
      ));
    }
  }, [currentFile]);

  const handleFileCreate = useCallback((name: string, type: 'file' | 'directory') => {
    const newFile = createFileItem(name, `/${name}`, type, type === 'file' ? '' : undefined);
    setFiles(prev => [...prev, newFile]);
    if (type === 'file') {
      setFileContents(prev => ({ ...prev, [newFile.path]: '' }));
    }
  }, []);

  const handleFileDelete = useCallback((file: FileItem) => {
    setFiles(prev => prev.filter(f => f.id !== file.id));
    if (currentFile?.id === file.id) {
      setCurrentFile(null);
    }
    const newContents = { ...fileContents };
    delete newContents[file.path];
    setFileContents(newContents);
  }, [currentFile, fileContents]);

  const handleCommandExecute = useCallback(async (command: string) => {
    // Add command input to terminal history
    const inputLine: TerminalLine = {
      id: `${Date.now()}-input`,
      type: 'input',
      content: `~ $ ${command}`,
      timestamp: Date.now(),
    };

    setTerminalSession(prev => ({
      ...prev,
      history: [...prev.history, inputLine],
    }));

    // Command execution is handled by the Terminal component via termuxService
  }, []);

  const handleResetSettings = useCallback(() => {
    setIsDarkMode(true);
    // Reset other settings as needed
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
                  let iconName: string;

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
              <Tab.Screen
                name="Editor"
                options={{ title: 'Editor' }}
              >
                {(props) => (
                  <CodeEditor
                    file={currentFile}
                    content={currentFile ? (fileContents[currentFile.path] || '') : ''}
                    onContentChange={handleContentChange}
                    onSave={handleSave}
                    theme={theme}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen
                name="Terminal"
                options={{ title: 'Terminal' }}
              >
                {(props) => (
                  <Terminal
                    session={terminalSession}
                    onCommandExecute={handleCommandExecute}
                    theme={theme}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen
                name="Files"
                options={{ title: 'Files' }}
              >
                {(props) => (
                  <FileExplorer
                    files={files}
                    onFileSelect={handleFileSelect}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                    theme={theme}
                  />
                )}
              </Tab.Screen>

              <Tab.Screen
                name="Settings"
                options={{ title: 'Settings' }}
              >
                {(props) => (
                  <Settings
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={setIsDarkMode}
                    onResetSettings={handleResetSettings}
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
