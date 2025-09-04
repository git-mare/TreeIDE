const fs = require('fs');
const path = require('path');

function createStructure(tree, basePath) {
    for (const key in tree) {
        const fullPath = require('path').join(basePath, key);
        if (key.endsWith('/')) {
            require('fs').mkdirSync(fullPath, { recursive: true });
            createStructure(tree[key], fullPath);
        } else if (key.includes('.')) {
            require('fs').mkdirSync(require('path').dirname(fullPath), { recursive: true });
            const defaultContent = `// File created by Tree IDE\n`;
            require('fs').writeFileSync(fullPath, defaultContent);
        } else {
            require('fs').mkdirSync(fullPath, { recursive: true });
            createStructure(tree[key], fullPath);
        }
    }
}

module.exports = { createStructure };
