// Retrieve the key
function getApiKey(callback) {
    chrome.storage.local.get(['apiKey'], (result) => {
        const decryptedKey = result.apiKey ? atob(result.apiKey) : null;
        console.log(decryptedKey);
        callback(decryptedKey);
    });
}

function getMainTitle() {
    const h1Title = document.querySelector('h1');
    if (h1Title) {
        return h1Title.textContent;
    }
    
    const h2Title = document.querySelector('h2');
    if (h2Title) {
        return h2Title.textContent;
    }
    
    return 'No main title found';
}

const endpoint = "https://api.openai.com/v1/chat/completions";
const apiKey = "";

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

// (async () => {
//     const userPrompt = "Enter your prompt here";
//     const response = await sendPrompt(userPrompt);
//     console.log("Response:", response);
// })();

// Create and insert UI elements
const section = document.createElement('section');
section.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 20000000000; 
    font-family: Arial, sans-serif;
`;

const button = document.createElement('button');
button.textContent = 'Give context';
button.style.cssText = `
    background-color: red;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
`;

const resultDiv = document.createElement('div');
resultDiv.style.cssText = `
    margin-top: 10px;
    background-color: white;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: none;
`;

section.appendChild(button);
section.appendChild(resultDiv);
document.body.appendChild(section);

function sendContextRequest(snippet) {
    getApiKey((key) => {
        const userInput = key || 'No user input';

        (async () => {
            
            const contextResponse = await sendPrompt("Please explain what" + snippet + "means", key);
            
            resultDiv.innerHTML = `
                <p><strong>Page Title:</strong> ${snippet}</p>
                
                <p><strong>Response:</strong> ${contextResponse}</p>
            `;
            resultDiv.style.display = 'block';
        })();
    });
}

button.addEventListener('click', () => {
    const title = getMainTitle();
    sendContextRequest(title);
});



