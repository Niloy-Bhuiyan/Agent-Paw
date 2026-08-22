/* Bridge between the pet page and the Electron shell (context-isolated). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petDesktop", {
  /** Roam mode: make the overlay clickable (true) or click-through (false). */
  setInteractive: (interactive) => ipcRenderer.send("pet:set-interactive", Boolean(interactive)),
  /** Native right-click menu (sleep, fur, quit). */
  showMenu: () => ipcRenderer.send("pet:menu"),
  /** Subscribe to menu actions; returns an unsubscribe function. */
  onAction: (callback) => {
    const handler = (_event, action) => callback(String(action));
    ipcRenderer.on("pet:action", handler);
    return () => ipcRenderer.removeListener("pet:action", handler);
  },
  quit: () => ipcRenderer.send("pet:quit"),
});
