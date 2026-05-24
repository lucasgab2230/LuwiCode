import React, { useState, useCallback, useRef } from 'react';
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
import { FileItem } from '@types/index';
import { darkTheme } from '@utils/theme';

interface CodeEditorProps {
  file: FileItem | null;
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  theme?: typeof darkTheme;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  content,
  onContentChange,
  onSave,
  theme = darkTheme,
  readOnly = false,
}) => {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const inputRef = useRef<TextInput>(null);

  const handleContentChange = useCallback((text: string) => {
    onContentChange(text);
    updateCursorPosition(text);
  }, [onContentChange]);

  const updateCursorPosition = (text: string) => {
    // This is a simplified version - in production you'd use proper selection tracking
    const lines = text.split('\n');
    setCursorPosition({
      line: lines.length,
      column: lines[lines.length - 1]?.length + 1 || 1,
    });
  };

  const handleSelectionChange = useCallback((event: any) => {
    const { selection } = event.nativeEvent;
    if (selection) {
      const textBeforeCursor = content.substring(0, selection.start);
      const lines = textBeforeCursor.split('\n');
      setCursorPosition({
        line: lines.length,
        column: lines[lines.length - 1]?.length + 1 || 1,
      });
    }
  }, [content]);

  const insertTab = () => {
    const tabSize = 2;
    const tabs = ' '.repeat(tabSize);
    const newContent = content + tabs;
    onContentChange(newContent);
  };

  const getLanguageIcon = (language?: string): string => {
    const iconMap: Record<string, string> = {
      javascript: 'logo-javascript',
      typescript: 'code-slash',
      python: 'terminal',
      java: 'coffee',
      cpp: 'cog',
      html: 'code',
      css: 'brush',
      json: 'document-text',
      markdown: 'document',
      bash: 'terminal',
      plaintext: 'document-outline',
    };
    return iconMap[language || 'plaintext'] || 'document-outline';
  };

  if (!file) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.editorBackground }]}>
        <Ionicons name="code-slash-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No file selected
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
          Open a file from the file explorer or create a new one
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.editorBackground }]}>
      {/* Editor Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.fileInfo}>
          <Ionicons 
            name={getLanguageIcon(file.language)} 
            size={20} 
            color={theme.colors.primary} 
          />
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

      {/* Line Numbers and Code Area */}
      <View style={styles.editorContent}>
        {/* Line Numbers */}
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

        {/* Code Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.codeInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.editorBackground,
              caretColor: theme.colors.cursor,
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
        />
      </View>

      {/* Editor Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={styles.cursorInfo}>
          <Text style={[styles.cursorText, { color: theme.colors.textSecondary }]}>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={insertTab}>
            <Ionicons name="indent" size={18} color={theme.colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.action} 
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="keyboard" size={18} color={theme.colors.secondary} />
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
  editorContent: {
    flex: 1,
    flexDirection: 'row',
  },
  lineNumbers: {
    width: 50,
    paddingTop: 8,
    paddingBottom: 8,
  },
  lineNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    textAlign: 'right',
    paddingRight: 8,
    height: 20,
    lineHeight: 20,
  },
  codeInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
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
  cursorInfo: {
    flexDirection: 'row',
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
