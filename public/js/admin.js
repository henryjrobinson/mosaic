/**
 * Memorial Mosaic Admin Script
 * Handles script management functionality including:
 * - Loading available scripts
 * - Uploading new scripts
 * - Managing script selection
 */

// Global variables
let availableScripts = [];

/**
 * Initialize the admin page
 */
async function initializeAdmin() {
    setupEventListeners();
    await loadAvailableScripts();
}

/**
 * Set up event listeners for the admin page
 */
function setupEventListeners() {
    const dragArea = document.querySelector('.drag-area');
    const browseBtn = document.querySelector('.btn-upload');
    const fileInput = document.querySelector('.file-upload');
    
    // File browse button
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File selection change
    fileInput.addEventListener('change', event => {
        handleFiles(event.target.files);
    });
    
    // Drag and drop events
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when dragging over it
    dragArea.addEventListener('dragover', () => {
        dragArea.classList.add('active');
    });
    
    dragArea.addEventListener('dragleave', () => {
        dragArea.classList.remove('active');
    });
    
    // Handle dropped files
    dragArea.addEventListener('drop', event => {
        dragArea.classList.remove('active');
        const files = event.dataTransfer.files;
        handleFiles(files);
    });
}

/**
 * Handle the uploaded script files
 * @param {FileList} files - The files selected by the user
 */
async function handleFiles(files) {
    if (files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => file.name.endsWith('.json'));
    
    if (validFiles.length === 0) {
        showStatusMessage('Please select JSON files only', 'error');
        return;
    }
    
    try {
        for (const file of validFiles) {
            const script = await readAndValidateScript(file);
            if (script) {
                await saveScript(script, file.name);
            }
        }
        
        // Reload the scripts list
        await loadAvailableScripts();
        
        showStatusMessage(`${validFiles.length} script(s) uploaded successfully`, 'success');
    } catch (error) {
        console.error('Error handling files:', error);
        showStatusMessage('An error occurred while processing the files', 'error');
    }
}

/**
 * Read and validate a script file
 * @param {File} file - The file to read
 * @returns {Object|null} - The parsed script object or null if invalid
 */
function readAndValidateScript(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const script = JSON.parse(event.target.result);
                
                // Validate script format
                if (!script.metadata || !script.conversation) {
                    showStatusMessage(`Invalid script format in ${file.name}`, 'error');
                    resolve(null);
                    return;
                }
                
                resolve(script);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                showStatusMessage(`Failed to parse ${file.name}: Not a valid JSON file`, 'error');
                resolve(null);
            }
        };
        
        reader.onerror = function() {
            reject(new Error(`Failed to read file ${file.name}`));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Save a script to localStorage (for demo purposes)
 * In a real application, this would send the script to a server
 * @param {Object} script - The script object to save
 * @param {string} filename - The original filename
 */
async function saveScript(script, filename) {
    // Extract script ID from filename or use the one in metadata
    const scriptId = script.metadata.id || filename.replace('.json', '');
    const scriptKey = `memorial_script_${scriptId}`;
    
    // Store the script in localStorage for demo purposes
    try {
        localStorage.setItem(scriptKey, JSON.stringify(script));
        console.log(`Script '${script.metadata.title}' saved to localStorage`);
        return true;
    } catch (error) {
        console.error('Error saving script to localStorage:', error);
        showStatusMessage('Failed to save the script due to storage limitations', 'error');
        return false;
    }
}

/**
 * Load all available scripts
 */
async function loadAvailableScripts() {
    try {
        // First try fetching scripts from the server
        const serverScripts = await fetchScriptsFromServer();
        availableScripts = serverScripts;
        
        // Then add any scripts from localStorage
        const localScripts = loadScriptsFromLocalStorage();
        
        // Merge scripts, giving preference to localStorage versions if they exist
        localScripts.forEach(localScript => {
            const existingIndex = availableScripts.findIndex(s => s.id === localScript.id);
            if (existingIndex >= 0) {
                availableScripts[existingIndex] = localScript;
            } else {
                availableScripts.push(localScript);
            }
        });
        
        displayScripts();
    } catch (error) {
        console.error('Error loading scripts:', error);
        showStatusMessage('Failed to load available scripts', 'error');
    }
}

/**
 * Fetch scripts from server
 * @returns {Array} - Array of script objects
 */
async function fetchScriptsFromServer() {
    try {
        const response = await fetch('./scripts/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // This is only for development purposes and won't work in production
        // Normally, this would be a server-side API endpoint that returns the list of scripts
        const html = await response.text();
        
        // Parse HTML to get script files
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        
        const scriptFiles = [];
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href && href.endsWith('.json')) {
                scriptFiles.push(href);
            }
        }
        
        // Fetch each script file
        const scripts = [];
        for (const file of scriptFiles) {
            try {
                const scriptResponse = await fetch(`./scripts/${file}`);
                if (scriptResponse.ok) {
                    const scriptData = await scriptResponse.json();
                    const id = file.replace('.json', '');
                    scripts.push({
                        id: id,
                        title: scriptData.metadata?.title || id,
                        description: scriptData.metadata?.description || '',
                        data: scriptData
                    });
                }
            } catch (e) {
                console.error(`Error fetching script ${file}:`, e);
            }
        }
        
        return scripts;
    } catch (error) {
        console.error('Error fetching scripts from server:', error);
        return [];
    }
}

/**
 * Load scripts from localStorage
 * @returns {Array} - Array of script objects
 */
function loadScriptsFromLocalStorage() {
    const scripts = [];
    
    // Loop through localStorage keys to find scripts
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('memorial_script_')) {
            try {
                const scriptData = JSON.parse(localStorage.getItem(key));
                const id = key.replace('memorial_script_', '');
                
                scripts.push({
                    id: id,
                    title: scriptData.metadata?.title || id,
                    description: scriptData.metadata?.description || '',
                    data: scriptData,
                    isLocal: true // Flag to indicate this is from localStorage
                });
            } catch (e) {
                console.error(`Error parsing script from localStorage (${key}):`, e);
            }
        }
    }
    
    return scripts;
}

/**
 * Display the scripts in the list
 */
function displayScripts() {
    const scriptList = document.getElementById('script-list');
    scriptList.innerHTML = '';
    
    if (availableScripts.length === 0) {
        scriptList.innerHTML = '<p>No scripts available.</p>';
        return;
    }
    
    availableScripts.forEach(script => {
        const listItem = document.createElement('li');
        listItem.className = 'script-item';
        
        const scriptInfo = document.createElement('div');
        scriptInfo.className = 'script-info';
        
        const title = document.createElement('div');
        title.className = 'script-title';
        title.textContent = script.title;
        
        const description = document.createElement('div');
        description.className = 'script-description';
        description.textContent = script.description || 'No description available';
        
        scriptInfo.appendChild(title);
        scriptInfo.appendChild(description);
        
        const scriptActions = document.createElement('div');
        scriptActions.className = 'script-actions';
        
        const launchBtn = document.createElement('button');
        launchBtn.className = 'btn-action';
        launchBtn.textContent = 'Launch';
        launchBtn.addEventListener('click', () => {
            launchScript(script.id);
        });
        
        scriptActions.appendChild(launchBtn);
        
        if (script.isLocal) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-action';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                deleteScript(script.id);
            });
            scriptActions.appendChild(deleteBtn);
        }
        
        listItem.appendChild(scriptInfo);
        listItem.appendChild(scriptActions);
        scriptList.appendChild(listItem);
    });
}

/**
 * Launch a script in the main application
 * @param {string} scriptId - The ID of the script to launch
 */
function launchScript(scriptId) {
    localStorage.setItem('active_script_id', scriptId);
    window.location.href = 'index.html';
}

/**
 * Delete a script from localStorage
 * @param {string} scriptId - The ID of the script to delete
 */
async function deleteScript(scriptId) {
    const scriptKey = `memorial_script_${scriptId}`;
    localStorage.removeItem(scriptKey);
    
    const activeScriptId = localStorage.getItem('active_script_id');
    if (activeScriptId === scriptId) {
        localStorage.removeItem('active_script_id');
    }
    
    await loadAvailableScripts();
    showStatusMessage('Script deleted successfully', 'success');
}

/**
 * Show a status message
 * @param {string} message - The message to show
 * @param {string} type - The type of message (success or error)
 */
function showStatusMessage(message, type = 'success') {
    const statusElement = document.querySelector('.status-message');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // Clear the message after 5 seconds
    setTimeout(() => {
        statusElement.className = 'status-message';
    }, 5000);
}

// Initialize admin when page loads
document.addEventListener('DOMContentLoaded', initializeAdmin);
