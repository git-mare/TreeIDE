const editor = document.getElementById('editor');
const treeView = document.getElementById('treeView');
const creditsBtn = document.getElementById('creditsBtn');
const creditsModal = document.getElementById('creditsModal');
const closeCredits = document.getElementById('closeCredits');
const fileIcons = {
    '.py': '🐍',
    '.rb': '💎',
    '.js': '🟨',
    '.ts': '🔷',
    '.java': '☕',
    '.c': '📘',
    '.cpp': '📘',
    '.cs': '🔵',
    '.html': '🌐',
    '.htm': '🌐',
    '.css': '🎨',
    '.json': '🗄️',
    '.md': '📝',
    '.sh': '💻',
    '.yml': '⚙️',
    '.yaml': '⚙️',
    '.sql': '🗄️',
    '.tree': '🌳'
};

const folderIcons = {
    'test': '🧪',
    'tests': '🧪',
    'controllers': '🛠️',
    'controller': '🛠️',
    'models': '📦',
    'data': '💾',
    'assets': '🖼️',
    'audio': '🎵',
    'images': '🖼️',
    'utils': '🛠️',
    'tools': '🛠️',
    'scripts': '📜',
    'translation': '🌐',
    'translation': '🌐',
    'i18n': '🌐'
};

let currentFilePath = '';
let currentTree = {};

editor.addEventListener('keydown', function(e) {
    if (e.key === "Tab") {
        e.preventDefault();

        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;

        if (e.shiftKey) {
            // Shift+Tab -> down 1 lvl
            const selected = value.slice(start, end);
            const lines = selected.split(/\r?\n/);
            let removed = 0;

            const newLines = lines.map(line => {
                if (line.startsWith("\t")) {
                    removed++;
                    return line.slice(1);
                } else if (line.startsWith("    ")) { // se tiver 4 espaços
                    removed++;
                    return line.slice(4);
                }
                return line;
            });

            const newValue = value.slice(0, start) + newLines.join('\n') + value.slice(end);
            this.value = newValue;
            this.selectionStart = start;
            this.selectionEnd = end - removed;
        } else {
            // Tab -> up 1 lvl
            const selected = value.slice(start, end);
            if (selected.includes("\n")) {
                const lines = selected.split(/\r?\n/);
                const newLines = lines.map(line => "\t" + line);
                const newValue = value.slice(0, start) + newLines.join('\n') + value.slice(end);
                this.value = newValue;
                this.selectionStart = start;
                this.selectionEnd = end + lines.length;
            } else {
                // single line
                this.value = value.slice(0, start) + "\t" + value.slice(end);
                this.selectionStart = this.selectionEnd = start + 1;
            }
        }

        // update tree
        currentTree = parseEditorContent(this.value);
        treeView.textContent = renderTree(currentTree);
    }
});

function getIcon(name, isFolder) {
    if (isFolder) {
        const lowerName = name.toLowerCase();
        for (let key in folderIcons) {
            if (lowerName.includes(key)) return folderIcons[key];
        }
        return '📁';
    } else {
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex !== -1) {
            const ext = name.slice(dotIndex);
            return fileIcons[ext] || '📄';
        }
        return '📄';
    }
}
 
function renderTree(tree, prefix = '') {
    let result = '';
    const keys = Object.keys(tree);
    keys.forEach((key, i) => {
        const isLast = i === keys.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const isFolder = Object.keys(tree[key]).length > 0;
        const icon = getIcon(key, isFolder);
        result += `${prefix}${connector}${icon} ${key}\n`;

        const extension = isLast ? '    ' : '│   ';
        if (Object.keys(tree[key]).length > 0) {
            result += renderTree(tree[key], prefix + extension);
        }
    });
    return result;
}

function showToast(message, duration = 1500) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

function updateFileNameDisplay() {
    const nameSpan = document.getElementById('fileName');
    if (currentFilePath) {
        const parts = currentFilePath.split(/[\\/]/);
        nameSpan.textContent = parts[parts.length - 1];
    } else {
        nameSpan.textContent = 'Untitled';
    }
}
document.getElementById('loadBtn').addEventListener('click', async () => {
    const result = await window.electronAPI.loadTree();
    if (result.canceled) return;
    currentFilePath = result.filePath;
    currentTree = result.treeData;
    editor.value = result.content;
    treeView.textContent = renderTree(currentTree);
    updateFileNameDisplay();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    await saveProject();
});

async function saveProject(forceSaveAs = false) {
    if (!currentFilePath || forceSaveAs) {
        const result = await window.electronAPI.saveTreeAs(editor.value);
        if (result.canceled) return;
        currentFilePath = result.filePath;
    } else {
        await window.electronAPI.saveTree(currentFilePath, editor.value);
    }
    updateFileNameDisplay();
    showToast(`Project saved to:\n${currentFilePath || 'Untitled'}`);
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
            saveProject(true);
        } else {
            saveProject();
        }
    }
});

document.getElementById('createBtn').addEventListener('click', async () => {
    if (!currentTree) return;
    const result = await window.electronAPI.createStructure(currentTree);
    if (!result.canceled) {
        showToast(`Structure created at:\n${result.path}`);
    }
});

function parseEditorContent(content) {
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    const root = {};
    const stack = [{ indent: -1, node: root }];

    for (let line of lines) {
        let indent = 0;

        if (line.startsWith('...')) {
            while (line.startsWith('...')) {
                indent++;
                line = line.slice(3);
            }
        } else {
            let stripped = line.replace(/^\t+/, '');
            indent = line.length - stripped.length;
            line = stripped;
        }

        line = line.trim();
        const node = {};

        while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
        const parent = stack[stack.length - 1].node;
        parent[line] = node;
        stack.push({ indent, node });
    }

    return root;
}
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

editor.addEventListener('input', () => {
    currentTree = parseEditorContent(editor.value);
    treeView.textContent = renderTree(currentTree);
});


creditsBtn.addEventListener('click', () => {
    creditsModal.style.display = 'flex';
});

closeCredits.addEventListener('click', () => {
    creditsModal.style.display = 'none';
});

creditsModal.addEventListener('click', (e) => {
    if (e.target === creditsModal) {
        creditsModal.style.display = 'none';
    }
});