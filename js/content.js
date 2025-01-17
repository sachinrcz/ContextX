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

// Add click handler
button.addEventListener('click', () => {
    chrome.storage.local.get(['userInput'], function(result) {
        const title = getMainTitle();
        const userInput = result.userInput || 'No user input';
        resultDiv.innerHTML = `
            <p><strong>Page Title:</strong> ${title}</p>
            <p><strong>User Input:</strong> ${userInput}</p>
        `;
        resultDiv.style.display = 'block';
    });
});