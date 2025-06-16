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
        // Get scripts from server
        const serverScripts = [
            {
                id: 'memorial_script',
                path: './scripts/memorial_script.json',
                title: 'Memorial Conversation',
                source: 'server'
            },
            {
                id: 'welcome_script',
                path: './scripts/welcome_script.json',
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
                    
                    localScripts.push({
                        id: scriptId,
                        title: scriptData.metadata?.title || scriptId,
                        source: 'local',
                        data: scriptData
                    });
                } catch (e) {
                    console.error(`Error parsing script from localStorage (${key}):`, e);
                }
            }
        }
        
        // Combine scripts, with local versions taking precedence
        const combinedScripts = [...serverScripts];
        
        localScripts.forEach(localScript => {
            const existingIndex = combinedScripts.findIndex(s => s.id === localScript.id);
            if (existingIndex >= 0) {
                combinedScripts[existingIndex] = localScript;
            } else {
                combinedScripts.push(localScript);
            }
        });
        
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
        
        // Check if this is a locally stored script (from admin page)
        if (scriptToLoad.source === 'local' && scriptToLoad.data) {
            console.log(`Loading script ${scriptToLoad.title} from localStorage`);
            const scriptData = scriptToLoad.data;
            initializeConversation(scriptData);
            return scriptData;
        }
        
        // Otherwise load from server path
        console.log(`Found script: ${scriptToLoad.title}, fetching from ${scriptToLoad.path}`);
        const response = await fetch(scriptToLoad.path);
        if (!response.ok) {
            throw new Error(`Failed to load script: ${response.statusText}`);
        }
        
        const scriptData = await response.json();
        console.log('Script data loaded successfully:', scriptData.title);
        
        // Reset conversation state
        currentStep = 0;
        conversationData = scriptData;
        conversation = scriptData.conversation || [];
        console.log(`Conversation steps loaded: ${conversation.length}`);
        
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
    } else {
        document.getElementById('preview-title').textContent = 'Current Progress';
        document.getElementById('preview-description').textContent = 'Your memorial is just getting started. As we continue, you\'ll see your objects appear here.';
        
        const placeholder = document.querySelector('.object-placeholder');
        placeholder.innerHTML = `
            <div class="placeholder-icon">🚧</div>
            <div><strong>In Progress</strong></div>
            <div style="font-size: 0.8em; margin-top: 5px;">Dr. Ramon Serrano</div>
            <div style="font-size: 0.7em; margin-top: 10px; color: #999;">Building your Life Journey Timeline...</div>
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
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Click anywhere to advance conversation (except on buttons/inputs that have their own handlers)
    document.addEventListener('click', function(e) {
        const objectPreview = document.getElementById('object-preview');
        if (!e.target.closest('.action-btn') && 
            !e.target.closest('.close-btn') && 
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
