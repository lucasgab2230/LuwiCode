import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TerminalSession, TerminalLine } from '@types/index';
import { termuxService } from '@utils/termuxService';
import { darkTheme } from '@utils/theme';

interface TerminalProps {
  session: TerminalSession;
  onCommandExecute?: (command: string) => void;
  theme?: typeof darkTheme;
}

export const Terminal: React.FC<TerminalProps> = ({
  session,
  onCommandExecute,
  theme = darkTheme,
}) => {
  const [inputValue, setInputValue] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new output arrives
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [session.history]);

  const handleExecuteCommand = useCallback(async () => {
    const command = inputValue.trim();
    if (!command) return;

    // Add input line to history
    const inputLine: TerminalLine = {
      id: `${Date.now()}-input`,
      type: 'input',
      content: `${session.cwd.replace('~', '~')} $ ${command}`,
      timestamp: Date.now(),
    };

    setInputValue('');
    onCommandExecute?.(command);

    // Execute command via Termux service
    const output = await termuxService.executeCommand({
      command: command.split(' ')[0],
      args: command.split(' ').slice(1),
      cwd: session.cwd,
    });

    // Output is handled by parent component through state management
  }, [inputValue, session.cwd, onCommandExecute]);

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'input':
        return theme.colors.primary;
      case 'output':
        return theme.colors.terminalText;
      case 'error':
        return theme.colors.error;
      case 'system':
        return theme.colors.info;
      default:
        return theme.colors.terminalText;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.terminalBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Terminal Output */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.outputContainer}
        contentContainerStyle={styles.outputContent}
        keyboardShouldPersistTaps="handled"
      >
        {session.history.map((line) => (
          <View key={line.id} style={styles.line}>
            {line.type === 'input' && (
              <Text style={[styles.prompt, { color: theme.colors.terminalPrompt }]}>
                {session.cwd.replace(/^\/data\/data\/com\.termux\/files\/home/, '~')} ${' '}
              </Text>
            )}
            <Text
              style={[
                styles.lineText,
                { color: getLineColor(line.type) },
                line.type === 'error' && styles.errorText,
              ]}
            >
              {line.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Command Input */}
      <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
        <View style={[styles.promptContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.prompt, { color: theme.colors.terminalPrompt }]}>
            {session.cwd.replace(/^\/data\/data\/com\.termux\/files\/home/, '~')} ${' '}
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleExecuteCommand}
            placeholder="Enter command..."
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            multiline={false}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleExecuteCommand}
        >
          <Ionicons name="send" size={20} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setInputValue('ls -la')}
        >
          <Ionicons name="list" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
            ls
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setInputValue('pwd')}
        >
          <Ionicons name="location" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
            pwd
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setInputValue('clear')}
        >
          <Ionicons name="trash" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
            clear
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setInputValue('termux-info')}
        >
          <Ionicons name="information-circle" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
            info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="keyboard" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>
            focus
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  outputContainer: {
    flex: 1,
  },
  outputContent: {
    padding: 12,
  },
  line: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  prompt: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    marginRight: 8,
  },
  lineText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    flex: 1,
  },
  errorText: {
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'center',
    padding: 8,
  },
  promptContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  sendButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  quickActionText: {
    marginLeft: 4,
    fontSize: 12,
  },
});

export default Terminal;
