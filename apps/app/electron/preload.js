const { contextBridge } = require("electron");

// Only expose a flag to detect Electron environment
// All API calls go through HTTP to the backend server
contextBridge.exposeInMainWorld("isElectron", true);

// Expose platform info for UI purposes
contextBridge.exposeInMainWorld("electronPlatform", process.platform);

console.log("[Preload] Electron flag exposed (HTTP-only mode)");
