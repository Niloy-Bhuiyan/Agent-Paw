/* ============================================================
   Comnyang Desktop Pet — Electron shell.

   Opens a small transparent, frameless, always-on-top window
   showing the /desktop route of the web app. The cat floats
   over every other window; drag its edges to move it anywhere.

   Run:   npm run dev      (in one terminal — serves the app)
          npm run desktop  (in another — opens the pet)

   Env:   PET_URL  override the page URL
                   (default http://localhost:3000/desktop)

   Quit:  hover the pet → ✕, or Ctrl+Alt+Q anywhere.
   ============================================================ */

const { app, BrowserWindow, globalShortcut, screen } = require("electron");

const PET_URL = process.env.PET_URL || "http://localhost:3000/desktop";
const WIDTH = 300;
const HEIGHT = 340;

/** Shown when the dev server isn't running yet. */
const OFFLINE_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`
  <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
               background:#0a0a0aee;color:#f5f5f5;font-family:monospace;text-align:center">
    <div>
      <p style="font-size:28px;margin:0">🐈</p>
      <p style="font-size:12px;line-height:1.6">The cat can't find its home.<br/>
      Start the web app first:<br/><b>npm run dev</b><br/><br/>
      <span style="color:#9a9a9a">retrying every 3s… (Ctrl+Alt+Q quits)</span></p>
    </div>
  </body>`)}`;

let win = null;
let retryTimer = null;

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: screenW - WIDTH - 24, // bottom-right corner, like a real desk pet
    y: screenH - HEIGHT - 8,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: false, // keep a taskbar entry so it's easy to find/close
    alwaysOnTop: true,
    title: "Comnyang",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Float above fullscreen-ish apps too.
  win.setAlwaysOnTop(true, "screen-saver");
  win.setMenuBarVisibility(false);

  const load = () => {
    win.loadURL(PET_URL).catch(() => {
      /* handled by did-fail-load */
    });
  };

  win.webContents.on("did-fail-load", () => {
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

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("Control+Alt+Q", () => app.quit());
});

app.on("will-quit", () => {
  clearTimeout(retryTimer);
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => app.quit());
