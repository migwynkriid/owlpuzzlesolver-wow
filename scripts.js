// Global state variables
let activeSquares = new Set();
let flipMap = {};
let currentSquare = null;
let isSettingFlips = false;
let solution = null;
let showInitialStateSelection = false;
let initialState = new Set();
let currentFlipsCount = 0;
let allSquaresConfigured = false;
let gridType = 'gridnumbers'; // Can be 'gridnumbers' or 'gridpictures'

// Initialize the grid
function initializeGrid() {
    const grid = document.getElementById('puzzleGrid');
    for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        if (i === 12) square.classList.add('center-square');
        square.textContent = i + 1;
        if (gridType === 'gridpictures') {
            square.classList.add('visual-mode');
            square.style.color = 'transparent';
        }
        square.onclick = () => handleSquareClick(i);
        grid.appendChild(square);
    }
    updateUI();
}

function handleSquareClick(index) {
    if (showInitialStateSelection) {
        // Toggle initial state
        if (initialState.has(index + 1)) {
            initialState.delete(index + 1);
        } else {
            initialState.add(index + 1);
        }
        updateUI();
        return;
    }

    if (!isSettingFlips) {
        if (flipMap[index + 1] && flipMap[index + 1].length > 0) {
            showGridResetDialog(index);
            return;
        }
        currentSquare = index;
        isSettingFlips = true;
        currentFlipsCount = 0;
        flipMap[currentSquare + 1] = [];
        updateUI();
        return;
    }

    if (currentSquare !== null && index !== currentSquare) {
        const currentFlips = flipMap[currentSquare + 1] || [];
        const targetSquare = index + 1;
        
        if (currentFlips.includes(targetSquare)) {
            flipMap[currentSquare + 1] = currentFlips.filter(x => x !== targetSquare);
            currentFlipsCount--;
        } else if (currentFlipsCount < 4) {
            flipMap[currentSquare + 1] = [...currentFlips, targetSquare];
            currentFlipsCount++;
            
            if (currentFlipsCount === 4) {
                setTimeout(handleDoneSettingFlips, 0);
            }
        }
        updateUI();
    }
}

function handleDoneSettingFlips() {
    if (currentSquare !== null && flipMap[currentSquare + 1]) {
        flipMap[currentSquare + 1].sort((a, b) => a - b);
        
        // Log the connection immediately when it's completed
        console.log(`Grid ${currentSquare + 1} connections: [${flipMap[currentSquare + 1].join(', ')}]`);
    }
    
    isSettingFlips = false;
    currentSquare = null;
    currentFlipsCount = 0;
    
    // Update the text field
    const flipMapText = document.getElementById('flipMapText');
    flipMapText.value = generateFlipMapText();
    
    updateUI();
}

function updateUI() {
    // Update squares
    const squares = document.querySelectorAll('.square');
    squares.forEach((square, index) => {
        square.className = 'square';
        if (index === 12) square.classList.add('center-square');
        
        if (showInitialStateSelection && initialState.has(index + 1)) {
            square.classList.add('initial-state');
        } else if (!showInitialStateSelection) {  
            if (currentSquare === index) {
                square.classList.add('selected');
            } else if (!isSettingFlips && flipMap[index + 1] && flipMap[index + 1].length > 0) {
                square.classList.add('configured');
            } else if (currentSquare !== null && 
                     flipMap[currentSquare + 1] && flipMap[currentSquare + 1].includes(index + 1)) {
                square.classList.add('flip-target');
            }
        }
        
        if (gridType === 'gridpictures') {
            square.classList.add('visual-mode');
            square.style.color = 'transparent';
        } else {
            square.classList.remove('visual-mode');
            square.style.color = '';
        }

        // Add hover event listeners based on state
        if (!showInitialStateSelection) {
            square.classList.add('mapping-state');
            let hoverTimeout;
            
            square.onmouseenter = () => {
                if (!isSettingFlips && flipMap[index + 1]) {
                    hoverTimeout = setTimeout(() => {
                        // Add faded class to all squares
                        squares.forEach(s => s.classList.add('faded'));
                        // Remove faded from hovered square and its connections
                        square.classList.remove('faded');
                        flipMap[index + 1].forEach(connectedIndex => {
                            squares[connectedIndex - 1].classList.remove('faded');
                            squares[connectedIndex - 1].classList.add('connected');
                        });
                    }, 400); // 0.4 seconds delay
                }
            };
            
            square.onmouseleave = () => {
                // Clear the timeout if mouse leaves before it triggers
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }
                // Remove faded and connected classes from all squares
                squares.forEach(s => {
                    s.classList.remove('faded', 'connected');
                });
            };
        } else {
            square.classList.remove('mapping-state');
            square.classList.add('solving-state');
            // Disable hover effects during solve state
            square.onmouseenter = null;
            square.onmouseleave = null;
        }
    });

    // Check if all squares are configured
    const allConfigured = Object.keys(flipMap).length === 25 && 
                        Object.values(flipMap).every(flips => flips && flips.length > 0);

    // Update alerts and buttons
    const configureAlert = document.getElementById('configureAlert');
    const nextStepButton = document.getElementById('nextStepButton');
    const backButton = document.getElementById('backButton');
    
    // Show/hide back button based on state
    backButton.style.display = showInitialStateSelection ? 'block' : 'none';
    
    configureAlert.style.display = !showInitialStateSelection && !isSettingFlips ? 'block' : 'none';
    if (allConfigured && !showInitialStateSelection && !isSettingFlips) {
        configureAlert.querySelector('span').textContent = "Amazing! Seems like all statues are mapped, click on 'Next Step' to input the active statues.";
        nextStepButton.style.display = 'block';
    } else {
        configureAlert.querySelector('span').textContent = "Interact with a statue in-game, click on the corresponding grid location on this website, afterwards click on the four grids that have changed when you have interacted with it.";
        nextStepButton.style.display = 'none';
    }
    document.getElementById('settingFlipsAlert').style.display = 
        isSettingFlips ? 'block' : 'none';
    document.getElementById('initialStateAlert').style.display = 
        showInitialStateSelection ? 'block' : 'none';

    const settingFlipsAlert = document.getElementById('settingFlipsAlert');
    if (isSettingFlips) {
        settingFlipsAlert.querySelector('#currentSquareNum').textContent = currentSquare + 1;
        settingFlipsAlert.querySelector('#flipCount').textContent = currentFlipsCount;
        settingFlipsAlert.querySelector('#doneButton').style.display = 'block';
    } else {
        settingFlipsAlert.querySelector('#doneButton').style.display = 'none';
    }

    // Update solve button visibility based on selected squares
    document.getElementById('solveButton').style.display = initialState.size > 0 ? 'block' : 'none';

    // Always update the flip map text unless it's being edited
    const flipMapText = document.getElementById('flipMapText');
    if (!flipMapText.matches(':focus')) {
        flipMapText.value = generateFlipMapText();
    }

    document.getElementById('title').textContent = 
        showInitialStateSelection ? 'Select Current Active Owl Statues' : "Vault of the Wardens: Glazer's Owl Puzzle";
}

function getRemainingSquares() {
    const remaining = [];
    for (let i = 1; i <= 25; i++) {
        if (!flipMap[i] || !flipMap[i].length) {
            remaining.push(i);
        }
    }
    return remaining;
}

function generateFlipMapText() {
    const entries = Object.entries(flipMap)
        .filter(([_, flips]) => flips && flips.length > 0)
        .map(([key, flips]) => `${key}: [${flips.join(', ')}]`)
        .join('\n');
    return entries || 'No flip connections set';
}

function flipPieces(state, piece) {
    let newState = state;
    // Flip the clicked piece
    newState ^= (1 << (piece - 1));
    // Flip all connected pieces
    for (const p of flipMap[piece] || []) {
        newState ^= (1 << (p - 1));
    }
    return newState;
}

function checkWin(state) {
    return state === 0;
}

function solvePuzzle(initialState) {
    const queue = [[initialState, []]];
    const visited = new Set([initialState]);

    while (queue.length > 0) {
        const [currentState, moveSequence] = queue.shift();

        if (checkWin(currentState)) {
            return moveSequence;
        }

        // Only try flipping pieces that are currently active
        for (let i = 0; i < 25; i++) {
            if (currentState & (1 << i)) {
                const newState = flipPieces(currentState, i + 1);
                if (!visited.has(newState)) {
                    visited.add(newState);
                    queue.push([newState, [...moveSequence, i + 1]]);
                }
            }
        }
    }
    return null;
}

function handleSolve() {
    try {
        if (initialState.size === 0) {
            showError("Select your current active owl statues.");
            return;
        }

        // Convert initial state to binary representation
        let initialStateBits = 0;
        for (const piece of initialState) {
            initialStateBits |= (1 << (piece - 1));
        }
        
        console.log('Starting solve with:');
        console.log('Initial active statues:', Array.from(initialState).sort((a, b) => a - b).join(', '));
        
        solution = solvePuzzle(initialStateBits);
        
        if (solution) {
            const solutionText = `Solution found! Click on the owl statues in this sequence: ${solution.map(num => `<strong>${num}</strong>`).join(", ")}`;
            
            // Update the instruction text with the solution and apply success styling
            const initialStateAlert = document.getElementById('initialStateAlert');
            const instructionText = initialStateAlert.querySelector('span');
            instructionText.innerHTML = solutionText;
            initialStateAlert.className = 'alert success';
            
            // Hide the solve button
            document.getElementById('solveButton').style.display = 'none';
            
            document.getElementById('errorAlert').style.display = 'none';
            console.log('Final solution:', solution);
        } else {
            showError("No solution found. Please verify your owl statue mapping and active statues.");
        }
    } catch (error) {
        console.error('Error solving puzzle:', error);
        showError("Error solving puzzle: " + error.message);
    }
}

function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (message && message.trim()) {
        errorAlert.querySelector('span').textContent = message;
        errorAlert.style.display = 'block';
    } else {
        errorAlert.style.display = 'none';
    }
}

function showResetDialog() {
    document.getElementById('dialogBackdrop').style.display = 'block';
    document.getElementById('resetDialog').style.display = 'block';
    document.getElementById('resetDialog').querySelector('p').innerHTML = "Resetting this will CLEAR all of your mappings, not just the previously configured statue.<br>To reconfigure a single statue click on \"Cancel\" and click on the corresponding grid.";
    const confirmButton = document.getElementById('confirmReset');
    confirmButton.innerHTML = '<img src="./pictures/x.png" alt="Reset" class="button-icon"> Reset All';
    document.getElementById('confirmReset').onclick = () => {
        resetAll();
    };
}

function showGridResetDialog(index) {
    document.getElementById('dialogBackdrop').style.display = 'block';
    document.getElementById('resetDialog').style.display = 'block';
    document.getElementById('resetDialog').querySelector('p').innerHTML = "You have clicked on a mapped statue, would you like to reset it?";
    const confirmButton = document.getElementById('confirmReset');
    confirmButton.innerHTML = '<img src="./pictures/x.png" alt="Reset" class="button-icon"> Reset';
    document.getElementById('confirmReset').onclick = () => {
        delete flipMap[index + 1];
        currentSquare = index;
        currentFlipsCount = 0;
        isSettingFlips = true;
        hideResetDialog();
        updateUI();
    };
}

function hideResetDialog() {
    document.getElementById('dialogBackdrop').style.display = 'none';
    document.getElementById('resetDialog').style.display = 'none';
}

function resetAll() {
    activeSquares = new Set();
    flipMap = {};
    currentSquare = null;
    isSettingFlips = false;
    solution = null;
    initialState = new Set();
    showInitialStateSelection = false;
    currentFlipsCount = 0;
    allSquaresConfigured = false;
    
    // Clear error and reset UI elements
    document.getElementById('errorAlert').style.display = 'none';
    document.getElementById('flipMapText').value = '';
    
    // Reset all alerts
    document.getElementById('configureAlert').style.display = 'block';
    document.getElementById('settingFlipsAlert').style.display = 'none';
    document.getElementById('initialStateAlert').style.display = 'none';
    
    // Reset instruction text
    const initialStateAlert = document.getElementById('initialStateAlert');
    initialStateAlert.className = 'alert';
    initialStateAlert.querySelector('span').textContent = 'Now highlight the currently active owl statues on the grid';
    
    // Reset buttons
    document.getElementById('solveButton').style.display = 'block';
    document.getElementById('nextStepButton').style.display = 'none';
    
    updateUI();
    hideResetDialog();
}

document.getElementById('resetButton').onclick = () => {
    showResetDialog();
};

function handleNextStep() {
    showInitialStateSelection = true;
    updateUI();  // Make sure display is updated
}

function toggleVisualMode() {
    gridType = gridType === 'gridnumbers' ? 'gridpictures' : 'gridnumbers';
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.toggle('visual-mode');
    });
    
    const visualButton = document.getElementById('placeholderBtn');
    const newText = gridType === 'gridnumbers' ? 'Switch to Pictures' : 'Switch to Numbers';
    visualButton.innerHTML = `<img src="./pictures/copy.png" alt="Switch" class="button-icon"> ${newText}`;
}

function showFAQ() {
    document.getElementById('faqModal').style.display = 'block';
}

function hideFAQ() {
    document.getElementById('faqModal').style.display = 'none';
}

function handleFlipMapInput(text) {
    if (!text.trim()) {
        flipMap = {};
        updateUI();
        return;
    }

    const newFlipMap = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        const [key, values] = line.split(':');
        if (values) {
            const flips = values.trim()
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .map(n => parseInt(n.trim()))
                .filter(n => !isNaN(n) && n >= 1 && n <= 25);
            
            if (flips.length > 0 && flips.length <= 4) {
                newFlipMap[parseInt(key.trim())] = flips;
            }
        }
    }
    
    flipMap = newFlipMap;
    updateUI();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('doneButton').onclick = handleDoneSettingFlips;
    document.getElementById('nextStepButton').onclick = handleNextStep;
    document.getElementById('solveButton').onclick = handleSolve;
    document.getElementById('placeholderBtn').onclick = toggleVisualMode;
    document.getElementById('backButton').onclick = () => {
        showInitialStateSelection = false;
        initialState = new Set();
        updateUI();
    };

    // Add click handler to backdrop to dismiss dialog when clicking outside
    document.getElementById('dialogBackdrop').onclick = hideResetDialog;

    // Initialize the puzzle
    initializeGrid();
});