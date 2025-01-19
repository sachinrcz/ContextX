function saveApiKey(apiKey) {
    chrome.storage.local.set({ apiKey: btoa(apiKey) }, () => {
        console.log('API key saved securely.');
        updateApiKeyDisplay(apiKey);
    });
}

function updateApiKeyDisplay(apiKey) {
    const apiKeyInput = document.getElementById('openai-api-key');
    const saveButton = document.getElementById('save-api-key');
    const deleteButton = document.getElementById('delete-api-key');

    if (apiKey) {
        // Show last 4 characters of the key
        const maskedKey = '****' + apiKey.slice(-4);
        apiKeyInput.value = maskedKey;
        apiKeyInput.readOnly = true;
        saveButton.classList.add('button--hidden');
        deleteButton.classList.remove('button--hidden');
    } else {
        apiKeyInput.value = '';
        apiKeyInput.readOnly = false;
        saveButton.classList.remove('button--hidden');
        deleteButton.classList.add('button--hidden');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-api-key');
    const deleteButton = document.getElementById('delete-api-key');
    const gptVersionSelect = document.getElementById('gpt-version');
    const message = document.getElementById('message');

    // Check for existing API key on load
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            const decryptedKey = atob(result.apiKey);
            updateApiKeyDisplay(decryptedKey);
        }
    });

    // Load saved GPT version
    chrome.storage.local.get(['gptVersion'], (result) => {
        if (result.gptVersion) {
            gptVersionSelect.value = result.gptVersion;
        }
    });

    // Handle GPT version change
    gptVersionSelect.addEventListener('change', function() {
        chrome.storage.local.set({ gptVersion: this.value }, () => {
            const message = document.getElementById('message');
            message.querySelector('.message__message').textContent = 'GPT model set to: ' + this.value;
            message.classList.add('message--show');
        });
    });

    saveButton.addEventListener('click', function() {
        const apiKeyInput = document.getElementById('openai-api-key');
        const apiKey = apiKeyInput.value;
        
        saveApiKey(apiKey);
        
        // Show message and set content
        message.querySelector('.message__message').textContent = "Key saved!";
        message.classList.add('message--show');
    });

    deleteButton.addEventListener('click', function() {
        chrome.storage.local.remove('apiKey', () => {
            updateApiKeyDisplay(null);
            message.querySelector('.message__message').textContent = "Key deleted!";
            message.classList.add('message--show');
        });
    });

    message.querySelector('.message__button').addEventListener('click', function() {
        message.classList.remove('message--show');
    });
});