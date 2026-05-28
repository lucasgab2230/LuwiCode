import { TermuxCommand, TerminalLine } from '@types/index';

/**
 * Termux Integration Service
 * 
 * This service provides integration with Termux on Android devices.
 * It uses the Termux:API app to execute commands and interact with the system.
 * 
 * Requirements:
 * 1. Install Termux from F-Droid (recommended) or Google Play
 * 2. Install termux-api package: pkg install termux-api
 * 3. Grant necessary permissions via Android settings
 * 
 * Note: Direct Termux integration requires native modules or URL schemes.
 * This implementation uses a simulated terminal for demonstration and
 * provides hooks for actual Termux API integration.
 */

class TermuxService {
  private isTermuxAvailable: boolean = false;
  private termuxPrefix: string = '/data/data/com.termux/files/home';
  
  constructor() {
    this.checkTermuxAvailability();
  }

  /**
   * Check if Termux is available on the device
   */
  async checkTermuxAvailability(): Promise<boolean> {
    try {
      // Check if we're running in an environment that can access Termux
      // This is a simplified check - real implementation would use native modules
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      
      // For React Native, we'd check for Termux-specific APIs
      this.isTermuxAvailable = false; // Set to true when running on Android with Termux
      
      return this.isTermuxAvailable;
    } catch (error) {
      console.error('Error checking Termux availability:', error);
      this.isTermuxAvailable = false;
      return false;
    }
  }

  /**
   * Execute a command through Termux
   */
  async executeCommand(command: TermuxCommand): Promise<TerminalLine[]> {
    const output: TerminalLine[] = [];
    
    if (!this.isTermuxAvailable) {
      // Simulated command execution for development/demo
      return this.simulateCommandExecution(command);
    }

    try {
      // Real Termux integration would use:
      // 1. Intent URLs to launch Termux commands
      // 2. Native modules for direct API access
      // 3. Termux:API package for extended functionality
      
      const result = await this.executeViaIntent(command);
      output.push({
        id: `${Date.now()}-output`,
        type: 'output',
        content: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      output.push({
        id: `${Date.now()}-error`,
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
    }

    return output;
  }

  /**
   * Execute command via Termux Intent URL scheme
   */
  private async executeViaIntent(command: TermuxCommand): Promise<string> {
    const { command: cmd, args = [], cwd, env = {} } = command;
    
    // Build the full command
    const fullCommand = args.length > 0 
      ? `${cmd} ${args.join(' ')}` 
      : cmd;

    // Termux intent URL scheme
    // This opens Termux and executes the command
    const intentUrl = `intent://run-command?command=${encodeURIComponent(fullCommand)}#Intent;scheme=termux;package=com.termux;end`;
    
    // In a real implementation, you would use Linking.openURL(intentUrl)
    // For now, we'll simulate the response
    console.log('Would execute via Termux:', intentUrl);
    
    return `Executed: ${fullCommand}\n(Check Termux app for output)`;
  }

  /**
   * Simulate command execution for development
   */
  private simulateCommandExecution(command: TermuxCommand): TerminalLine[] {
    const { command: cmd, args = [] } = command;
    const output: TerminalLine[] = [];
    
    const simulatedCommands: Record<string, (args: string[]) => string> = {
      'help': () => `Available commands:
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
  pkg      - Package manager (pkg install/update/remove)
  termux-info - Show system information`,
      
      'ls': () => `app.config.ts  babel.config.js  node_modules/  package.json  src/  tsconfig.json`,
      
      'pwd': () => this.termuxPrefix,
      
      'cd': (args) => {
        if (args[0] === '..') {
          return 'Changed to parent directory';
        }
        return `Changed to directory: ${args[0] || '~'}`;
      },
      
      'cat': (args) => {
        if (!args[0]) return 'Usage: cat <filename>';
        return `Contents of ${args[0]}:\n// File content would appear here`;
      },
      
      'echo': (args) => args.join(' '),
      
      'mkdir': (args) => `Created directory: ${args[0] || 'unnamed'}`,
      
      'touch': (args) => `Created file: ${args[0] || 'unnamed'}`,
      
      'rm': (args) => `Removed: ${args.join(', ')}`,
      
      'clear': () => '',
      
      'pkg': (args) => {
        if (args[0] === 'install') {
          return `Installing ${args.slice(1).join(' ')}...\n(Package installation would occur in Termux)`;
        }
        return 'Usage: pkg install <package> | pkg update | pkg remove <package>';
      },
      
      'termux-info': () => `Termux Environment:
  Version: 0.118.0
  Android SDK: 34
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

  /**
   * Get Termux storage paths
   */
  getStoragePaths(): Record<string, string> {
    return {
      home: this.termuxPrefix,
      downloads: '/storage/emulated/0/Download',
      documents: '/storage/emulated/0/Documents',
      shared: '/storage/emulated/0',
      usr: '/data/data/com.termux/files/usr',
    };
  }

  /**
   * Request storage permission via Termux
   */
  async requestStoragePermission(): Promise<boolean> {
    if (!this.isTermuxAvailable) {
      // Simulate permission granted
      return true;
    }

    try {
      // Use termux-setup-storage command
      await this.executeCommand({
        command: 'termux-setup-storage',
      });
      return true;
    } catch (error) {
      console.error('Failed to request storage permission:', error);
      return false;
    }
  }

  /**
   * Open file in external editor via Termux
   */
  async openInEditor(filePath: string, editor?: string): Promise<void> {
    const targetEditor = editor || 'nano';
    
    if (!this.isTermuxAvailable) {
      console.log(`Would open ${filePath} in ${targetEditor}`);
      return;
    }

    await this.executeCommand({
      command: targetEditor,
      args: [filePath],
    });
  }

  /**
   * Run a script file
   */
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

    return await this.executeCommand({
      command: cmd,
      args: [filePath],
    });
  }

  /**
   * Install packages in Termux
   */
  async installPackage(packageName: string): Promise<TerminalLine[]> {
    return await this.executeCommand({
      command: 'pkg',
      args: ['install', packageName, '-y'],
    });
  }

  /**
   * Update Termux packages
   */
  async updatePackages(): Promise<TerminalLine[]> {
    return await this.executeCommand({
      command: 'pkg',
      args: ['update', '-y'],
    });
  }

  /**
   * Get current Termux environment info
   */
  async getEnvironmentInfo(): Promise<TerminalLine[]> {
    return await this.executeCommand({
      command: 'termux-info',
    });
  }
}

// Export singleton instance
export const termuxService = new TermuxService();
export default termuxService;
