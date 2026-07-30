const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({ port, host: 'localhost', method: 'GET' }, (res) => {
      resolve(true);
      res.destroy();
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "AutoSync ERP - Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Check 5174 then 5173
  const is5174Active = await checkPort(5174);
  const url = is5174Active ? "http://localhost:5174" : "http://localhost:5173";
  
  console.log(`[Electron] Connecting to: ${url}`);
  win.loadURL(url);
}

app.whenReady().then(() => {
  createWindow();
});