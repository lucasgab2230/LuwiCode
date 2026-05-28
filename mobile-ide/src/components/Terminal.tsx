import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { TerminalSession, TerminalLine } from '@app-types/index';
import { darkTheme } from '@utils/theme';

interface TerminalProps {
  session: TerminalSession;
  onCommandExecute?: (command: string) => Promise<void>;
  theme?: typeof darkTheme;
}

const TERMUX_HOME_PREFIX = /^\/data\/data\/com\.termux\/files\/home/;

const formatTermuxPath = (path: string): string => path.replace(TERMUX_HOME_PREFIX, '~');

export const Terminal: React.FC<TerminalProps> = ({
  session,
  onCommandExecute,
  theme = darkTheme,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!scrollViewRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [session.history]);

  const moveHistory = useCallback((direction: -1 | 1) => {
    if (!history.length) {
      return;
    }

    setHistoryIndex(currentIndex => {
      const nextIndex = Math.max(-1, Math.min(history.length - 1, currentIndex + direction));

      if (nextIndex < 0) {
        setInputValue('');
        return -1;
      }

      setInputValue(history[nextIndex]);
      return nextIndex;
    });
  }, [history]);

  const handleExecuteCommand = useCallback(async () => {
    const command = inputValue.trim();
    if (!command) {
      return;
    }

    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setInputValue('');

    await onCommandExecute?.(command);
  }, [inputValue, onCommandExecute]);

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
                {formatTermuxPath(session.cwd)} $ 
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

      <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
        <View style={[styles.promptContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.prompt, { color: theme.colors.terminalPrompt }]}>
            {formatTermuxPath(session.cwd)} $ 
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

      <View style={[styles.quickActions, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.quickAction} onPress={() => moveHistory(-1)}>
          <Ionicons name="chevron-up" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => moveHistory(1)}>
          <Ionicons name="chevron-down" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInputValue('ls -la')}>
          <Ionicons name="list" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>ls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInputValue('pwd')}>
          <Ionicons name="location" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>pwd</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInputValue('clear')}>
          <Ionicons name="trash" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => setInputValue('termux-info')}>
          <Ionicons name="information-circle" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => inputRef.current?.focus()}>
          <Ionicons name="keypad" size={16} color={theme.colors.secondary} />
          <Text style={[styles.quickActionText, { color: theme.colors.secondary }]}>focus</Text>
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
    flexWrap: 'wrap',
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
