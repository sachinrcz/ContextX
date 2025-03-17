const contextEndPoint ="https://contextx-api.devicion.com/api/contextx/analyze";
const apiKey = "";

// Retrieve the key
function getApiKey(callback) {
    chrome.storage.local.get(['apiKey'], (result) => {
        const decryptedKey = result.apiKey ? atob(result.apiKey) : null;
        callback(decryptedKey);
    });
}

function ct_heading(text) {
    const heading = document.createElement('h1');
    heading.classList.add('ct-heading');
    heading.textContent = text;
    return heading;
}


async function sendPrompt(prompt, apiKey) {
    try {
        const response = await fetch(contextEndPoint, {
            method: "POST",
            headers: {
                "Authorization": `Api-Key ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Unknown error occurred");
        }

        const data = await response.json();
        console.log(data);
        return data.response;
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
    const responseElements = clone.querySelectorAll('.ct-response *');
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

    //load icon as img
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('/styles/icons/close.svg');
    closeButton.appendChild(img);
    closeButton.style.cssText = `
        position: absolute;
        right: 15px;
        top: 15px;
        width: 15px;
        height: 15px;
        padding: 0px;
        background: none;
        border: none;
        cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
        responseDiv.remove();
    });
    return closeButton;
}

function url_domain(data) {
    var    a      = document.createElement('a');
           a.href = data;
    return a.hostname;
  }

function formatResponseText(text) {
    // Split sections by headings ending with colon
    const sections = text.split(/(Summary of the Post:|Relevance or Context:|Further Exploration:)/gi);

    let formatted = '';
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].endsWith(':')) {
            // Add heading style
            formatted += `<h3 class="ct-heading ct-heading--secondary">${sections[i]}</h3>`;
            // Get content (next item) and split paragraphs
            const content = sections[++i].split('\n\n').filter(Boolean);
            formatted += content.map(p => `<p class="ct-paragraph">${p.replace(/\n/g, ' <br/>')} </p>`).join('');
        } else {
            // Handle any text without headings
            formatted += `<p>${sections[i].replace(/\n/g, ' <br/>')} </p>`;
        }
    }
    // Replace any string that start with http:// or https:// with a link
    formatted = formatted.replace(/(http|https):\/\/[^\s]+/g, (match) => `</br><a class="ct-link" href="${match}" target="_blank">${url_domain(match)}</a></br>`);

    return formatted;
}

// Function to handle context button clicks
function handleContextButtonClick(text, button) {
    getApiKey((key) => {
        (async () => {
            // const contextResponse = await sendPrompt(text, key);
            const contextResponse = "Summary of the Post:\nThe post discusses a court ruling related to a restraining order against the Trump administration's actions targeting the law firm Perkins Coie. Specifically, the order prevents the administration from barring employees of the firm from accessing government buildings, but it does not restrict security clearance reviews called for in Trump's order.\n\nRelevance or Context:\nThis appears to be related to ongoing tensions and legal battles between the Trump administration and Perkins Coie, a law firm that represented the Democratic National Committee and Hillary Clinton's 2016 presidential campaign. The firm's opposition research played a role in the Russia investigation, which has been a contentious issue during Trump's presidency.\n\nFurther Exploration:\n- An article from Reuters provides more details on the restraining order and the judge's ruling: https://www.reuters.com/article/us-usa-trump-perkins-coie/u-s-judge-blocks-portions-of-trumps-ban-on-perkins-coie-law-firm-idUSKBN27Q34X\n- For background on the broader context, this report from the Congressional Research Service outlines the Russia investigation and related controversies: https://crsreports.congress.gov/product/pdf/R/R45487";

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
                responseDiv.classList.add('ct-response');
                // Add a unique identifier to link the response to its button
                const uniqueId = 'context-' + Date.now();
                button.dataset.uniqueId = uniqueId;
                responseDiv.dataset.responseFor = uniqueId;

                responseDiv.style.cssText = `
                    right: ${buttonRight}px;
                    top: ${buttonTop + buttonRect.height + 5}px;
                `;

                responseDiv.appendChild(createCloseButton(responseDiv));
                document.body.appendChild(responseDiv);
            }

            // Add content wrapper div to prevent close button overlap
            responseDiv.innerHTML = `
            <div style="padding-right: 20px;">
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
            </style>
            ${formatResponseText(contextResponse)}
            </div>
            `;
            responseDiv.prepend(ct_heading("Context"));

            // Re-append close button
            responseDiv.appendChild(createCloseButton(responseDiv));
        })();
    });
}

// Process the page on load
function initializeContextButtons() {
    console.log("Initialize buttons starting");
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
    console.log("Initialize with retry starting");
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