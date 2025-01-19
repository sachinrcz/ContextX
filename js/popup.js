function saveApiKey(apiKey) {
    chrome.storage.local.set({ apiKey: btoa(apiKey) }, () => {
        console.log('API key saved securely.');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-api-key');
    const deleteButton = document.getElementById('delete-api-key');
    const gptVersionSelect = document.getElementById('gpt-version');

    // Load saved GPT version
    chrome.storage.local.get(['gptVersion'], (result) => {
        if (result.gptVersion) {
            gptVersionSelect.value = result.gptVersion;
        }
    });

    // Handle GPT version change
    gptVersionSelect.addEventListener('change', function() {
        chrome.storage.local.set({ gptVersion: this.value }, () => {
            // console.log('GPT version saved:', this.value);
            // Show message and set content
            const message = document.getElementById('message');
            message.querySelector('.message__message').textContent = 'GPT model set to:' + this.value;
            message.classList.add('message--show');
        });
    });

    saveButton.addEventListener('click', function() {
        const apiKeyInput = document.getElementById('openai-api-key');
        const apiKey = apiKeyInput.value;
       
        saveApiKey(apiKey);
        
        // Update button visibility
        saveButton.classList.add('button--hidden');
        deleteButton.classList.remove('button--hidden');
        
        // Show message and set content
        const message = document.getElementById('message');
        message.querySelector('.message__message').textContent = "Key saved!";
        message.classList.add('message--show');
    });

    deleteButton.addEventListener('click', function() {
        chrome.storage.local.remove('apiKey', () => {
            const apiKeyInput = document.getElementById('openai-api-key');
            apiKeyInput.value = '';
            message.querySelector('.message__message').textContent = "Key deleted!";
            message.classList.add('message--show');
            saveButton.classList.remove('button--hidden');
            deleteButton.classList.add('button--hidden');
        });
    });

    message.querySelector('.message__button').addEventListener('click', function() {
        message.classList.remove('message--show');
    });
});