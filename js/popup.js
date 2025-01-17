document.addEventListener('DOMContentLoaded', function() {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter your text';
    
    const button = document.createElement('button');
    button.textContent = 'Save';
    
    button.addEventListener('click', function() {
        chrome.storage.local.set({ userInput: input.value }, function() {
            console.log('Value is set to ' + input.value);
        });
    });
    
    document.body.appendChild(input);
    document.body.appendChild(button);
});