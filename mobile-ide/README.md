# LuwiCode

LuwiCode is a mobile IDE for Android built with React Native, Expo, and TypeScript.

## Highlights

- Code editor with line numbers, cursor tracking, tab insertion, and word wrap
- Terminal with command history, simulated output streaming, and Termux fallback handling
- File explorer with create/delete support
- Secure local AI settings for OpenAI-compatible endpoints
- AI actions for explain, generate, and autocomplete
- Git actions through the Termux workflow: status, add, commit, pull, push, and branches
- Persistent local storage for files, editor settings, and AI configuration

## AI Setup

1. Open **Settings**
2. Enable **AI**
3. Enter your OpenAI-compatible endpoint
4. Paste your API key
5. Select a model and test the connection

## Git / Termux

Git actions are enabled when the app detects an Android/Termux-capable environment. Outside that environment, the UI falls back to safe simulated behavior.

## Development

```bash
npm install
npm run typecheck
npm start
```
