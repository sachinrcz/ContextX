const endpoint = "https://api.openai.com/v1/chat/completions";
const apiKey = "";

// Retrieve the key
function getApiKey(callback) {
    chrome.storage.local.get(['apiKey'], (result) => {
        const decryptedKey = result.apiKey ? atob(result.apiKey) : null;
        callback(decryptedKey);
    });
}

async function sendPrompt(prompt, apiKey) {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4", // or "gpt-3.5-turbo"
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Unknown error occurred");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Create a function to process text content (strip HTML and count chars)
function getCleanTextContent(element) {
    // Create a clone of the element to manipulate
    const clone = element.cloneNode(true);
    
    // Remove all nav elements from the clone
    const navElements = clone.getElementsByTagName('nav');
    for (let i = navElements.length - 1; i >= 0; i--) {
        navElements[i].remove();
    }
    
    // Remove any context buttons we've added
    const contextButtons = clone.querySelectorAll('button');
    contextButtons.forEach(button => {
        if (button.textContent === 'C') {
            button.remove();
        }
    });
    
    // Remove any existing context response divs
    const responseElements = clone.querySelectorAll('.context-response');
    responseElements.forEach(elem => elem.remove());
    
    return clone.innerText.trim();
}

// Create and style the context button
function createContextButton() {
    const button = document.createElement('button');
    button.textContent = 'C';
    button.dataset.contextButton = 'true';
    button.style.cssText = `
        position: absolute;
        right: 0px;
        top: 0px;
        background-color: red;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    `;
    return button;
}

// Function to handle context button clicks
function handleContextButtonClick(text, button) {
    getApiKey((key) => {
        (async () => {
            const contextResponse = await sendPrompt("Provide context to the facts stated in the following snippet. Pleas respond in the same language as the snippet.: " + text , key);
            
            // Get button position relative to the document
            const buttonRect = button.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const buttonTop = buttonRect.top + scrollTop;
            console.log(buttonRect);
            const buttonRight = window.innerWidth - buttonRect.right;
            
            // Create or update response container
            let responseDiv = document.querySelector(`[data-response-for="${button.dataset.uniqueId}"]`);
            if (!responseDiv) {
                responseDiv = document.createElement('div');
                responseDiv.classList.add('context-response');
                // Add a unique identifier to link the response to its button
                const uniqueId = 'context-' + Date.now();
                button.dataset.uniqueId = uniqueId;
                responseDiv.dataset.responseFor = uniqueId;
                
                responseDiv.style.cssText = `
                    position: absolute;
                    right: ${buttonRight}px;
                    top: ${buttonTop + buttonRect.height + 5}px;
                    width: 300px;
                    max-height: 80vh;
                    overflow-y: auto;
                    background-color: white;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                    color: #666;
                `;
                
                // Create close button
                const closeButton = document.createElement('button');
                closeButton.textContent = 'close (X)';
                closeButton.style.cssText = `
                    position: absolute;
                    left: 5px;
                    top: 5px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    color: #666;
                    padding: 2px 6px;
                `;
                closeButton.addEventListener('click', () => {
                    responseDiv.remove();
                });
                
                responseDiv.appendChild(closeButton);
                document.body.appendChild(responseDiv);
            }
            
            // Add content wrapper div to prevent close button overlap
            responseDiv.innerHTML = `
                <div style="padding-right: 20px;">
                    <p>${contextResponse}</p>
                </div>
            `;
            
            // Re-append close button since innerHTML overwrote it
            const closeButton = document.createElement('button');
            closeButton.textContent = 'close (X)';
            closeButton.style.cssText = `
                position: absolute;
                left: 5px;
                top: 5px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                padding: 2px 6px;
            `;
            closeButton.addEventListener('click', () => {
                responseDiv.remove();
            });
            responseDiv.appendChild(closeButton);
        })();
    });
}

// Process the page on load
function initializeContextButtons() {
    // Temporarily disconnect the observer if it exists
    if (window.contextButtonObserver) {
        window.contextButtonObserver.disconnect();
    }

    // Select all major content elements
    const elements = document.body.querySelectorAll('p, div, span, article, section');
    
    elements.forEach(element => {
        // Skip elements that are parents of elements that already have context buttons
        if (element.querySelector('[data-context-button="true"]')) {
            return;
        }
        
        // Skip context-response elements and their children
        if (element.classList.contains('context-response') || 
            element.closest('.context-response')) {
            return;
        }
        
        const cleanText = getCleanTextContent(element);
        
        if (cleanText.length >= 30) {
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.position === 'static') {
                element.style.position = 'relative';
            }
            
            const contextButton = createContextButton();
            contextButton.addEventListener('click', () => {
                handleContextButtonClick(cleanText, contextButton);
            });
            
            element.appendChild(contextButton);
        }
    });

    // Reconnect the observer if it exists
    if (window.contextButtonObserver) {
        window.contextButtonObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Use DOMContentLoaded for initial load
// document.addEventListener('DOMContentLoaded', initializeContextButtons);

// Use MutationObserver to handle dynamically loaded content
window.contextButtonObserver = new MutationObserver((mutations) => {
    // Check if any of the mutations are our own button additions
    const shouldProcess = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).every(node => {
            return !(node instanceof HTMLButtonElement && node.textContent === 'C');
        });
    });

    if (shouldProcess) {
        initializeContextButtons();
    }
});

// Start observing the document with the configured parameters
window.contextButtonObserver.observe(document.body, {
    childList: true,
    subtree: true
});



