import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AISettings, EditorSettings, GitState, IoniconName } from '@app-types/index';
import { darkTheme, lightTheme } from '@utils/theme';

interface SettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: (isDark: boolean) => void;
  onResetSettings?: () => void;
  editorSettings: EditorSettings;
  onEditorSettingsChange: (settings: EditorSettings) => void;
  aiSettings: AISettings;
  onAiSettingsChange: (settings: AISettings) => void;
  onTestAiConnection: () => Promise<void>;
  aiStatusMessage: string;
  gitState: GitState;
  onRefreshEnvironment: () => Promise<void>;
  onGitAction: (action: 'status' | 'add' | 'commit' | 'pull' | 'push' | 'branches', message?: string) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onResetSettings,
  editorSettings,
  onEditorSettingsChange,
  aiSettings,
  onAiSettingsChange,
  onTestAiConnection,
  aiStatusMessage,
  gitState,
  onRefreshEnvironment,
  onGitAction,
}) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [commitMessage, setCommitMessage] = useState('Update from LuwiCode');

  const updateEditorSettings = useCallback((patch: Partial<EditorSettings>) => {
    onEditorSettingsChange({
      ...editorSettings,
      ...patch,
    });
  }, [editorSettings, onEditorSettingsChange]);

  const updateAiSettings = useCallback((patch: Partial<AISettings>) => {
    onAiSettingsChange({
      ...aiSettings,
      ...patch,
    });
  }, [aiSettings, onAiSettingsChange]);

  const SettingItem: React.FC<{
    icon: IoniconName;
    title: string;
    description?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
  }> = ({ icon, title, description, rightElement, onPress }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
  );

  const gitDisabled = !gitState.isGitAvailable;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.appInfo, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.appIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="code-slash" size={32} color={theme.colors.background} />
        </View>
        <Text style={[styles.appName, { color: theme.colors.text }]}>LuwiCode</Text>
        <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          {gitState.statusMessage}
        </Text>
      </View>

      <SectionHeader title="Appearance" />
      <SettingItem
        icon="moon"
        title="Dark Mode"
        description="Use dark theme for the editor"
        rightElement={
          <Switch
            value={isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        }
      />

      <SettingItem
        icon="text"
        title="Font Size"
        description={`Current: ${editorSettings.fontSize}px`}
        rightElement={
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => updateEditorSettings({ fontSize: Math.max(10, editorSettings.fontSize - 1) })}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.sizeValue, { color: theme.colors.text }]}>{editorSettings.fontSize}</Text>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => updateEditorSettings({ fontSize: Math.min(24, editorSettings.fontSize + 1) })}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <SectionHeader title="Editor" />
      <SettingItem
        icon="swap-horizontal"
        title="Tab Size"
        description={`Current: ${editorSettings.tabSize} spaces`}
        rightElement={
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => updateEditorSettings({ tabSize: Math.max(2, editorSettings.tabSize - 1) })}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.sizeValue, { color: theme.colors.text }]}>{editorSettings.tabSize}</Text>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => updateEditorSettings({ tabSize: Math.min(8, editorSettings.tabSize + 1) })}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <SettingItem
        icon="save"
        title="Auto Save"
        description="Automatically save files when editing"
        rightElement={
          <Switch
            value={editorSettings.autoSave}
            onValueChange={(value) => updateEditorSettings({ autoSave: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        }
      />

      <SettingItem
        icon="list"
        title="Line Numbers"
        description="Show line numbers in editor"
        rightElement={
          <Switch
            value={editorSettings.showLineNumbers}
            onValueChange={(value) => updateEditorSettings({ showLineNumbers: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        }
      />

      <SettingItem
        icon="return-up-back"
        title="Word Wrap"
        description="Wrap long lines in editor"
        rightElement={
          <Switch
            value={editorSettings.wordWrap}
            onValueChange={(value) => updateEditorSettings({ wordWrap: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        }
      />

      <SectionHeader title="AI Assistant" />
      <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.panelLabel, { color: theme.colors.textSecondary }]}>Endpoint</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={aiSettings.endpoint}
          onChangeText={(value) => updateAiSettings({ endpoint: value })}
          placeholder="https://api.openai.com/v1"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.panelLabel, { color: theme.colors.textSecondary }]}>API Key</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={aiSettings.apiKey}
          onChangeText={(value) => updateAiSettings({ apiKey: value })}
          placeholder="sk-..."
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Text style={[styles.panelLabel, { color: theme.colors.textSecondary }]}>Model</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={aiSettings.model}
          onChangeText={(value) => updateAiSettings({ model: value })}
          placeholder="gpt-4o-mini"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.panelRow}>
          <Text style={[styles.panelLabel, { color: theme.colors.textSecondary }]}>AI Enabled</Text>
          <Switch
            value={aiSettings.enabled}
            onValueChange={(value) => updateAiSettings({ enabled: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        </View>

        <View style={styles.panelRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={onTestAiConnection}
          >
            <Text style={styles.actionButtonText}>Test Connection</Text>
          </TouchableOpacity>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {aiStatusMessage || 'Settings are stored locally on the device.'}
          </Text>
        </View>
      </View>

      <SectionHeader title="Termux & Git" />
      <SettingItem
        icon="terminal"
        title="Refresh Environment"
        description="Check Termux and Git availability"
        onPress={onRefreshEnvironment}
        rightElement={<Ionicons name="refresh-outline" size={24} color={theme.colors.textSecondary} />}
      />
      <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Termux: {gitState.isTermuxAvailable ? 'Available' : 'Unavailable'}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          Git: {gitState.isGitAvailable ? 'Available' : 'Unavailable'}
        </Text>
        <View style={styles.gitGrid}>
          <TouchableOpacity
            style={[styles.gitButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.primary }]}
            onPress={() => onGitAction('status')}
            disabled={gitDisabled}
          >
            <Text style={styles.actionButtonText}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gitButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.primary }]}
            onPress={() => onGitAction('add')}
            disabled={gitDisabled}
          >
            <Text style={styles.actionButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gitButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.primary }]}
            onPress={() => onGitAction('pull')}
            disabled={gitDisabled}
          >
            <Text style={styles.actionButtonText}>Pull</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gitButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.primary }]}
            onPress={() => onGitAction('push')}
            disabled={gitDisabled}
          >
            <Text style={styles.actionButtonText}>Push</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gitButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.primary }]}
            onPress={() => onGitAction('branches')}
            disabled={gitDisabled}
          >
            <Text style={styles.actionButtonText}>Branches</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={commitMessage}
          onChangeText={setCommitMessage}
          placeholder="Commit message"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity
          style={[styles.actionButton, gitDisabled && styles.gitButtonDisabled, { backgroundColor: theme.colors.secondary }]}
          onPress={() => onGitAction('commit', commitMessage)}
          disabled={gitDisabled}
        >
          <Text style={styles.actionButtonText}>Commit</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader title="About" />
      <SettingItem
        icon="information-circle"
        title="Documentation"
        description="Learn how to use LuwiCode"
        rightElement={<Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />}
      />

      <SettingItem
        icon="bug"
        title="Report Issue"
        description="Submit a bug report or feature request"
        rightElement={<Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />}
      />

      {onResetSettings && (
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.colors.error }]}
          onPress={() => {
            Alert.alert(
              'Reset Settings',
              'Are you sure you want to reset all settings?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: onResetSettings },
              ]
            );
          }}
        >
          <Text style={styles.resetButtonText}>Reset All Settings</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.footer, { color: theme.colors.textSecondary }]}>
        Built with React Native + Expo
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  panelLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  gitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  gitButton: {
    minWidth: 88,
    alignItems: 'center',
  },
  gitButtonDisabled: {
    opacity: 0.45,
  },
  resetButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 16,
  },
});

export default Settings;
