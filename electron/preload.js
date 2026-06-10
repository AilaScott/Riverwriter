import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future file save/load IPC calls
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  loadFile: () => ipcRenderer.invoke('load-file'),
});
