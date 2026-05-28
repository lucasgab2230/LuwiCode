# Mobile IDE - Code Editor for Android with Termux Integration

A powerful code editor IDE built with React Native + Expo and TypeScript, designed specifically for Android smartphones with Termux integration.

## Features

### 📝 Code Editor
- Syntax highlighting support for multiple languages (JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, Markdown, Bash, etc.)
- Line numbers display
- Cursor position tracking (line and column)
- Auto-save functionality
- Customizable font size and tab size
- Word wrap option
- Dark/Light theme support

### 💻 Terminal with Termux Integration
- Integrated terminal emulator
- Simulated command execution for common commands (ls, pwd, cd, cat, echo, mkdir, touch, rm, clear, pkg, termux-info)
- Real Termux integration via Intent URL schemes
- Support for Termux:API package
- Quick action buttons for common commands
- Command history
- Storage permission management

### 📁 File Explorer
- Browse and manage files
- Create new files and directories
- Delete files
- Import files from device storage
- File type icons based on language
- Long-press for file operations

### ⚙️ Settings
- Toggle dark/light mode
- Adjust font size (10-24px)
- Configure tab size (2-8 spaces)
- Enable/disable auto-save
- Show/hide line numbers
- Toggle word wrap
- Termux integration settings
  - Check Termux availability
  - Request storage permissions
  - Install Termux API instructions

## Project Structure

```
mobile-ide/
├── App.tsx                 # Main application entry point
├── app.config.ts           # Expo configuration
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── src/
    ├── components/
    │   ├── CodeEditor.tsx  # Code editor component
    │   ├── Terminal.tsx    # Terminal component
    │   ├── FileExplorer.tsx # File browser component
    │   └── Settings.tsx    # Settings screen component
    ├── types/
    │   └── index.ts        # TypeScript type definitions
    ├── utils/
    │   ├── theme.ts        # Theme configurations
    │   ├── helpers.ts      # Utility functions
    │   └── termuxService.ts # Termux integration service
    ├── hooks/              # Custom React hooks
    ├── screens/            # Screen components
    └── assets/             # Images and static assets
```

## Prerequisites

To use this project, you need:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (`npm install -g expo-cli`)
4. **Expo Go** app on your Android device (for development)

### For Full Termux Integration:

1. **Termux** - Install from [F-Droid](https://f-droid.org/en/packages/com.termux/) (recommended) or Google Play
2. **Termux:API** - Install inside Termux:
   ```bash
   pkg install termux-api
   ```
3. **Termux:API App** - Install the companion app from F-Droid or Google Play

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd mobile-ide
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   expo start
   ```

4. Run on Android:
   - Press `a` in the terminal to run on Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run typecheck` - Run TypeScript type checking

## Termux Commands Supported

The terminal supports these commands (simulated or via real Termux):

- `help` - Show available commands
- `ls` - List directory contents
- `pwd` - Print working directory
- `cd` - Change directory
- `cat` - Display file contents
- `echo` - Print text
- `mkdir` - Create directory
- `touch` - Create empty file
- `rm` - Remove files/directories
- `clear` - Clear terminal
- `pkg install <package>` - Install packages
- `pkg update` - Update packages
- `termux-info` - Show system information

## Building for Production

To build a standalone Android APK:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Build the APK:
   ```bash
   eas build --platform android --profile preview
   ```

4. Or build for production:
   ```bash
   eas build --platform android --profile production
   ```

## Customization

### Adding New Languages

Edit `src/utils/helpers.ts` and add new language mappings in the `detectLanguage` function:

```typescript
const languageMap: Record<string, string> = {
  // ... existing mappings
  'rs': 'rust',
  'go': 'go',
  // Add new extensions here
};
```

### Custom Themes

Edit `src/utils/theme.ts` to create custom color schemes:

```typescript
export const customTheme: Theme = {
  dark: true,
  colors: {
    // Define your custom colors
  },
};
```

## Limitations & Notes

1. **File System Access**: Due to Android security restrictions, direct file system access requires additional native modules or the Storage Access Framework.

2. **Termux Integration**: Full Termux integration requires:
   - Termux app installed
   - Termux:API package installed
   - Proper permissions granted
   - The app uses Intent URL schemes to communicate with Termux

3. **Syntax Highlighting**: The current implementation provides basic syntax highlighting. For advanced highlighting, consider integrating libraries like `react-native-syntax-highlighter`.

4. **Code Execution**: Running code directly within the app requires additional setup with interpreters installed via Termux.

## Future Enhancements

- [ ] Real-time syntax highlighting with Prism.js or similar
- [ ] Git integration
- [ ] Multiple terminal tabs
- [ ] FTP/SFTP support
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Plugin system
- [ ] Advanced search and replace
- [ ] Code completion and IntelliSense
- [ ] Integrated debugger
- [ ] Project management features

## License

MIT License - Feel free to use and modify for your projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please open an issue on the repository.

---

**Built with ❤️ using React Native + Expo + TypeScript**
