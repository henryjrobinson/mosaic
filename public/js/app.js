// Global variables
let currentStep = 0;
let conversationData = {};
let availableScripts = [];
let conversation = [];

/**
 * Fetches the list of available scripts from both server and localStorage
 * @returns {Promise} Promise resolving to array of script metadata
 */
async function fetchAvailableScripts() {
    try {
        console.log('Fetching available scripts...');
        
        // Get scripts from server - using relative paths that work on both localhost and Netlify
        const serverScripts = [
            {
                id: 'memorial_script',
                path: 'scripts/memorial_script.json',
                title: 'Memorial Conversation',
                source: 'server'
            },
            {
                id: 'welcome_script',
                path: 'scripts/welcome_script.json',
                title: 'Welcome Tour',
                source: 'server'
            }
        ];
        
        // Get scripts from localStorage (added via admin page)
        const localScripts = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('memorial_script_')) {
                try {
                    const scriptData = JSON.parse(localStorage.getItem(key));
                    const scriptId = key.replace('memorial_script_', '');
                    
                    console.log(`Found local script: ${scriptId}`, scriptData);
                    
                    localScripts.push({
                        id: scriptId,
                        title: scriptData.metadata?.title || scriptId,
                        description: scriptData.metadata?.description || '',
                        source: 'local',
                        data: scriptData,
                        isLocal: true
                    });
                } catch (e) {
                    console.error(`Error parsing script from localStorage (${key}):`, e);
                }
            }
        }
        
        // Combine scripts, with local versions taking precedence
        const combinedScripts = [...serverScripts];
        
        if (localScripts.length > 0) {
            console.log(`Found ${localScripts.length} local scripts to add/override`);
        }
        
        localScripts.forEach(localScript => {
            console.log(`Processing local script: ${localScript.id}`);
            const existingIndex = combinedScripts.findIndex(s => s.id === localScript.id);
            if (existingIndex >= 0) {
                console.log(`  - Replacing server script with local version: ${localScript.id}`);
                combinedScripts[existingIndex] = localScript;
            } else {
                console.log(`  - Adding new local script: ${localScript.id}`);
                combinedScripts.push(localScript);
            }
        });
        
        console.log('Final available scripts:', combinedScripts);
        return combinedScripts;
    } catch (error) {
        console.error('Error fetching available scripts:', error);
        return [];
    }
}

/**
 * Loads a specific script by ID
 * @param {string} scriptId - The ID of the script to load
 * @returns {Promise} Promise resolving to the loaded script
 */
async function loadScript(scriptId) {
    try {
        console.log(`Attempting to load script with ID: ${scriptId}`);
        const scriptToLoad = availableScripts.find(script => script.id === scriptId);
        if (!scriptToLoad) {
            throw new Error(`Script with ID ${scriptId} not found`);
        }
        
        let scriptData;
        
        // Check if this is a locally stored script (from admin page)
        if (scriptToLoad.source === 'local' && scriptToLoad.data) {
            console.log(`Loading script ${scriptToLoad.title} from localStorage`);
            scriptData = scriptToLoad.data;
        } else {
            // Otherwise load from server path
            console.log(`Found script: ${scriptToLoad.title}, fetching from ${scriptToLoad.path}`);
            const response = await fetch(scriptToLoad.path);
            if (!response.ok) {
                throw new Error(`Failed to load script: ${response.statusText}`);
            }
            
            scriptData = await response.json();
            console.log('Script data loaded successfully from server');
        }

        // Ensure script data has consistent structure
        if (!scriptData) {
            throw new Error('Script data is empty or invalid');
        }
        
        console.log('Script data structure:', scriptData);
        
        // Standardize script data structure
        if (!scriptData.metadata) {
            console.log('Adding missing metadata to script');
            scriptData.metadata = {
                title: scriptData.title || 'Untitled Script',
                description: scriptData.description || '',
                id: scriptId
            };
        }
        
        // Check if conversation array exists
        if (!scriptData.conversation || !Array.isArray(scriptData.conversation) || scriptData.conversation.length === 0) {
            throw new Error('Script has no valid conversation data');
        }
        
        // Reset conversation state
        currentStep = 0;
        conversationData = scriptData;
        conversation = scriptData.conversation;
        console.log(`Conversation steps loaded: ${conversation.length}`);
        
        // Store this as the active script
        localStorage.setItem('active_script_id', scriptId);
        
        // Clear any existing messages
        document.getElementById('chat-messages').innerHTML = '';
        
        // Start the conversation
        setTimeout(() => {
            nextStep();
        }, 1000);
        
        return scriptData;
    } catch (error) {
        console.error('Error loading script:', error);
        showError(`Failed to load script: ${error.message}`);
        return null;
    }
}

/**
 * Displays a system message to the user
 * @param {string} message - The message to display
 * @param {string} type - Type of message ('error', 'info', 'success')
 */
function showSystemMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message system ${type}`;
    messageDiv.textContent = type === 'error' ? `Error: ${message}` : message;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Automatically remove info and success messages after a delay
    if (type !== 'error') {
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 1000); // Fade-out animation duration
        }, 3000); // Display duration
    }
}

/**
 * Displays an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    showSystemMessage(message, 'error');
}

/**
 * Checks for active script selected in admin page
 * @returns {string|null} - ID of active script or null if none selected
 */
function getActiveScriptFromAdmin() {
    return localStorage.getItem('active_script_id');
}

/**
 * Chat UI Controller
 * @param {string} type - 'ai' or 'user'
 * @param {string} message - Message content
 * @param {boolean} showSuggestions - Whether to show suggested responses (now disabled per requirements)
 * @param {Array} suggestions - Array of suggestion strings
 */
function addMessage(type, message, showSuggestions = false, suggestions = []) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = type === 'ai' ? '🤖' : '👤';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message;
    
    if (type === 'ai') {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    } else {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
    }
    
    messagesContainer.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('show');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Suggestions have been disabled per requirements
        // Keeping the suggestions in the data model but not displaying them
    }, 100);
}

/**
 * Displays suggested responses as clickable buttons
 * @param {Array} suggestions - Array of suggestion strings
 * Note: This function is completely disabled
 */
function showSuggestedResponses(suggestions) {
    // Force remove any existing suggestion elements
    const suggestionsContainer = document.getElementById('suggested-responses');
    if (suggestionsContainer) {
        // Empty the container and remove any classes that would make it visible
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.remove('show');
    }
    return;
}

/**
 * Handles when a suggestion is selected
 * @param {string} text - The suggestion text
 * Note: This function has been disabled per requirements but kept for reference
 */
function selectSuggestion(text) {
    // Suggestions functionality disabled
    return;
}

/**
 * Shows the typing indicator
 */
function showTyping() {
    document.getElementById('typing-indicator').classList.add('show');
}

/**
 * Hides the typing indicator
 */
function hideTyping() {
    document.getElementById('typing-indicator').classList.remove('show');
}

/**
 * Hides the suggested responses
 * Completely removes any suggestion elements
 */
function hideSuggestions() {
    const suggestionsContainer = document.getElementById('suggested-responses');
    if (suggestionsContainer) {
        // Empty and hide
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.remove('show');
        
        // Add style to ensure it's really hidden
        suggestionsContainer.style.display = 'none';
    }
}

/**
 * Process buttons for conversation step
 * @param {Object} step - The current conversation step
 */
function processButtons(step) {
    const btnContainer = document.getElementById('buttons-container');
    if (!btnContainer) return;
    
    btnContainer.innerHTML = '';
    btnContainer.style.display = 'none';
    
    if (!step.buttons || step.buttons.length === 0) {
        return;
    }
    
    step.buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.classList.add('action-btn');
        
        if (button.action === 'input') {
            // Create input mode
            btn.addEventListener('click', function() {
                setInputMode(button.placeholder || 'Type your response...');
            });
        } 
        else if (button.action === 'next') {
            // Simple next step
            btn.addEventListener('click', nextStep);
        } 
        else if (button.action === 'show') {
            // Show something
            btn.addEventListener('click', function() {
                if (button.target === 'example') {
                    showExample(button.example_type || 'existing');
                } else if (button.target === 'memorial') {
                    showExample('memorial');
                }
            });
        }
        else if (button.action === 'viewMemorial') {
            // Show the memorial wireframe directly
            btn.addEventListener('click', function() {
                showMemorialPreview();
            });
        }
        
        btnContainer.appendChild(btn);
    });
    
    if (step.buttons.length > 0) {
        btnContainer.style.display = 'flex';
    }
}

/**
 * Advances to the next step in the conversation
 */
function nextStep() {
    if (currentStep < conversation.length) {
        const step = conversation[currentStep];
        
        // Remove any suggestions from the step data
        if (step.suggestions) {
            // Delete the suggestions property completely to ensure it's never processed
            delete step.suggestions;
        }
        
        if (step.type === 'ai') {
            showTyping();
            setTimeout(() => {
                hideTyping();
                // Always pass false and empty array for suggestions to ensure they never show
                addMessage('ai', step.message, false, []);
                
                if (step.final) {
                    setTimeout(() => {
                        showObjectPreview();
                    }, 2000);
                }
                
                // Check if we should show an example
                if (step.showExample) {
                    setTimeout(() => {
                        showExample(step.showExample);
                    }, 2000);
                }
                
                // Process buttons for this step if present
                if (step.buttons && step.buttons.length > 0) {
                    processButtons(step);
                }
            }, 1500);
        } else {
            // No need to call hideSuggestions since we've permanently removed them
            addMessage('user', step.message);
        }
        
        currentStep++;
    }
}

/**
 * Handles user input from the chat interface
 */
function handleInput() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
        // Removed hideSuggestions call as suggestions functionality is disabled
        addMessage('user', message);
        input.value = '';
        
        setTimeout(() => {
            nextStep();
        }, 1000);
    }
}

/**
 * Shows the object preview modal with timeline content
 */
function showObjectPreview() {
    document.getElementById('preview-title').textContent = 'Life Journey Timeline - Preview';
    document.getElementById('preview-description').textContent = 'Your Life Journey Timeline is ready! This interactive timeline will showcase the major milestones of your 49 years together, with photos and stories from each period.';
    
    const placeholder = document.querySelector('.object-placeholder');
    placeholder.innerHTML = `
        <div class="placeholder-icon">📅</div>
        <div><strong>Life Journey Timeline</strong></div>
        <div style="font-size: 0.8em; margin-top: 5px;">1976-2025: 49 Years Together</div>
        <div style="font-size: 0.7em; margin-top: 10px; color: #999;">Interactive timeline with photos, stories, and milestones</div>
    `;
    
    document.getElementById('object-preview').classList.add('show');
    document.getElementById('tap-hint').style.display = 'none';
}

/**
 * Closes the object preview modal
 */
function closePreview() {
    document.getElementById('object-preview').classList.remove('show');
}

/**
 * Shows example memorials
 * @param {string} type - 'existing' or 'current'
 */
function showExample(type) {
    if (type === 'existing') {
        document.getElementById('preview-title').textContent = 'Example: Complete Memorial Mosaic';
        document.getElementById('preview-description').textContent = 'This is an example of a complete memorial with multiple objects created by family and friends.';
        
        const placeholder = document.querySelector('.object-placeholder');
        placeholder.innerHTML = `
            <div class="placeholder-icon">🏛️</div>
            <div><strong>Example Memorial</strong></div>
            <div style="font-size: 0.8em; margin-top: 5px;">Dr. Sarah Chen (1952-2023)</div>
            <div style="font-size: 0.7em; margin-top: 10px; color: #999;">Timeline, Gallery, Impact Stories, Voice Memories</div>
        `;
    } else if (type === 'memorial') {
        // Open the memorial wireframe in a new window/iframe
        showMemorialPreview();
        return;
    } else {
        // For 'current' type, also show the memorial preview directly
        document.getElementById('preview-title').textContent = 'Current Progress: Memorial Preview';
        document.getElementById('preview-description').textContent = 'View the current memorial based on information collected so far.';
        
        const placeholder = document.querySelector('.object-placeholder');
        placeholder.innerHTML = `
            <div class="placeholder-icon">🏆</div>
            <div><strong>Dr. Ramon Serrano Memorial</strong></div>
            <div style="font-size: 0.8em; margin-top: 5px;">Ready to view</div>
            <button class="action-btn" style="margin-top: 15px; background-color: #3498db; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;" onclick="showMemorialPreview()">View Now</button>
        `;
    }
    
    document.getElementById('object-preview').classList.add('show');
}

/**
 * Convenience function to advance the conversation via click or input
 */
function advanceConversation() {
    const input = document.getElementById('chat-input');
    if (!input) {
        // If input doesn't exist, just try to advance to next step
        if (currentStep < conversation.length) {
            nextStep();
        }
        return;
    }
    
    const message = input.value.trim();
    const objectPreview = document.getElementById('object-preview');
    
    if (message) {
        handleInput();
    } else if (currentStep < conversation.length && (!objectPreview || !objectPreview.classList.contains('show'))) {
        nextStep();
    }
}

/**
 * Shows the memorial wireframe in a better integrated UI
 */
function showMemorialPreview() {
    // Create modal container if it doesn't exist
    let memorialModal = document.getElementById('memorial-preview-modal');
    
    if (!memorialModal) {
        // Create outer container
        memorialModal = document.createElement('div');
        memorialModal.id = 'memorial-preview-modal';
        memorialModal.className = 'memorial-modal';
        
        // Style outer container - not full screen anymore
        memorialModal.style.position = 'fixed';
        memorialModal.style.top = '50%';
        memorialModal.style.left = '50%';
        memorialModal.style.transform = 'translate(-50%, -50%)';
        memorialModal.style.width = '90%';
        memorialModal.style.maxWidth = '1200px';
        memorialModal.style.height = '85vh';
        memorialModal.style.backgroundColor = '#fff';
        memorialModal.style.borderRadius = '15px';
        memorialModal.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        memorialModal.style.zIndex = '9999';
        memorialModal.style.display = 'flex';
        memorialModal.style.flexDirection = 'column';
        memorialModal.style.opacity = '0';
        memorialModal.style.transition = 'all 0.3s ease';
        memorialModal.style.transform = 'translate(-50%, -48%) scale(0.98)';
        
        // Create a header bar that matches the chat interface styling
        const headerBar = document.createElement('div');
        headerBar.style.display = 'flex';
        headerBar.style.justifyContent = 'space-between';
        headerBar.style.alignItems = 'center';
        headerBar.style.padding = '10px 20px';
        headerBar.style.backgroundColor = '#3498db'; // Match the app's color theme
        headerBar.style.borderTopLeftRadius = '15px';
        headerBar.style.borderTopRightRadius = '15px';
        headerBar.style.color = 'white';
        
        // Add title to header
        const title = document.createElement('h2');
        title.textContent = 'Dr. Ramon Serrano - Memorial Preview';
        title.style.margin = '0';
        title.style.fontSize = '18px';
        headerBar.appendChild(title);
        
        // Add close button to header
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times; Return to Chat';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = 'white';
        closeBtn.style.border = '1px solid white';
        closeBtn.style.borderRadius = '5px';
        closeBtn.style.padding = '5px 12px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '14px';
        closeBtn.onmouseover = function() { 
            this.style.backgroundColor = 'rgba(255,255,255,0.2)';
        };
        closeBtn.onmouseout = function() { 
            this.style.backgroundColor = 'transparent';
        };
        closeBtn.onclick = closeMemorialPreview;
        headerBar.appendChild(closeBtn);
        
        // Add the header to the modal
        memorialModal.appendChild(headerBar);
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.flex = '1';
        contentContainer.style.position = 'relative';
        contentContainer.style.overflow = 'hidden';
        
        // Add iframe to display the memorial
        const iframe = document.createElement('iframe');
        iframe.src = 'ramon-memorial-wireframe.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        contentContainer.appendChild(iframe);
        memorialModal.appendChild(contentContainer);
        
        // Add a backdrop
        const backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.right = '0';
        backdrop.style.bottom = '0';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        backdrop.style.zIndex = '9998';
        backdrop.style.opacity = '0';
        backdrop.style.transition = 'opacity 0.3s ease';
        backdrop.onclick = closeMemorialPreview; // Close when backdrop is clicked
        backdrop.id = 'memorial-backdrop';
        
        document.body.appendChild(backdrop);
        document.body.appendChild(memorialModal);
        
        // Trigger animation
        setTimeout(() => {
            backdrop.style.opacity = '1';
            memorialModal.style.opacity = '1';
            memorialModal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    } else {
        // Re-show existing modal with animation
        const backdrop = document.getElementById('memorial-backdrop');
        memorialModal.style.display = 'flex';
        backdrop.style.display = 'block';
        
        setTimeout(() => {
            backdrop.style.opacity = '1';
            memorialModal.style.opacity = '1';
            memorialModal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    // Add a class to the body to prevent scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the memorial wireframe preview
 */
function closeMemorialPreview() {
    const memorialModal = document.getElementById('memorial-preview-modal');
    const backdrop = document.getElementById('memorial-backdrop');
    
    if (memorialModal) {
        // Run close animation
        memorialModal.style.opacity = '0';
        memorialModal.style.transform = 'translate(-50%, -45%) scale(0.95)';
        
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            memorialModal.style.display = 'none';
            if (backdrop) backdrop.style.display = 'none';
        }, 300);
    }
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Click anywhere to advance conversation (except on buttons/inputs that have their own handlers)
    document.addEventListener('click', function(e) {
        const objectPreview = document.getElementById('object-preview');
        const memorialModal = document.getElementById('memorial-preview-modal');
        if (!e.target.closest('.action-btn') && 
            !e.target.closest('.close-btn') && 
            (!memorialModal || memorialModal.style.display === 'none') &&
            !e.target.closest('.object-preview') &&
            currentStep < conversation.length && 
            objectPreview && !objectPreview.classList.contains('show')) {
            advanceConversation();
        }
    });
    
    // Add event listeners only if elements exist
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                advanceConversation();
            }
        });
        
        // Prevent the click anywhere from triggering when clicking input elements
        chatInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    const sendButton = document.querySelector('.send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', function(e) {
            e.stopPropagation();
            advanceConversation();
        });
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        // First verify that critical DOM elements exist
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            console.error('Critical DOM element missing: chat-messages');
            return; // Exit if critical elements are missing
        }
        
        // Set up event listeners after confirming DOM is ready
        setupEventListeners();
        
        // Show initial loading message
        showSystemMessage('Initializing application...', 'info');
        
        try {
            // Fetch available scripts
            showSystemMessage('Loading available scripts...', 'info');
            availableScripts = await fetchAvailableScripts();
            
            if (!availableScripts || availableScripts.length === 0) {
                showError('No scripts available');
                return;
            }
            
            showSystemMessage(`Found ${availableScripts.length} scripts`, 'success');
            
            // Check if a specific script was selected from admin page
            const activeScriptId = getActiveScriptFromAdmin();
            
            if (activeScriptId) {
                // Load the script selected in admin
                await loadScript(activeScriptId);
                const activeScript = availableScripts.find(s => s.id === activeScriptId);
                showSystemMessage(`Loaded script: ${activeScript?.title || activeScriptId}`, 'success');
            } else {
                // Load the default script if none selected
                await loadScript(availableScripts[0].id);
                showSystemMessage(`Loaded script: ${availableScripts[0].title}`, 'success');
            }
        } catch (error) {
            console.error('Error during script loading:', error);
            showError(`Script loading failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Critical application initialization error:', error);
        // Use alert as a last resort if DOM elements for messages don't exist
        alert(`Memorial Mosaic failed to initialize: ${error.message}`);
    }
}

// Safely initialize when DOM is ready
function safeInitialize() {
    try {
        initializeApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

// Initialize everything when page loads - using a safer approach
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
    // DOM already loaded, initialize now
    setTimeout(safeInitialize, 0); // Use setTimeout to prevent blocking the main thread
}
