import * as vscode from 'vscode';

// Use dynamic import for node-fetch to handle compatibility
let fetch: any;

async function initFetch() {
  try {
    // Try to use global fetch first (Node 18+)
    if (typeof globalThis.fetch !== 'undefined') {
      fetch = globalThis.fetch;
    } else {
      // Fallback to node-fetch
      const nodeFetch = await import('node-fetch');
      fetch = nodeFetch.default;
    }
  } catch (error) {
    console.warn(
      'Coding Tracker: Could not initialize fetch. API features will be disabled.',
      error
    );
  }
}

type BatchItem = {
  started_at: string // ISO
  duration_seconds: number
  project?: string
  file?: string
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize fetch
  initFetch();

  const config = vscode.workspace.getConfiguration('codingTracker');
  const apiUrl: string | undefined = config.get('apiUrl');
  const apiKey: string | undefined = config.get('apiKey');
  const idleMinutes: number = config.get('idleMinutes') ?? 5;
  const batchSeconds: number = config.get('batchSeconds') ?? 300;

  if (!apiUrl || !apiKey) {
    vscode.window.showWarningMessage(
      'Coding Tracker: apiUrl or apiKey not configured. Open settings to set codingTracker.apiUrl and codingTracker.apiKey.'
    );
    // continue — still track locally
  }

  const IDLE_MS = idleMinutes * 60 * 1000;
  const HEARTBEAT_MS = 60 * 1000; // check every minute

  let lastActivity = Date.now();
  let activeAccumulator = 0; // seconds in current batch
  let batch: BatchItem[] = context.globalState.get(
    'codingTrackerBatch',
    []
  ) as BatchItem[];

  // helper: mark activity
  function markActivity(file?: string) {
    lastActivity = Date.now();
    // optionally update UI/status bar
  }

  // subscribe to events that indicate activity
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => markActivity()),
    vscode.workspace.onDidSaveTextDocument(() => markActivity()),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document) {
        markActivity(editor.document.uri.fsPath);
      }
    }),
    vscode.window.onDidChangeWindowState((win) => {
      if (win.focused) {
        markActivity();
      }
    })
  );

  // Status bar item
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  status.text = `$(clock) Coding: 0m`;
  status.show();
  context.subscriptions.push(status);

  // attempt to send batch to API
  async function sendBatch(items: BatchItem[]) {
    if (!apiUrl || !apiKey || !fetch) {
      return false;
    }
    if (items.length === 0) {
      return true;
    }
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ sessions: items })
      });
      if (!resp.ok) {
        console.error('Coding Tracker: server returned', resp.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Coding Tracker: send error', err);
      return false;
    }
  }

  // heartbeat interval
  const interval = setInterval(async () => {
    const now = Date.now();
    const idle = now - lastActivity > IDLE_MS;

    if (!idle) {
      // user is active for this minute
      activeAccumulator += 60;
      // update status bar
      const mins = Math.floor(activeAccumulator / 60);
      status.text = `$(clock) Coding: ${mins}m`;
    }

    // if accumulator reached threshold or user just became idle and accumulator > 0, flush one batch item
    if (
      activeAccumulator >= batchSeconds ||
      (idle && activeAccumulator > 0)
    ) {
      const startedAt = new Date(
        now - activeAccumulator * 1000
      ).toISOString();
      const editor = vscode.window.activeTextEditor;
      const project = vscode.workspace.name ?? undefined;
      const file = editor?.document.uri.fsPath ?? undefined;

      const item: BatchItem = {
        started_at: startedAt,
        duration_seconds: activeAccumulator,
        project,
        file
      };
      batch.push(item);
      // save to persistent state immediately
      await context.globalState.update('codingTrackerBatch', batch);
      activeAccumulator = 0;
      status.text = `$(clock) Coding: 0m`;
    }

    // try to send batch if any
    if (batch.length > 0) {
      const ok = await sendBatch(batch);
      if (ok) {
        batch = [];
        await context.globalState.update('codingTrackerBatch', batch);
      } else {
        // keep for retry later
      }
    }
  }, HEARTBEAT_MS);

  context.subscriptions.push({
    dispose: () => clearInterval(interval)
  });

  // On deactivate attempt a final flush (best-effort)
  context.subscriptions.push({
    dispose: async () => {
      if (activeAccumulator > 0) {
        const startedAt = new Date(
          Date.now() - activeAccumulator * 1000
        ).toISOString();
        batch.push({
          started_at: startedAt,
          duration_seconds: activeAccumulator,
          project: vscode.workspace.name ?? undefined
        });
        await context.globalState.update('codingTrackerBatch', batch);
        activeAccumulator = 0;
      }
      if (batch.length > 0) {
        await sendBatch(batch);
      }
    }
  });

  // Command implementations
  const showStatsCommand = vscode.commands.registerCommand(
    'vscode-coding-tracker.showStats',
    async () => {
      const totalTime =
        batch.reduce((sum, item) => sum + item.duration_seconds, 0) +
        activeAccumulator;
      const hours = Math.floor(totalTime / 3600);
      const minutes = Math.floor((totalTime % 3600) / 60);
      const sessions = batch.length + (activeAccumulator > 0 ? 1 : 0);

      const message = `Coding Statistics:
Total Time: ${hours}h ${minutes}m
Sessions: ${sessions}
Pending Sync: ${batch.length} sessions
Current Session: ${Math.floor(activeAccumulator / 60)}m`;

      vscode.window.showInformationMessage(message);
    }
  );

  const resetStatsCommand = vscode.commands.registerCommand(
    'vscode-coding-tracker.resetStats',
    async () => {
      const result = await vscode.window.showWarningMessage(
        'Are you sure you want to reset all local coding statistics? This action cannot be undone.',
        'Reset',
        'Cancel'
      );

      if (result === 'Reset') {
        batch = [];
        activeAccumulator = 0;
        await context.globalState.update('codingTrackerBatch', []);
        status.text = `$(clock) Coding: 0m`;
        vscode.window.showInformationMessage(
          'Coding statistics have been reset.'
        );
      }
    }
  );

  const openSettingsCommand = vscode.commands.registerCommand(
    'vscode-coding-tracker.openSettings',
    () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:Rati Rukhadze.vscode-coding-tracker'
      );
    }
  );

  context.subscriptions.push(
    showStatsCommand,
    resetStatsCommand,
    openSettingsCommand
  );
}

export function deactivate() {
  // nothing — the dispose above handles it
}
