import { Platform } from 'react-native';

import { TerminalLine, TermuxCommand, GitState } from '@app-types/index';

class TermuxService {
  private isTermuxAvailable = false;
  private isGitAvailable = false;
  private termuxPrefix = '/data/data/com.termux/files/home';

  async refreshEnvironment(): Promise<GitState> {
    const isTermuxAvailable = await this.checkTermuxAvailability();
    const isGitAvailable = await this.checkGitAvailability();

    return {
      isTermuxAvailable,
      isGitAvailable,
      statusMessage: this.getStatusMessage(isTermuxAvailable, isGitAvailable),
      lastCheckedAt: Date.now(),
    };
  }

  async checkTermuxAvailability(): Promise<boolean> {
    this.isTermuxAvailable = Platform.OS === 'android';
    return this.isTermuxAvailable;
  }

  async checkGitAvailability(): Promise<boolean> {
    if (!this.isTermuxAvailable) {
      this.isGitAvailable = false;
      return false;
    }

    const gitVersion = await this.executeGitCommand(['--version']);
    this.isGitAvailable = !gitVersion.some(line => line.type === 'error' || line.content.toLowerCase().includes('command not found'));
    return this.isGitAvailable;
  }

  async executeCommand(command: TermuxCommand): Promise<TerminalLine[]> {
    if (!this.isTermuxAvailable) {
      return this.simulateCommandExecution(command);
    }

    return this.simulateTermuxIntent(command);
  }

  async executeGitCommand(args: string[], cwd?: string): Promise<TerminalLine[]> {
    return this.executeCommand({
      command: 'git',
      args,
      cwd,
    });
  }

  async executeGitStatus(cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['status', '--short', '--branch'], cwd);
  }

  async executeGitAdd(cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['add', '.'], cwd);
  }

  async executeGitCommit(message: string, cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['commit', '-m', message], cwd);
  }

  async executeGitPull(cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['pull'], cwd);
  }

  async executeGitPush(cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['push'], cwd);
  }

  async executeGitBranches(cwd?: string): Promise<TerminalLine[]> {
    return this.executeGitCommand(['branch', '-a'], cwd);
  }

  getStatusMessage(isTermuxAvailable: boolean, isGitAvailable: boolean): string {
    if (!isTermuxAvailable) {
      return 'Termux unavailable. Git actions are disabled.';
    }

    if (!isGitAvailable) {
      return 'Termux detected. Git package not available.';
    }

    return 'Termux and Git are available.';
  }

  private async simulateTermuxIntent(command: TermuxCommand): Promise<TerminalLine[]> {
    const { command: cmd, args = [] } = command;
    const fullCommand = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd;

    return [{
      id: `${Date.now()}-output`,
      type: 'output',
      content: `Executed in Termux: ${fullCommand}\nOpen Termux to view the live output.`,
      timestamp: Date.now(),
    }];
  }

  private simulateCommandExecution(command: TermuxCommand): TerminalLine[] {
    const { command: cmd, args = [] } = command;
    const output: TerminalLine[] = [];

    const simulatedCommands: Record<string, (commandArgs: string[]) => string> = {
      help: () => `Available commands:
  help     - Show this help message
  ls       - List directory contents
  pwd      - Print working directory
  cd       - Change directory
  cat      - Display file contents
  echo     - Print text
  mkdir    - Create directory
  touch    - Create empty file
  rm       - Remove files/directories
  clear    - Clear terminal
  pkg      - Package manager
  git      - Git command helper
  termux-info - Show system information`,
      ls: () => `app.config.ts  babel.config.js  node_modules/  package.json  src/  tsconfig.json`,
      pwd: () => this.termuxPrefix,
      cd: commandArgs => `Changed to directory: ${commandArgs[0] || '~'}`,
      cat: commandArgs => commandArgs[0]
        ? `Contents of ${commandArgs[0]}:\n// File content would appear here`
        : 'Usage: cat <filename>',
      echo: commandArgs => commandArgs.join(' '),
      mkdir: commandArgs => `Created directory: ${commandArgs[0] || 'unnamed'}`,
      touch: commandArgs => `Created file: ${commandArgs[0] || 'unnamed'}`,
      rm: commandArgs => `Removed: ${commandArgs.join(', ')}`,
      clear: () => '',
      pkg: commandArgs => {
        if (commandArgs[0] === 'install') {
          return `Installing ${commandArgs.slice(1).join(' ')}...\nPackage installation is simulated in Expo.`;
        }

        return 'Usage: pkg install <package> | pkg update | pkg remove <package>';
      },
      git: commandArgs => this.simulateGitCommand(commandArgs),
      'termux-info': () => `Termux Environment:
  Version: 0.118.0
  Architecture: arm64-v8a
  Prefix: ${this.termuxPrefix}
  Home: ${this.termuxPrefix}
  TMPDIR: /data/data/com.termux/files/usr/tmp`,
    };

    const handler = simulatedCommands[cmd];
    if (handler) {
      const result = handler(args);
      if (result) {
        output.push({
          id: `${Date.now()}-output`,
          type: 'output',
          content: result,
          timestamp: Date.now(),
        });
      }
    } else {
      output.push({
        id: `${Date.now()}-error`,
        type: 'error',
        content: `Command not found: ${cmd}\nType 'help' for available commands.`,
        timestamp: Date.now(),
      });
    }

    return output;
  }

  private simulateGitCommand(args: string[]): string {
    const [subCommand, ...rest] = args;
    const message = rest.join(' ').replace(/^-m\s*/, '').trim();

    switch (subCommand) {
      case '--version':
        return 'git version 2.43.0';
      case 'status':
        return 'On branch main\nYour branch is up to date with "origin/main".\n\nnothing to commit, working tree clean';
      case 'add':
        return 'Staged all tracked changes.';
      case 'commit':
        return `Created commit${message ? `: ${message}` : ''}`;
      case 'pull':
        return 'Already up to date.';
      case 'push':
        return 'Pushed to origin main.';
      case 'branch':
        return `* main\n  feature/mobile-ide\n  remotes/origin/main`;
      default:
        return `git ${args.join(' ')}`;
    }
  }

  getStoragePaths(): Record<string, string> {
    return {
      home: this.termuxPrefix,
      downloads: '/storage/emulated/0/Download',
      documents: '/storage/emulated/0/Documents',
      shared: '/storage/emulated/0',
      usr: '/data/data/com.termux/files/usr',
    };
  }

  async requestStoragePermission(): Promise<boolean> {
    return true;
  }

  async openInEditor(filePath: string, editor?: string): Promise<void> {
    const targetEditor = editor || 'nano';
    await this.executeCommand({
      command: targetEditor,
      args: [filePath],
    });
  }

  async runScript(filePath: string, interpreter?: string): Promise<TerminalLine[]> {
    const defaultInterpreters: Record<string, string> = {
      '.js': 'node',
      '.ts': 'ts-node',
      '.py': 'python',
      '.sh': 'bash',
      '.rb': 'ruby',
      '.php': 'php',
    };

    const ext = filePath.split('.').pop();
    const cmd = interpreter || (ext ? defaultInterpreters[`.${ext}`] : 'cat');

    if (!cmd) {
      return [{
        id: `${Date.now()}-error`,
        type: 'error',
        content: 'No interpreter specified and could not determine from file extension',
        timestamp: Date.now(),
      }];
    }

    return this.executeCommand({
      command: cmd,
      args: [filePath],
    });
  }

  async installPackage(packageName: string): Promise<TerminalLine[]> {
    return this.executeCommand({
      command: 'pkg',
      args: ['install', packageName, '-y'],
    });
  }

  async updatePackages(): Promise<TerminalLine[]> {
    return this.executeCommand({
      command: 'pkg',
      args: ['update', '-y'],
    });
  }

  async getEnvironmentInfo(): Promise<TerminalLine[]> {
    return this.executeCommand({
      command: 'termux-info',
    });
  }
}

export const termuxService = new TermuxService();
export default termuxService;
