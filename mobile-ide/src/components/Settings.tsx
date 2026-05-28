import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme, lightTheme } from '@utils/theme';
import { termuxService } from '@utils/termuxService';

interface SettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: (isDark: boolean) => void;
  onResetSettings?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onResetSettings,
}) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [termuxEnabled, setTermuxEnabled] = useState(false);

  const handleCheckTermux = useCallback(async () => {
    const available = await termuxService.checkTermuxAvailability();
    if (available) {
      Alert.alert('Termux Status', 'Termux is available and connected!');
      setTermuxEnabled(true);
    } else {
      Alert.alert(
        'Termux Not Found',
        'Termux is not installed or not accessible. Please install Termux from F-Droid and grant necessary permissions.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    const granted = await termuxService.requestStoragePermission();
    if (granted) {
      Alert.alert('Success', 'Storage permission granted!');
    } else {
      Alert.alert('Error', 'Failed to request storage permission.');
    }
  }, []);

  const SettingItem: React.FC<{
    icon: string;
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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* App Info */}
      <View style={[styles.appInfo, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.appIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="code-slash" size={32} color={theme.colors.background} />
        </View>
        <Text style={[styles.appName, { color: theme.colors.text }]}>Mobile IDE</Text>
        <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Appearance */}
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
        description={`Current: ${fontSize}px`}
        rightElement={
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => setFontSize(Math.max(10, fontSize - 1))}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.sizeValue, { color: theme.colors.text }]}>{fontSize}</Text>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => setFontSize(Math.min(24, fontSize + 1))}
            >
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Editor */}
      <SectionHeader title="Editor" />
      <SettingItem
        icon="swap-horizontal"
        title="Tab Size"
        description={`Current: ${tabSize} spaces`}
        rightElement={
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => setTabSize(Math.max(2, tabSize - 1))}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.sizeValue, { color: theme.colors.text }]}>{tabSize}</Text>
            <TouchableOpacity
              style={[styles.sizeButton, { backgroundColor: theme.colors.border }]}
              onPress={() => setTabSize(Math.min(8, tabSize + 1))}
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
            value={autoSave}
            onValueChange={setAutoSave}
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
            value={showLineNumbers}
            onValueChange={setShowLineNumbers}
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
            value={wordWrap}
            onValueChange={setWordWrap}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        }
      />

      {/* Termux Integration */}
      <SectionHeader title="Termux Integration" />
      <SettingItem
        icon="terminal"
        title="Check Termux"
        description="Verify Termux installation and connection"
        onPress={handleCheckTermux}
        rightElement={
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        }
      />

      <SettingItem
        icon="folder-open"
        title="Storage Permission"
        description="Grant access to device storage"
        onPress={handleRequestPermissions}
        rightElement={
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        }
      />

      <SettingItem
        icon="cloud-download"
        title="Install Termux API"
        description="Open instructions for installing termux-api package"
        onPress={() => {
          Alert.alert(
            'Install Termux API',
            'Run this command in Termux:\n\npkg install termux-api\n\nThen grant permissions in Android settings.',
            [{ text: 'OK' }]
          );
        }}
        rightElement={
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        }
      />

      {/* About */}
      <SectionHeader title="About" />
      <SettingItem
        icon="information-circle"
        title="Documentation"
        description="Learn how to use Mobile IDE"
        rightElement={
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        }
      />

      <SettingItem
        icon="bug"
        title="Report Issue"
        description="Submit a bug report or feature request"
        rightElement={
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        }
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
  fontSizeControls: {
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
