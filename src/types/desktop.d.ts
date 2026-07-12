/** Bridge exposed by the Electron preload (desktop/preload.js). */
interface PetDesktopBridge {
  setInteractive(interactive: boolean): void;
  quit(): void;
}

interface Window {
  petDesktop?: PetDesktopBridge;
}
