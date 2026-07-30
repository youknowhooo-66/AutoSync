const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  versao: "1.0.0",
});