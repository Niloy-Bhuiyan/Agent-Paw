/* Bridge between the pet page and the Electron shell (context-isolated). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petDesktop", {
  /** Roam mode: make the overlay clickable (true) or click-through (false). */
  setInteractive: (interactive) => ipcRenderer.send("pet:set-interactive", Boolean(interactive)),
  quit: () => ipcRenderer.send("pet:quit"),
});
