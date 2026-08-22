/* ============================================================
   Comnyang Desktop Pet — Electron shell.

   Two modes (env PET_MODE):
   - "roam"   (default): a transparent, click-through overlay the
     size of your work area. The cat walks along the bottom of the
     WHOLE screen; the window becomes clickable only while your
     pointer is near the cat (the page reports that via IPC).
   - "corner": the original small 300×340 draggable window in the
     bottom-right corner.

   Run:   npm run dev      (terminal 1 — serves the app)
          npm run desktop  (terminal 2 — opens the pet)
   Quit:  Ctrl+Alt+Q anywhere, the ✕ on hover, or the taskbar entry.
   Env:   PET_URL overrides http://localhost:3000/desktop
   ============================================================ */

const path = require("path");
const { app, BrowserWindow, globalShortcut, ipcMain, Menu, screen } = require("electron");

const MODE = process.env.PET_MODE === "corner" ? "corner" : "roam";
const BASE_URL = process.env.PET_URL || "http://localhost:3000/desktop";
const PET_URL = `${BASE_URL}${BASE_URL.includes("?") ? "&" : "?"}mode=${MODE}`;

const OFFLINE_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`
  <body style="margin:0;display:flex;align-items:flex-end;justify-content:flex-end;height:100vh;
               background:transparent;color:#f5f5f5;font-family:monospace">
    <div style="background:#0a0a0aee;border:1px solid #333;padding:14px 18px;margin:24px;text-align:center">
      <p style="font-size:26px;margin:0 0 6px">🐈</p>
      <p style="font-size:12px;line-height:1.6;margin:0">The cat can't find its home.<br/>
      Start the web app first: <b>npm run dev</b><br/>
      <span style="color:#9a9a9a">retrying every 3s… (Ctrl+Alt+Q quits)</span></p>
    </div>
  </body>`)}`;

let win = null;
let retryTimer = null;

function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  const corner = MODE === "corner";

  const bounds = corner
    ? { width: 300, height: 340, x: area.x + area.width - 324, y: area.y + area.height - 348 }
    : { width: area.width, height: area.height, x: area.x, y: area.y };

  win = new BrowserWindow({
    ...bounds,
    transparent: true,
    backgroundColor: "#00000000", // fully transparent — no rectangle, ever
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: false, // keep a taskbar entry so it's always easy to close
    alwaysOnTop: true,
    title: "Comnyang",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.setMenuBarVisibility(false);

  // Roam mode starts click-through; the page flips interactivity via IPC
  // whenever the pointer gets near the cat. `forward: true` keeps mousemove
  // events flowing to the page while it is click-through.
  if (!corner) win.setIgnoreMouseEvents(true, { forward: true });

  const load = () => {
    win.loadURL(PET_URL).catch(() => {
      /* handled by did-fail-load */
    });
  };

  win.webContents.on("did-fail-load", () => {
    // The offline card must be clickable-through too in roam mode.
    win.loadURL(OFFLINE_PAGE);
    clearTimeout(retryTimer);
    retryTimer = setTimeout(load, 3000);
  });

  win.on("closed", () => {
    win = null;
    app.quit();
  });

  load();
}

ipcMain.on("pet:set-interactive", (_event, interactive) => {
  if (!win || MODE === "corner") return;
  win.setIgnoreMouseEvents(!interactive, { forward: true });
});

ipcMain.on("pet:quit", () => app.quit());

// Right-click menu on the cat — includes the "remove cat" escape hatch.
ipcMain.on("pet:menu", () => {
  if (!win) return;
  Menu.buildFromTemplate([
    { label: "😴 Sleep / wake", click: () => win?.webContents.send("pet:action", "sleep") },
    { label: "🐈 Change fur", click: () => win?.webContents.send("pet:action", "fur") },
    { type: "separator" },
    { label: "✕ Remove cat (quit)", accelerator: "Ctrl+Alt+Q", click: () => app.quit() },
  ]).popup({ window: win });
});

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("Control+Alt+Q", () => app.quit());
});

app.on("will-quit", () => {
  clearTimeout(retryTimer);
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => app.quit());
