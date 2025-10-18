# Laravel Backend Setup for VS Code Coding Tracker

This guide will help you create a Laravel backend to receive and store coding session data from your VS Code extension.

## 1. Laravel Setup

### Create a new Laravel project (if you don't have one):

```bash
composer create-project laravel/laravel coding-tracker-api
cd coding-tracker-api
```

### Install Laravel Sanctum for API authentication:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## 2. Database Migration

Create a migration for coding sessions:

```bash
php artisan make:migration create_coding_sessions_table
```

Edit the migration file `database/migrations/xxxx_xx_xx_xxxxxx_create_coding_sessions_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('coding_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at');
            $table->integer('duration_seconds');
            $table->string('project')->nullable();
            $table->text('file')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'started_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('coding_sessions');
    }
};
```

Run the migration:

```bash
php artisan migrate
```

## 3. Create Models

### User Model (update existing)

Add to your `app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function codingSessions()
    {
        return $this->hasMany(CodingSession::class);
    }
}
```

### CodingSession Model

Create `app/Models/CodingSession.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class CodingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'started_at',
        'duration_seconds',
        'project',
        'file',
    ];

    protected $casts = [
        'started_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getDurationInMinutesAttribute()
    {
        return round($this->duration_seconds / 60, 2);
    }

    public function getDurationInHoursAttribute()
    {
        return round($this->duration_seconds / 3600, 2);
    }
}
```

## 4. API Controller

Create the controller:

```bash
php artisan make:controller Api/CodingSessionController
```

Edit `app/Http/Controllers/Api/CodingSessionController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodingSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CodingSessionController extends Controller
{
    /**
     * Store coding sessions from VS Code extension
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'sessions' => 'required|array',
            'sessions.*.started_at' => 'required|date',
            'sessions.*.duration_seconds' => 'required|integer|min:1',
            'sessions.*.project' => 'nullable|string|max:255',
            'sessions.*.file' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $sessions = [];

        foreach ($request->sessions as $sessionData) {
            $sessions[] = CodingSession::create([
                'user_id' => $user->id,
                'started_at' => Carbon::parse($sessionData['started_at']),
                'duration_seconds' => $sessionData['duration_seconds'],
                'project' => $sessionData['project'] ?? null,
                'file' => $sessionData['file'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Sessions stored successfully',
            'sessions_count' => count($sessions),
            'total_time_seconds' => collect($sessions)->sum('duration_seconds')
        ], 201);
    }

    /**
     * Get user's coding statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->codingSessions();

        // Optional date filtering
        if ($request->has('from')) {
            $query->where('started_at', '>=', Carbon::parse($request->from));
        }

        if ($request->has('to')) {
            $query->where('started_at', '<=', Carbon::parse($request->to));
        }

        $sessions = $query->get();

        $stats = [
            'total_sessions' => $sessions->count(),
            'total_time_seconds' => $sessions->sum('duration_seconds'),
            'total_time_hours' => round($sessions->sum('duration_seconds') / 3600, 2),
            'average_session_minutes' => $sessions->count() > 0 ? round($sessions->avg('duration_seconds') / 60, 2) : 0,
            'projects' => $sessions->groupBy('project')->map(function ($projectSessions, $project) {
                return [
                    'name' => $project ?: 'Unknown',
                    'sessions' => $projectSessions->count(),
                    'total_time_seconds' => $projectSessions->sum('duration_seconds'),
                    'total_time_hours' => round($projectSessions->sum('duration_seconds') / 3600, 2),
                ];
            })->values(),
            'daily_stats' => $sessions->groupBy(function ($session) {
                return $session->started_at->format('Y-m-d');
            })->map(function ($daySessions, $date) {
                return [
                    'date' => $date,
                    'sessions' => $daySessions->count(),
                    'total_time_seconds' => $daySessions->sum('duration_seconds'),
                    'total_time_hours' => round($daySessions->sum('duration_seconds') / 3600, 2),
                ];
            })->values()
        ];

        return response()->json($stats);
    }

    /**
     * Get recent coding sessions
     */
    public function recent(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $request->get('limit', 50);

        $sessions = $user->codingSessions()
            ->orderBy('started_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'started_at' => $session->started_at->toISOString(),
                    'duration_seconds' => $session->duration_seconds,
                    'duration_minutes' => $session->duration_in_minutes,
                    'project' => $session->project,
                    'file' => $session->file,
                ];
            });

        return response()->json($sessions);
    }
}
```

## 5. API Routes

Edit `routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\CodingSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Coding session routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/coding-sessions', [CodingSessionController::class, 'store']);
    Route::get('/coding-sessions/stats', [CodingSessionController::class, 'stats']);
    Route::get('/coding-sessions/recent', [CodingSessionController::class, 'recent']);
});
```

## 6. Generate API Token

Create a command to generate API tokens for users:

```bash
php artisan make:command GenerateApiToken
```

Edit `app/Console/Commands/GenerateApiToken.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GenerateApiToken extends Command
{
    protected $signature = 'token:generate {email}';
    protected $description = 'Generate API token for a user';

    public function handle()
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        // Revoke existing tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('vscode-coding-tracker')->plainTextToken;

        $this->info("API Token for {$user->name} ({$user->email}):");
        $this->line($token);

        return 0;
    }
}
```

## 7. Create a User and Generate Token

### Create a user:

```bash
php artisan tinker
```

In tinker:

```php
$user = \App\Models\User::create([
    'name' => 'Your Name',
    'email' => 'your@email.com',
    'password' => bcrypt('your-password')
]);
```

### Generate API token:

```bash
php artisan token:generate your@email.com
```

Copy the generated token - this is your API key!

## 8. VS Code Extension Configuration

Now configure your VS Code extension with:

### API URL:

```
http://your-domain.com/api/coding-sessions
```

(or `http://localhost:8000/api/coding-sessions` for local development)

### API Key:

Use the token generated from the previous step.

## 9. Testing the API

### Test with cURL:

```bash
curl -X POST http://localhost:8000/api/coding-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "sessions": [
      {
        "started_at": "2024-10-18T10:30:00.000Z",
        "duration_seconds": 300,
        "project": "my-project",
        "file": "/path/to/file.js"
      }
    ]
  }'
```

### Get statistics:

```bash
curl -X GET http://localhost:8000/api/coding-sessions/stats \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## 10. CORS Configuration (for web dashboard)

If you plan to create a web dashboard, configure CORS in `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'], // Configure properly for production
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,
```

## 11. Environment Configuration

Add to your `.env` file:

```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

## Summary

Your Laravel backend is now ready! You have:

1. **API Endpoint**: `POST /api/coding-sessions` to receive data from VS Code
2. **Authentication**: Bearer token authentication using Laravel Sanctum
3. **Statistics API**: `GET /api/coding-sessions/stats` for analytics
4. **Recent Sessions**: `GET /api/coding-sessions/recent` for session history

### Next Steps:

1. Deploy your Laravel app to a server
2. Update your VS Code extension settings with the production URL and API token
3. Optionally create a web dashboard to view your coding statistics
