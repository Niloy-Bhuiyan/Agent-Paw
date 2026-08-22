/** Bridge exposed by the Electron preload (desktop/preload.js). */
interface PetDesktopBridge {
  setInteractive(interactive: boolean): void;
  showMenu(): void;
  /** Subscribe to native-menu actions ("sleep" | "fur"). Returns unsubscribe. */
  onAction(callback: (action: string) => void): () => void;
  quit(): void;
}

interface Window {
  petDesktop?: PetDesktopBridge;
}
