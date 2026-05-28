import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileItem } from '@types/index';
import { darkTheme } from '@utils/theme';
import { createFileItem } from '@utils/helpers';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileCreate?: (name: string, type: 'file' | 'directory') => void;
  onFileDelete?: (file: FileItem) => void;
  theme?: typeof darkTheme;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  theme = darkTheme,
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleFilePress = useCallback((file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleCreateFile = useCallback(() => {
    if (!newFileName.trim()) {
      Alert.alert('Error', 'Please enter a file name');
      return;
    }

    const isDirectory = newFileName.endsWith('/');
    const name = isDirectory ? newFileName.slice(0, -1) : newFileName;
    
    onFileCreate?.(name, isDirectory ? 'directory' : 'file');
    setNewFileName('');
    setShowNewFileModal(false);
  }, [newFileName, onFileCreate]);

  const handleDeleteFile = useCallback((file: FileItem) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onFileDelete?.(file)
        },
      ]
    );
  }, [onFileDelete]);

  const getFileIcon = (file: FileItem): string => {
    if (file.type === 'directory') {
      return 'folder';
    }

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

    return iconMap[file.language || 'plaintext'] || 'document-outline';
  };

  const renderFileItem = useCallback(({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[
        styles.fileItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      onPress={() => handleFilePress(item)}
      onLongPress={() => item.type === 'file' && handleDeleteFile(item)}
    >
      <View style={styles.fileInfo}>
        <Ionicons
          name={getFileIcon(item)}
          size={24}
          color={item.type === 'directory' ? theme.colors.warning : theme.colors.primary}
        />
        <View style={styles.fileDetails}>
          <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.language && (
            <Text style={[styles.fileLanguage, { color: theme.colors.textSecondary }]}>
              {item.language}
            </Text>
          )}
        </View>
      </View>
      {item.type === 'file' && (
        <TouchableOpacity
          onPress={() => handleDeleteFile(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  ), [handleFilePress, handleDeleteFile, theme]);

  const keyExtractor = useCallback((item: FileItem) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.pathContainer}>
          <Ionicons name="folder-open" size={20} color={theme.colors.primary} />
          <Text style={[styles.pathText, { color: theme.colors.text }]} numberOfLines={1}>
            {currentPath}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowNewFileModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* File List */}
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No files yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Create a new file to get started
            </Text>
          </View>
        }
      />

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="document-text-outline" size={24} color={theme.colors.secondary} />
          <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>
            New File
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="folder-outline" size={24} color={theme.colors.secondary} />
          <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>
            New Folder
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="upload-outline" size={24} color={theme.colors.secondary} />
          <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>
            Import
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="refresh-outline" size={24} color={theme.colors.secondary} />
          <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pathText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createButton: {
    padding: 8,
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
  },
  fileLanguage: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default FileExplorer;
