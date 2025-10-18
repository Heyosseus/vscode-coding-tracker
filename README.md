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
