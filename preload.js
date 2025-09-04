const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadTree: () => ipcRenderer.invoke('load-tree'),
    saveTree: (filePath, content) => ipcRenderer.invoke('save-tree', filePath, content),
    saveTreeAs: (content) => ipcRenderer.invoke('save-tree-as', content),
    createStructure: (treeData) => ipcRenderer.invoke('create-structure', treeData)
});
