// Global variables
let currentStep = 0;
let script = null;
let isTyping = false;
let scriptList = [];
let agentMetadataVisible = true; // Track toggle state

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    fetchAvailableScripts();
    
    // Initialize agent metadata toggle
    const toggle = document.getElementById('agent-metadata-toggle');
    if (toggle) {
        toggle.addEventListener('change', function() {
            agentMetadataVisible = this.checked;
            toggleAgentMetadataVisibility();
        });
        // Set initial state
        agentMetadataVisible = toggle.checked;
    }
    
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleInput();
            }
        });
    }
    
    // Add global click listener for manual conversation advancement
    document.addEventListener('click', function(e) {
        // Skip if user is clicking on UI elements or input fields
        if (e.target.closest('input, button, select, textarea, .toggle-switch, .script-option, #agent-metadata-toggle')) {
            return;
        }
        
        // Only advance if we have a script loaded and not at the end
        if (script && script.conversation && currentStep < script.conversation.length) {
            console.log('Manual advancement triggered by click');
            nextStep();
        }
    });
});

/**
 * Fetches available scripts including enhanced agent conversation files
 */
async function fetchAvailableScripts() {
    try {
        console.log('fetchAvailableScripts: Loading scripts from file system only...');
        
        const scriptPaths = [
            'scripts/welcome_script.json',
            'scripts/ramon-serrano-memorial-with primitives.json',
            'json-enhancement/nursing-home-conversation.json'
        ];
        
        console.log('fetchAvailableScripts: Attempting to load paths:', scriptPaths);
        
        const scriptPromises = scriptPaths.map(async (path) => {
            try {
                console.log(`fetchAvailableScripts: Fetching ${path}...`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`fetchAvailableScripts: Successfully loaded ${path}:`, data.title);
                    return {
                        title: data.title || path.split('/').pop().replace('.json', ''),
                        description: data.description || 'No description available',
                        path: path,
                        tags: data.tags || [],
                        hasAgents: data.conversation && data.conversation.some(step => step.activeAgents)
                    };
                } else {
                    console.log(`fetchAvailableScripts: Failed to load ${path}: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log(`fetchAvailableScripts: Error loading ${path}:`, error);
            }
            return null;
        });
        
        const results = await Promise.all(scriptPromises);
        scriptList = results.filter(script => script !== null);
        
        console.log('fetchAvailableScripts: Final script list:', scriptList);
        displayScriptSelection();
    } catch (error) {
        console.error('Error fetching scripts:', error);
        addMessage('ai', 'Sorry, I had trouble loading the available scripts. Please refresh the page to try again.');
    }
}

/**
 * Display script selection interface
 */
function displayScriptSelection() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = ''; // Clear existing content
    
    // Welcome message
    addMessage('ai', `Hello! I'm your Memorial Mosaic assistant. I have ${scriptList.length} conversation scripts available. Please select one to begin:`, false, []);
    
    // Create script selection buttons
    const scriptDiv = document.createElement('div');
    scriptDiv.className = 'script-selection';
    scriptDiv.style.cssText = 'margin: 20px 0; display: flex; flex-direction: column; gap: 10px;';
    
    scriptList.forEach((script, index) => {
        const button = document.createElement('button');
        button.className = 'script-btn';
        button.style.cssText = `
            padding: 15px;
            border: 2px solid #3498db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            transition: all 0.3s ease;
        `;
        
        const agentBadge = script.hasAgents ? ' 🤖 Enhanced with Agent Data' : '';
        
        button.innerHTML = `
            <div style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">
                ${script.title}${agentBadge}
            </div>
            <div style="font-size: 0.9em; color: #7f8c8d; line-height: 1.4;">
                ${script.description}
            </div>
            ${script.tags.length > 0 ? `<div style="margin-top: 8px; font-size: 0.8em; color: #95a5a6;">Tags: ${script.tags.join(', ')}</div>` : ''}
        `;
        
        button.addEventListener('click', () => loadScript(script.path));
        button.addEventListener('mouseover', () => {
            button.style.background = '#f8f9fa';
            button.style.borderColor = '#2980b9';
        });
        button.addEventListener('mouseout', () => {
            button.style.background = 'white';
            button.style.borderColor = '#3498db';
        });
        
        scriptDiv.appendChild(button);
    });
    
    // Add the script selection to the last message
    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage) {
        lastMessage.querySelector('.message-bubble').appendChild(scriptDiv);
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
        const scriptToLoad = scriptList.find(script => script.path === scriptId);
        if (!scriptToLoad) {
            throw new Error(`Script with ID ${scriptId} not found`);
        }
        
        let scriptData;
        
        // Otherwise load from server path
        console.log(`Found script: ${scriptToLoad.title}, fetching from ${scriptToLoad.path}`);
        const response = await fetch(scriptToLoad.path);
        if (!response.ok) {
            throw new Error(`Failed to load script: ${response.statusText}`);
        }
        
        scriptData = await response.json();
        console.log('Script data loaded successfully from server');
        
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
        script = scriptData;
        console.log(`Conversation steps loaded: ${scriptData.conversation.length}`);
        
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
 * Chat UI Controller
 * @param {string} type - 'ai' or 'user'
 * @param {string} message - Message content
 * @param {boolean} showSuggestions - Whether to show suggested responses (now disabled per requirements)
 * @param {Array} suggestions - Array of suggestion strings
 * @param {Object} activeAgents - Agent information for AI messages
 */
function addMessage(type, message, showSuggestions = false, suggestions = [], activeAgents = null) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = type === 'ai' ? '🤖' : '👤';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Add agent information for AI messages
    if (type === 'ai' && activeAgents && agentMetadataVisible) {
        const agentInfo = createAgentInfoDisplay(activeAgents);
        bubble.appendChild(agentInfo);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    bubble.appendChild(messageContent);
    
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
 * Creates the agent information display for AI messages
 * @param {Object} activeAgents - Object containing active agent information
 * @returns {HTMLElement} DOM element with agent info
 */
function createAgentInfoDisplay(activeAgents) {
    const agentContainer = document.createElement('div');
    agentContainer.className = agentMetadataVisible ? 'agent-info' : 'agent-info hidden';
    
    const agentNames = Object.keys(activeAgents);
    
    if (agentNames.length === 1) {
        // Single agent
        const agentName = agentNames[0];
        const agentBadge = createAgentBadge(agentName, activeAgents[agentName]);
        agentContainer.appendChild(agentBadge);
        
        // Add metadata if available
        if (hasAgentMetadata(activeAgents[agentName])) {
            const metadataContainer = createAgentMetadata(activeAgents[agentName]);
            agentContainer.appendChild(metadataContainer);
        }
    } else if (agentNames.length > 1) {
        // Multiple agents
        const collaborativeLabel = document.createElement('div');
        collaborativeLabel.className = 'collaborative-label';
        collaborativeLabel.textContent = 'Collaborative Response';
        agentContainer.appendChild(collaborativeLabel);
        
        const agentsList = document.createElement('div');
        agentsList.className = 'agents-list';
        
        agentNames.forEach(agentName => {
            const agentBadge = createAgentBadge(agentName, activeAgents[agentName], true);
            agentsList.appendChild(agentBadge);
        });
        
        agentContainer.appendChild(agentsList);
        
        // Add collaborative metadata if any agent has metadata
        const hasMetadata = agentNames.some(name => hasAgentMetadata(activeAgents[name]));
        if (hasMetadata) {
            const metadataContainer = createCollaborativeMetadata(activeAgents);
            agentContainer.appendChild(metadataContainer);
        }
    }
    
    return agentContainer;
}

/**
 * Creates a badge for an individual agent
 * @param {string} agentName - Name of the agent
 * @param {Object} agentData - Agent's role data
 * @param {boolean} isCompact - Whether to show compact version
 * @returns {HTMLElement} Agent badge element
 */
function createAgentBadge(agentName, agentData, isCompact = false) {
    const badge = document.createElement('div');
    badge.className = `agent-badge agent-${agentName}`;
    
    const agentIcon = getAgentIcon(agentName);
    const agentDisplayName = getAgentDisplayName(agentName);
    
    if (isCompact) {
        badge.innerHTML = `
            <span class="agent-icon">${agentIcon}</span>
            <span class="agent-name">${agentDisplayName}</span>
        `;
    } else {
        const roles = getAllAgentRoles(agentData);
        badge.innerHTML = `
            <div class="agent-header">
                <span class="agent-icon">${agentIcon}</span>
                <span class="agent-name">${agentDisplayName}</span>
            </div>
            <div class="agent-roles">${roles.join(' • ')}</div>
        `;
    }
    
    // Add tooltip with detailed information
    badge.title = createAgentTooltip(agentName, agentData);
    
    return badge;
}

/**
 * Gets the icon for an agent type
 * @param {string} agentName - Name of the agent
 * @returns {string} Icon character
 */
function getAgentIcon(agentName) {
    const agentIcons = {
        'collaborator': '🤝',
        'archiver': '📚',
        'curator': '🎨',
        'analyst': '📊',
        'storyteller': '📖',
        'technical': '⚙️',
        'default': '🤖'
    };
    return agentIcons[agentName] || agentIcons.default;
}

/**
 * Gets the display name for an agent
 * @param {string} agentName - Name of the agent
 * @returns {string} Human-readable display name
 */
function getAgentDisplayName(agentName) {
    const displayNames = {
        'collaborator': 'Collaborator',
        'archiver': 'Memory Keeper',
        'curator': 'Content Curator',
        'analyst': 'Data Analyst',
        'storyteller': 'Storyteller',
        'technical': 'Technical Lead'
    };
    return displayNames[agentName] || agentName.charAt(0).toUpperCase() + agentName.slice(1);
}

/**
 * Extracts all roles from agent data
 * @param {Object} agentData - Agent's role information
 * @returns {Array} Array of role descriptions
 */
function getAllAgentRoles(agentData) {
    const roles = [];
    Object.keys(agentData).forEach(roleType => {
        if (Array.isArray(agentData[roleType])) {
            roles.push(...agentData[roleType]);
        }
    });
    return roles;
}

/**
 * Creates tooltip text for an agent
 * @param {string} agentName - Name of the agent
 * @param {Object} agentData - Agent's role data
 * @returns {string} Tooltip text
 */
function createAgentTooltip(agentName, agentData) {
    const displayName = getAgentDisplayName(agentName);
    const tooltip = [`${displayName} is actively:`];
    
    Object.keys(agentData).forEach(roleType => {
        if (Array.isArray(agentData[roleType]) && agentData[roleType].length > 0) {
            tooltip.push(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)}: ${agentData[roleType].join(', ')}`);
        }
    });
    
    return tooltip.join('\n');
}

/**
 * Check if agent has metadata beyond just roles
 * @param {Object} agentData - Agent's role and metadata information
 * @returns {boolean} Whether the agent has metadata
 */
function hasAgentMetadata(agentData) {
    const metadataKeys = ['extraction', 'analysis', 'outputs', 'storing', 'privateStorage', 
                          'updating', 'flagging', 'retrieving', 'building', 'preparing'];
    return metadataKeys.some(key => agentData[key] && agentData[key].length > 0);
}

/**
 * Create metadata display for single agent
 * @param {Object} agentData - Agent's role and metadata information
 * @returns {HTMLElement} Agent metadata container
 */
function createAgentMetadata(agentData) {
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'agent-metadata';
    
    // Define metadata sections with labels and styling
    const metadataSections = [
        { key: 'extraction', label: 'Extracting', class: '' },
        { key: 'analysis', label: 'Analyzing', class: '' },
        { key: 'outputs', label: 'Outputting', class: '' },
        { key: 'storing', label: 'Storing', class: '' },
        { key: 'updating', label: 'Updating', class: 'update' },
        { key: 'retrieving', label: 'Retrieving', class: '' },
        { key: 'building', label: 'Building', class: '' },
        { key: 'preparing', label: 'Preparing', class: '' },
        { key: 'privateStorage', label: 'Private Data', class: 'private' },
        { key: 'flagging', label: 'Flags', class: 'flag' }
    ];
    
    metadataSections.forEach(section => {
        if (agentData[section.key] && agentData[section.key].length > 0) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'metadata-section';
            
            const label = document.createElement('span');
            label.className = 'metadata-label';
            label.textContent = section.label;
            sectionDiv.appendChild(label);
            
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'metadata-items';
            
            agentData[section.key].forEach(item => {
                const itemElement = document.createElement('span');
                itemElement.className = `metadata-item ${section.class}`;
                
                // Handle different types of metadata items
                if (typeof item === 'string') {
                    itemElement.textContent = item;
                } else if (typeof item === 'object') {
                    // For structured data, show a summary
                    itemElement.textContent = item.name || item.category || JSON.stringify(item).substring(0, 30) + '...';
                    itemElement.title = JSON.stringify(item, null, 2);
                }
                
                itemsContainer.appendChild(itemElement);
            });
            
            sectionDiv.appendChild(itemsContainer);
            metadataContainer.appendChild(sectionDiv);
        }
    });
    
    return metadataContainer;
}

/**
 * Create collaborative metadata display
 * @param {Object} activeAgents - Object containing active agent information
 * @returns {HTMLElement} Collaborative metadata container
 */
function createCollaborativeMetadata(activeAgents) {
    const collaborativeMetadata = document.createElement('div');
    collaborativeMetadata.className = 'collaborative-metadata';
    
    Object.keys(activeAgents).forEach(agentName => {
        const agentData = activeAgents[agentName];
        if (hasAgentMetadata(agentData)) {
            const agentCard = document.createElement('div');
            agentCard.className = `agent-metadata-card agent-${agentName.toLowerCase()}`;
            
            const agentHeader = document.createElement('div');
            agentHeader.className = 'agent-name';
            agentHeader.textContent = getAgentDisplayName(agentName);
            agentCard.appendChild(agentHeader);
            
            const metadata = createAgentMetadata(agentData);
            agentCard.appendChild(metadata);
            
            collaborativeMetadata.appendChild(agentCard);
        }
    });
    
    return collaborativeMetadata;
}

/**
 * Toggle agent metadata visibility
 */
function toggleAgentMetadataVisibility() {
    const agentInfoElements = document.querySelectorAll('.agent-info');
    agentInfoElements.forEach(element => {
        if (agentMetadataVisible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

/**
 * Proceeds to the next step in the conversation
 */
function nextStep() {
    console.log('nextStep() called - currentStep:', currentStep, 'total steps:', script ? script.conversation.length : 'no script');
    
    if (!script || !script.conversation) {
        console.error('nextStep() - No script or conversation loaded');
        return;
    }
    
    if (script.conversation.length > currentStep) {
        const currentStepData = script.conversation[currentStep];
        console.log('nextStep() - Processing step:', currentStep, 'data:', currentStepData);
        
        const message = currentStepData.message;
        const messageType = currentStepData.type || 'ai'; // Use actual type from step data
        const activeAgents = currentStepData.activeAgents;
        
        addMessage(messageType, message, false, [], activeAgents);
        
        currentStep++;
        console.log('nextStep() - Advanced to step:', currentStep);
    } else {
        console.log('nextStep() - Reached end of conversation');
    }
}

/**
 * Handles user input
 */
function handleInput() {
    const input = document.getElementById('chat-input');
    const userInput = input.value.trim();
    
    if (userInput) {
        addMessage('user', userInput);
        
        // Clear input field
        input.value = '';
        
        // Simulate AI response after a delay
        setTimeout(() => {
            nextStep();
        }, 1000);
    }
}

/**
 * Returns user to the conversation loading screen
 */
function backToAgent() {
    // Reset the application state
    currentStep = 0;
    script = null;
    isTyping = false;
    
    // Clear the chat messages
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Hide typing indicator
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
    
    // Hide buttons container
    const buttonsContainer = document.getElementById('buttons-container');
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
    }
    
    // Show the script selection interface
    fetchAvailableScripts();
}
