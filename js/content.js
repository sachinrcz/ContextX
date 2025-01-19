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
        // Get the stored GPT version
        const gptVersion = await new Promise((resolve) => {
            chrome.storage.local.get(['gptVersion'], (result) => {
                resolve(result.gptVersion || 'gpt-3.5-turbo'); // Default to GPT-3.5 if not set
            });
        });

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: gptVersion,
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
    
    // Get only direct text content, excluding children
    let text = '';
    for (let node of clone.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        }
    }
    
    return text.trim();
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
        padding: 2px 4px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
    `;
    return button;
}

// Add this new function before handleContextButtonClick
function createCloseButton(responseDiv) {
    const closeButton = document.createElement('button');
    closeButton.textContent = 'x';
    closeButton.style.cssText = `
        position: absolute;
        right: 5px;
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
    return closeButton;
}

// Function to handle context button clicks
function handleContextButtonClick(text, button) {
    getApiKey((key) => {
        (async () => {

            // V1 : Quality is good, response a bit too lenghty, slow.
            //const contextResponse = await sendPrompt("Provide context to the facts stated in the following snippet. Pleas respond in the same language as the snippet.: " + text , key);

            // V2
            // const contextResponse = await sendPrompt("Provide context to the facts stated" + 
            //     " in the text at the end of this prompt. Cover" +
            //     " different views on the topic including a scientific perspective." +
            //     " resources and reasoning to asses the credibility of the facts stated. " +                 
            //     " Translate your response to the same language as the language of the text provided. Here is the text: " + text , key);

            const contextResponse = await sendPrompt(
                " Step 1: Analyse the snippet at the end of this prompt and determine what language it was written in. Remember this as the \"Question language\" " +
                " Step 2: Provide context to the facts stated in the snippet." + 
                " Cover different views on the topic including a scientific perspective." +
                " resources and reasoning to asses the credibility of the facts stated. " + 
                " Don't mention the language or steps analysis in the response." +                
                " Your responses must be in the \"Question language\" Here is the snippet: " + text , key);
            

            
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
                
                responseDiv.appendChild(createCloseButton(responseDiv));
                document.body.appendChild(responseDiv);
            }
            
            // Add content wrapper div to prevent close button overlap
            responseDiv.innerHTML = `
                <div style="padding-right: 20px;">
                    <p>${contextResponse}</p>
                </div>
            `;
            
            // Re-append close button
            responseDiv.appendChild(createCloseButton(responseDiv));
        })();
    });
}

// Process the page on load
function initializeContextButtons() {
    console.log("Initialeze buttons  starting");
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
            element.style.position = 'relative';
            element.style.display = 'inline-block';

            const contextButton = createContextButton();
            contextButton.addEventListener('click', () => {
                handleContextButtonClick(cleanText, contextButton);
            });
            
            element.appendChild(contextButton);
        }
    });
}

// Replace the MutationObserver code with this new implementation
function initializeWithRetry() {
    // Initial processing
    console.log("Initialeze with retry starting");
    initializeContextButtons();
    
    let attempts = 0;
    const maxAttempts = 10;
    const interval = 1000; // Check every second
    
    // Periodic check for new content
    const checkInterval = setInterval(() => {
        attempts++;
        initializeContextButtons();
        
        // Stop checking after maxAttempts
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
        }
    }, interval);
    
    // Process on scroll (debounced)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            initializeContextButtons();
        }, 250); // Wait 250ms after scroll stops
    });
    
    // Process on click (debounced)
    let clickTimeout;
    document.addEventListener('click', () => {
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            initializeContextButtons();
        }, 250);
    });
}

// Start the initialization process when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithRetry);
} else {
    // If DOMContentLoaded has already fired, run immediately
    initializeWithRetry();
}
console.log("Script loaded!");
// Remove the existing MutationObserver code
// Delete or comment out the previous window.contextButtonObserver code