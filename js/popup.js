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
        saveButton.classList.add('ct-button--hidden');
        deleteButton.classList.remove('ct-button--hidden');
    } else {
        apiKeyInput.value = '';
        apiKeyInput.readOnly = false;
        saveButton.classList.remove('ct-button--hidden');
        deleteButton.classList.add('ct-button--hidden');
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
        } else {
            // Set default value if none exists
            const defaultVersion = 'gpt-3.5-turbo';
            gptVersionSelect.value = defaultVersion;
            chrome.storage.local.set({ gptVersion: defaultVersion }, () => {
                console.log('Default GPT version set to:', defaultVersion);
            });
        }
    });

    // Handle GPT version change
    gptVersionSelect.addEventListener('change', function() {
        chrome.storage.local.set({ gptVersion: this.value }, () => {
            const message = document.getElementById('message');
            message.querySelector('.ct-message__message').textContent = 'GPT model set to: ' + this.value;
            message.classList.add('ct-message--show');
        });
    });

    saveButton.addEventListener('click', function() {
        const apiKeyInput = document.getElementById('openai-api-key');
        const apiKey = apiKeyInput.value;
        
        saveApiKey(apiKey);
        
        // Show message and set content
        message.querySelector('.ct-message__message').textContent = "Key saved!";
        message.classList.add('ct-message--show');
    });

    deleteButton.addEventListener('click', function() {
        chrome.storage.local.remove('apiKey', () => {
            updateApiKeyDisplay(null);
            message.querySelector('.ct-message__message').textContent = "Key deleted!";
            message.classList.add('ct-message--show');
        });
    });

    message.querySelector('.ct-message__button').addEventListener('click', function() {
        message.classList.remove('ct-message--show');
    });
});