function saveApiKey(apiKey) {
    chrome.storage.local.set({ apiKey: btoa(apiKey) }, () => {
        console.log('API key saved securely.');
        updateApiKeyDisplay(apiKey);
    });
}

function updateApiKeyDisplay(apiKey) {
    const apiKeyInput = document.getElementById('api-key');
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
    const message = document.getElementById('message');

    // Check for existing API key on load
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            const decryptedKey = atob(result.apiKey);
            updateApiKeyDisplay(decryptedKey);
        }
    });

    saveButton.addEventListener('click', function() {
        const apiKeyInput = document.getElementById('api-key');
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