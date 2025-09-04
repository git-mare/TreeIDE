const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { parseTreeFile } = require('./treeParser');
const { createStructure } = require('./treeCreator');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, 'assets', 'icon-no-bg.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    win.setMenu(null);
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// IPC handlers
ipcMain.handle('load-tree', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: 'Tree files', extensions: ['tree'] }],
        properties: ['openFile']
    });
    if (canceled) return { canceled: true };

    const treeData = parseTreeFile(filePaths[0]);
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { canceled: false, treeData, content, filePath: filePaths[0] };
});

ipcMain.handle('save-tree', async (event, filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
});

ipcMain.handle('create-structure', async (event, treeData) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) return { canceled: true };

    createStructure(treeData, filePaths[0]);
    return { canceled: false, path: filePaths[0] };
});

ipcMain.handle('save-tree-as', async (event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Salvar Projeto',
        defaultPath: 'projeto.tree',
        filters: [{ name: 'Tree files', extensions: ['tree'] }]
    });

    if (canceled || !filePath) return { canceled: true };

    fs.writeFileSync(filePath, content, 'utf-8');
    return { canceled: false, filePath };
});
