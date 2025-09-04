const fs = require('fs');

function parseTreeFile(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8')
                    .split(/\r?\n/)
                    .filter(l => l.trim() !== '');

    const root = {};
    const stack = [{ indent: -1, node: root }];

    for (let line of lines) {
        let originalLine = line;
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

module.exports = { parseTreeFile };
