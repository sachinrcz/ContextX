function saveApiKey(apiKey) {
    chrome.storage.local.set({ apiKey: btoa(apiKey) }, () => {
        console.log('API key saved securely.');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-api-key');
    const deleteButton = document.getElementById('delete-api-key');

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