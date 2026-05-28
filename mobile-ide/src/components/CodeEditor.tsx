import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AISettings, EditorSettings, FileItem } from '@app-types/index';
import { darkTheme } from '@utils/theme';

interface CodeEditorProps {
  file: FileItem | null;
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  settings: EditorSettings;
  theme?: typeof darkTheme;
  readOnly?: boolean;
  aiSettings?: AISettings;
  onExplainCode?: (code: string) => Promise<string>;
  onGenerateCode?: (prompt: string) => Promise<string>;
  onRequestAutocomplete?: (content: string, cursorOffset: number) => Promise<string | null>;
}

type SelectionRange = {
  start: number;
  end: number;
};

const emptySelection: SelectionRange = { start: 0, end: 0 };

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  content,
  onContentChange,
  onSave,
  settings,
  theme = darkTheme,
  readOnly = false,
  aiSettings,
  onExplainCode,
  onGenerateCode,
  onRequestAutocomplete,
}) => {
  const [selection, setSelection] = useState<SelectionRange>(emptySelection);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const cursorPosition = useMemo(() => {
    const textBeforeCursor = content.slice(0, selection.end);
    const lines = textBeforeCursor.split('\n');

    return {
      line: lines.length,
      column: lines[lines.length - 1]?.length + 1 || 1,
    };
  }, [content, selection.end]);

  const selectedText = useMemo(() => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    return content.slice(start, end);
  }, [content, selection]);

  useEffect(() => {
    if (!onRequestAutocomplete || !aiSettings?.enabled || readOnly) {
      setAiSuggestion('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!content.trim()) {
        return;
      }

      try {
        const suggestion = await onRequestAutocomplete(content, selection.end);
        if (!cancelled) {
          setAiSuggestion(suggestion?.trim() ?? '');
        }
      } catch {
        if (!cancelled) {
          setAiSuggestion('');
        }
      }
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiSettings?.enabled, content, onRequestAutocomplete, readOnly, selection.end]);

  const replaceSelection = useCallback((text: string) => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const nextContent = `${content.slice(0, start)}${text}${content.slice(end)}`;
    onContentChange(nextContent);
    const nextCursor = start + text.length;
    setSelection({ start: nextCursor, end: nextCursor });
  }, [content, onContentChange, selection]);

  const handleSelectionChange = useCallback((event: any) => {
    const { selection: nextSelection } = event.nativeEvent;
    if (nextSelection) {
      setSelection({
        start: nextSelection.start,
        end: nextSelection.end,
      });
    }
  }, []);

  const handleContentChange = useCallback((text: string) => {
    onContentChange(text);
    const nextCursor = text.length;
    setSelection({ start: nextCursor, end: nextCursor });
  }, [onContentChange]);

  const handleInsertTab = useCallback(() => {
    replaceSelection(' '.repeat(settings.tabSize));
  }, [replaceSelection, settings.tabSize]);

  const handleExplain = useCallback(async () => {
    if (!onExplainCode) {
      setAiFeedback('AI explanation is unavailable.');
      return;
    }

    const target = selectedText || content;
    if (!target.trim()) {
      setAiFeedback('Select some code first.');
      return;
    }

    setIsRunning(true);
    try {
      const result = await onExplainCode(target);
      setAiFeedback(result);
    } catch (error) {
      setAiFeedback(error instanceof Error ? error.message : 'Failed to explain code.');
    } finally {
      setIsRunning(false);
    }
  }, [content, onExplainCode, selectedText]);

  const handleGenerate = useCallback(async () => {
    if (!onGenerateCode) {
      setAiFeedback('AI generation is unavailable.');
      return;
    }

    const prompt = aiPrompt.trim() || selectedText.trim();
    if (!prompt) {
      setAiFeedback('Write a prompt or select comment text first.');
      return;
    }

    setIsRunning(true);
    try {
      const result = await onGenerateCode(prompt);
      replaceSelection(result);
      setAiFeedback('Generated code inserted into the editor.');
      setAiPrompt('');
    } catch (error) {
      setAiFeedback(error instanceof Error ? error.message : 'Failed to generate code.');
    } finally {
      setIsRunning(false);
    }
  }, [aiPrompt, onGenerateCode, replaceSelection, selectedText]);

  const handleAcceptSuggestion = useCallback(() => {
    if (!aiSuggestion) {
      return;
    }

    replaceSelection(aiSuggestion);
    setAiSuggestion('');
  }, [aiSuggestion, replaceSelection]);

  const getLanguageIcon = (language?: string): React.ComponentProps<typeof Ionicons>['name'] => {
    const iconMap: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
      javascript: 'logo-javascript',
      typescript: 'code-slash',
      python: 'terminal',
      java: 'cog',
      cpp: 'code',
      html: 'code',
      css: 'brush',
      json: 'document-text',
      markdown: 'document-text',
      bash: 'terminal',
      plaintext: 'document-outline',
    };

    return iconMap[language || 'plaintext'] || 'document-outline';
  };

  if (!file) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.editorBackground }]}>
        <Ionicons name="code-slash-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No file selected</Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
          Open a file from the file explorer or create a new one
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.editorBackground }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.fileInfo}>
          <Ionicons name={getLanguageIcon(file.language)} size={20} color={theme.colors.primary} />
          <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
            {file.name}
          </Text>
          {file.language && (
            <Text style={[styles.language, { color: theme.colors.textSecondary }]}>
              {file.language}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={onSave}
          disabled={!onSave}
        >
          <Ionicons name="save" size={20} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      <View style={[styles.aiPanel, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[styles.aiPrompt, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Ask LuwiCode to generate code from a comment or prompt"
          placeholderTextColor={theme.colors.textSecondary}
          value={aiPrompt}
          onChangeText={setAiPrompt}
          editable={!readOnly}
          multiline
        />
        <View style={styles.aiActions}>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleExplain}
            disabled={isRunning || !aiSettings?.enabled}
          >
            <Text style={styles.aiButtonText}>Explain</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleGenerate}
            disabled={isRunning || !aiSettings?.enabled}
          >
            <Text style={styles.aiButtonText}>Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleAcceptSuggestion}
            disabled={!aiSuggestion}
          >
            <Text style={styles.aiButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
        {!!aiSuggestion && (
          <View style={[styles.feedbackCard, { borderColor: theme.colors.border }]}>
            <Text style={[styles.feedbackLabel, { color: theme.colors.textSecondary }]}>Autocomplete</Text>
            <Text style={[styles.feedbackText, { color: theme.colors.text }]}>{aiSuggestion}</Text>
          </View>
        )}
        {!!aiFeedback && (
          <View style={[styles.feedbackCard, { borderColor: theme.colors.border }]}>
            <Text style={[styles.feedbackLabel, { color: theme.colors.textSecondary }]}>AI result</Text>
            <Text style={[styles.feedbackText, { color: theme.colors.text }]}>{aiFeedback}</Text>
          </View>
        )}
      </View>

      <View style={styles.editorContent}>
        {settings.showLineNumbers && (
          <ScrollView
            style={[styles.lineNumbers, { backgroundColor: theme.colors.editorBackground }]}
            scrollEnabled={false}
          >
            {content.split('\n').map((_, index) => (
              <Text
                key={index}
                style={[
                  styles.lineNumber,
                  {
                    color: theme.colors.lineNumber,
                    backgroundColor: theme.colors.editorBackground,
                    fontSize: settings.fontSize,
                    lineHeight: settings.fontSize + 8,
                  },
                  index + 1 === cursorPosition.line && {
                    color: theme.colors.primary,
                    backgroundColor: theme.colors.selection,
                  },
                ]}
              >
                {String(index + 1).padStart(3, ' ')}
              </Text>
            ))}
          </ScrollView>
        )}

        <TextInput
          style={[
            styles.codeInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.editorBackground,
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize + 8,
            },
          ]}
          value={content}
          onChangeText={handleContentChange}
          onSelectionChange={handleSelectionChange}
          multiline
          editable={!readOnly}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardType={Platform.OS === 'ios' ? 'default' : 'visible-password'}
          returnKeyType="default"
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
          selectTextOnFocus={false}
          contextMenuHidden={false}
          selectionColor={theme.colors.cursor}
        />
      </View>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <Text style={[styles.cursorText, { color: theme.colors.textSecondary }]}>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={handleInsertTab}>
            <Ionicons name="return-up-back" size={18} color={theme.colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => setAiPrompt(selectedText || content)}>
            <Ionicons name="search" size={18} color={theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  language: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  saveButton: {
    padding: 8,
    borderRadius: 6,
  },
  aiPanel: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  aiPrompt: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  aiActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  feedbackLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  feedbackText: {
    fontSize: 13,
  },
  editorContent: {
    flex: 1,
    flexDirection: 'row',
  },
  lineNumbers: {
    width: 56,
    paddingTop: 8,
    paddingBottom: 8,
  },
  lineNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'right',
    paddingRight: 8,
  },
  codeInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    minHeight: '100%',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  cursorText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    padding: 6,
    marginLeft: 4,
  },
});

export default CodeEditor;
