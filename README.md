# Laravel Coding Time Tracker

A VS Code extension that tracks your coding session time and syncs with your Laravel application backend. Monitor your productivity, track project time, and gain insights into your coding habits with seamless Laravel integration.

## ✨ Features

- **🕒 Real-time tracking**: Automatically tracks your coding time while you work
- **📊 Status bar indicator**: Shows current session time in the VS Code status bar
- **⏸️ Smart idle detection**: Pauses tracking when you're away from the editor
- **📦 Batch synchronization**: Efficiently sends data to your Laravel API in configurable batches
- **🔄 Offline support**: Stores data locally when your API is unavailable and syncs when reconnected
- **📈 Built-in statistics**: View your coding statistics and manage local data
- **🔐 Laravel Sanctum integration**: Secure authentication with Laravel Sanctum tokens
- **🎯 Project & file tracking**: Automatically detects project name and current file

## 🚀 Laravel Integration Setup

Follow this step-by-step guide to integrate the VS Code extension with your Laravel application.

### Step 1: Install and Configure Laravel Sanctum

```bash
# Navigate to your Laravel project
cd /path/to/your-laravel-project

# Install Laravel Sanctum
composer require laravel/sanctum

# Publish Sanctum configuration and migrations
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Run migrations to create personal access tokens table
php artisan migrate
```

### Step 2: Configure Sanctum in Laravel

Add Sanctum middleware to your `app/Http/Kernel.php`:

```php
// In app/Http/Kernel.php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### Step 3: Generate Required Files with Artisan Command

Run the artisan command to generate all necessary files for the coding tracker:

```bash
php artisan make:coding-tracker
```

This command will create:

- **Migration**: `database/migrations/xxxx_create_coding_sessions_table.php`
- **Model**: `app/Models/CodingSession.php`
- **Controller**: `app/Http/Controllers/CodingSessionController.php`
- **Request**: `app/Http/Requests/StoreCodingSessionRequest.php`
- **Routes**: Adds API routes to `routes/api.php`

### Step 4: Run the Migration

```bash
php artisan migrate
```

### Step 5: Generate API Token

Create a user and generate an API token:

```bash
php artisan tinker
```

In the Tinker console:

```php
// Create a user (if you don't have one)
$user = \App\Models\User::create([
    'name' => 'Your Name',
    'email' => 'your@email.com',
    'password' => bcrypt('your-password')
]);

// Generate API token
$token = $user->createToken('vscode-coding-tracker')->plainTextToken;
echo $token;
```

Copy the generated token - you'll need it for VS Code configuration.

### Step 6: Configure VS Code Extension

1. **Install the Extension**:

   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Laravel Coding Time Tracker"
   - Install the extension

2. **Configure Settings**:
   - Open VS Code Settings (Ctrl+, / Cmd+,)
   - Search for "Coding Tracker"
   - Set the following values:
     - **API URL**: `http://your-laravel-app.test/api/coding-sessions` (replace with your Laravel app URL)
     - **API Key**: Paste the token generated in Step 5

### Step 7: Test the Integration

1. Start coding in VS Code
2. Check the status bar for the coding time indicator: `⏰ Coding: Xm`
3. After 5 minutes of activity, data should sync to your Laravel application
4. Check your database to verify sessions are being stored

## ⚙️ Configuration Options

### Required Settings

- **API URL** (`codingTracker.apiUrl`): Your Laravel API endpoint URL

  - Example: `http://localhost:8000/api/coding-sessions`
  - Example: `https://yourapp.com/api/coding-sessions`

- **API Key** (`codingTracker.apiKey`): Your Laravel Sanctum authentication token
  - Generated using `$user->createToken('vscode-coding-tracker')->plainTextToken`

### Optional Settings

- **Idle Minutes** (`codingTracker.idleMinutes`): Minutes of inactivity before considering user idle (default: 5)
- **Batch Seconds** (`codingTracker.batchSeconds`): Seconds to accumulate before sending a batch (default: 300, minimum: 60)

## 📋 VS Code Commands

Access these commands via the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **Laravel Coding Tracker: Show Coding Statistics** - Display your coding time statistics
- **Laravel Coding Tracker: Reset Local Statistics** - Clear all local tracking data
- **Laravel Coding Tracker: Open Settings** - Quick access to extension settings

## 🔌 API Integration

### Request Format

The extension sends POST requests to your Laravel API endpoint with the following structure:

```json
{
  "sessions": [
    {
      "started_at": "2023-10-18T10:30:00.000Z",
      "duration_seconds": 300,
      "project": "my-laravel-project",
      "file": "/path/to/current/file.php"
    }
  ]
}
```

### Laravel API Response

Your Laravel controller should accept this format and respond with a 2xx status code:

```php
// Expected response
HTTP/1.1 200 OK
Content-Type: application/json

{
    "message": "Sessions recorded successfully",
    "recorded_sessions": 1
}
```

### Database Schema

The generated migration creates a `coding_sessions` table with the following structure:

```php
Schema::create('coding_sessions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->timestamp('started_at');
    $table->integer('duration_seconds');
    $table->string('project')->nullable();
    $table->text('file')->nullable();
    $table->timestamps();
});
```

## 🔄 How It Works

1. **Activity Detection**: The extension monitors:

   - File changes and edits
   - File saves
   - Editor focus changes
   - Window focus changes

2. **Time Accumulation**: Active time is accumulated in 60-second intervals

3. **Batch Creation**: Sessions are created when:

   - The batch threshold is reached (default: 5 minutes)
   - User becomes idle (default: 5 minutes of inactivity)

4. **API Synchronization**: Sessions are sent to your Laravel API endpoint with Bearer token authentication

5. **Persistence**: Failed uploads are stored locally and retried automatically

## 🔧 Laravel Artisan Command

The extension includes an artisan command to generate all necessary Laravel files:

```bash
php artisan make:coding-tracker
```

This command creates:

- Migration for `coding_sessions` table
- `CodingSession` model with relationships
- `CodingSessionController` with validation
- `StoreCodingSessionRequest` for request validation
- API routes in `routes/api.php`

## 📊 Viewing Your Data

After setup, you can view your coding sessions in several ways:

### Database Query

```php
// Get all sessions for a user
$sessions = \App\Models\CodingSession::where('user_id', auth()->id())
    ->orderBy('started_at', 'desc')
    ->get();

// Get today's total coding time (in seconds)
$todayTotal = \App\Models\CodingSession::where('user_id', auth()->id())
    ->whereDate('started_at', today())
    ->sum('duration_seconds');
```

### API Endpoints (if you want to build a dashboard)

```php
// GET /api/coding-sessions - List sessions
// GET /api/coding-sessions/stats - Get statistics
```

## 🛡️ Privacy & Security

- **Local Storage**: All data is stored locally until successfully synced
- **No Third Parties**: No data is sent to any third-party services
- **Full Control**: You have complete control over your API endpoint and data handling
- **Secure Authentication**: Uses Laravel Sanctum for secure API authentication

## 🚀 Development

To contribute or modify this extension:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Heyosseus/vscode-coding-tracker.git
   cd vscode-coding-tracker
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Open in VS Code**:

   ```bash
   code .
   ```

4. **Start development**:

   - Press `F5` to launch Extension Development Host
   - Make changes and test in the development environment

5. **Build for production**:
   ```bash
   npm run package
   ```

## 🐛 Troubleshooting

### Extension not tracking time

- Check VS Code status bar for the coding indicator
- Verify API URL and API key in settings
- Check browser developer console for errors

### API connection issues

- Verify Laravel application is running
- Check API URL format (include `/api/coding-sessions`)
- Ensure CORS is configured for your domain
- Verify Sanctum token is valid

### Database issues

- Run `php artisan migrate` to ensure tables exist
- Check Laravel logs in `storage/logs/laravel.log`
- Verify user has valid Sanctum token

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This extension is provided as-is for educational and personal use.
