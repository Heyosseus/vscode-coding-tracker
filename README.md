# vscode-coding-tracker README

This is the README for your extension "vscode-coding-tracker". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

# VS Code Coding Tracker

A VS Code extension that tracks your coding session time and syncs with a remote API.

## Features

- **Real-time tracking**: Automatically tracks your coding time while you work
- **Status bar indicator**: Shows current session time in the status bar
- **Idle detection**: Pauses tracking when you're away from the editor
- **Batch synchronization**: Sends data to your API in configurable batches
- **Offline support**: Stores data locally when API is unavailable
- **Statistics**: View your coding statistics and manage local data

## Configuration

### Quick Start

1. **Set up Laravel Backend** (see `laravel-backend-setup.md` for detailed instructions):

   ```bash
   # In your Laravel project
   composer require laravel/sanctum
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   php artisan migrate

   # Create user and generate token
   php artisan tinker
   # In tinker: User::create(['name' => 'Your Name', 'email' => 'your@email.com', 'password' => bcrypt('password')])
   php artisan token:generate your@email.com
   ```

2. **Configure VS Code Extension**:
   - Open VS Code Settings (Ctrl+, / Cmd+,)
   - Search for "Coding Tracker"
   - Set your API URL and API key

### Detailed Settings

To configure the extension, go to VS Code Settings and search for "Coding Tracker":

### Required Settings

- **API URL** (`codingTracker.apiUrl`): The endpoint URL to send coding session data
- **API Key** (`codingTracker.apiKey`): Your authentication token for the API

### Optional Settings

- **Idle Minutes** (`codingTracker.idleMinutes`): Minutes of inactivity before considering user idle (default: 5)
- **Batch Seconds** (`codingTracker.batchSeconds`): Seconds to accumulate before sending a batch (default: 300)

## Commands

Access these commands via the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **Coding Tracker: Show Statistics** - Display your coding time statistics
- **Coding Tracker: Reset Local Statistics** - Clear all local tracking data
- **Coding Tracker: Open Settings** - Quick access to extension settings

## API Format

The extension sends POST requests to your configured API URL with the following JSON structure:

```json
{
  "sessions": [
    {
      "started_at": "2023-10-18T10:30:00.000Z",
      "duration_seconds": 300,
      "project": "my-project",
      "file": "/path/to/current/file.js"
    }
  ]
}
```

Your API should accept this format and respond with a 2xx status code for successful processing.

## How It Works

1. **Activity Detection**: The extension monitors file changes, saves, editor focus, and window focus
2. **Time Accumulation**: Active time is accumulated in 60-second intervals
3. **Batch Creation**: When the batch threshold is reached or user becomes idle, a session is created
4. **API Synchronization**: Sessions are sent to your configured API endpoint
5. **Persistence**: Failed uploads are stored locally and retried on subsequent heartbeats

## Privacy

- All data is stored locally until successfully synced with your API
- No data is sent to any third-party services
- You have full control over your API endpoint and data handling

## Development

To contribute or modify this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open in VS Code and press F5 to launch Extension Development Host
4. Make changes and test in the development environment

## License

This extension is provided as-is for educational and personal use.

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
