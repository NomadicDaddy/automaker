const path = require("path");
const { app, BrowserWindow, shell } = require("electron");

let mainWindow = null;

// Get icon path - works in both dev and production
function getIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app", "public", "logo.png")
    : path.join(__dirname, "../public/logo.png");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a0a",
  });

  // Load Next.js dev server in development or production build
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3007");
    // Open DevTools if OPEN_DEVTOOLS environment variable is set
    if (process.env.OPEN_DEVTOOLS === "true") {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "../.next/server/app/index.html"));
  }

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set app icon (dock icon on macOS)
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(getIconPath());
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
