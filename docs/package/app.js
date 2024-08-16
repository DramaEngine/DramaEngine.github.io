require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    let editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '',
        language: 'javascript',
        theme: 'vs-dark',
    });

    const sceneContainer = document.getElementById('scene-container');
    const scenes = new Map(); // To store scenes with their line numbers and elements

    function updateScenes() {
        const lines = editor.getModel().getLinesContent();
        const currentScenes = new Set();

        lines.forEach((line, index) => {
            const match = line.match(/^Scene (\w+)$/);
            if (match) {
                const sceneName = match[1];
                currentScenes.add(sceneName);

                if (!scenes.has(sceneName)) {
                    const sceneDiv = document.createElement('div');
                    sceneDiv.className = 'scene-item';
                    sceneDiv.textContent = `Scene ${sceneName}`;
                    sceneDiv.dataset.sceneName = sceneName;

                    sceneDiv.addEventListener('click', () => {
                        editor.revealLine(index + 1);
                        editor.setPosition({ lineNumber: index + 1, column: 1 });
                        editor.focus();
                    });

                    sceneContainer.appendChild(sceneDiv);
                    scenes.set(sceneName, { lineNumber: index + 1, element: sceneDiv });
                } else {
                    scenes.get(sceneName).lineNumber = index + 1;
                }
            }
        });

        // Remove scenes that are no longer in the editor
        scenes.forEach((value, key) => {
            if (!currentScenes.has(key)) {
                sceneContainer.removeChild(value.element);
                scenes.delete(key);
            }
        });
    }

    // Listen for changes in the editor
    editor.onDidChangeModelContent(() => {
        updateScenes();
    });

    // Initial population of scenes
    updateScenes();

    // Open file
    document.getElementById('open-file').addEventListener('click', async () => {
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const content = await file.text();
        editor.setValue(content);
    });

    // Save file
    document.getElementById('save-file').addEventListener('click', async () => {
        if (fileHandle) {
            const writable = await fileHandle.createWritable();
            await writable.write(editor.getValue());
            await writable.close();
        } else {
            alert('No file opened.');
        }
    });

    // Save As
    document.getElementById('save-as').addEventListener('click', async () => {
        const newHandle = await window.showSaveFilePicker();
        const writable = await newHandle.createWritable();
        await writable.write(editor.getValue());
        await writable.close();
        fileHandle = newHandle;
    });

    // Open Project (Folder)
    document.getElementById('open-project').addEventListener('click', async () => {
        const directoryHandle = await window.showDirectoryPicker();
        document.getElementById('file-tree').innerHTML = ''; // Clear previous tree
        await listFiles(directoryHandle, document.getElementById('file-tree'));
    });

    // Recursive function to list files in a directory
    async function listFiles(directoryHandle, parentElement) {
        for await (const entry of directoryHandle.values()) {
            const li = document.createElement('li');
            li.textContent = entry.name;
            parentElement.appendChild(li);

            if (entry.kind === 'directory') {
                const ul = document.createElement('ul');
                li.appendChild(ul);
                await listFiles(entry, ul);
            } else {
                li.addEventListener('click', async () => {
                    const file = await entry.getFile();
                    const content = await file.text();
                    editor.setValue(content);
                    fileHandle = entry; // Update the current file handle
                });
            }
        }
    }
});
