class BellmanDemo {
    constructor() {
        // Grid world configuration
        this.gridSize = 5;
        this.startState = [0, 0];
        this.goalState = [4, 4];
        this.obstacles = [[2, 2], [2, 3], [3, 2]];
        this.actions = ['up', 'down', 'left', 'right'];
        this.actionDeltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        this.actionSymbols = ['↑', '↓', '←', '→'];
        
        // Rewards
        this.rewards = {
            goal: 10,
            step: -1,
            wall: -1
        };
        
        // Parameters
        this.gamma = 0.9;
        this.alpha = 0.1;
        this.maxIterations = 100;
        this.convergenceThreshold = 0.001;
        
        // State
        this.values = {};
        this.qValues = {};
        this.policy = {};
        this.isRunning = false;
        this.currentIteration = 0;
        this.selectedState = null;
        this.currentAlgorithm = 'value-iteration';
        this.animationSpeed = 500;
        
        this.initializeGridWorld();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    initializeGridWorld() {
        // Initialize value function
        this.values = {};
        this.qValues = {};
        this.policy = {};
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const state = `${i},${j}`;
                this.values[state] = 0;
                this.qValues[state] = {};
                this.policy[state] = 'up';
                
                // Initialize Q-values for all actions
                for (let action of this.actions) {
                    this.qValues[state][action] = 0;
                }
            }
        }
        
        this.createGrid();
        this.createPolicyGrid();
    }
    
    createGrid() {
        const container = document.getElementById('grid-container');
        container.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.state = `${i},${j}`;
                
                // Add special classes
                if (i === this.startState[0] && j === this.startState[1]) {
                    cell.classList.add('start');
                } else if (i === this.goalState[0] && j === this.goalState[1]) {
                    cell.classList.add('goal');
                } else if (this.isObstacle(i, j)) {
                    cell.classList.add('obstacle');
                }
                
                // Create cell content
                const coords = document.createElement('div');
                coords.className = 'cell-coords';
                coords.textContent = `(${i},${j})`;
                
                const value = document.createElement('div');
                value.className = 'cell-value';
                value.textContent = '0.00';
                
                cell.appendChild(coords);
                cell.appendChild(value);
                
                // Add event listeners
                cell.addEventListener('click', () => this.selectState(i, j));
                cell.addEventListener('mouseenter', () => this.showCellInfo(i, j));
                cell.addEventListener('mouseleave', () => this.hideCellInfo());
                
                container.appendChild(cell);
            }
        }
    }
    
    createPolicyGrid() {
        const container = document.getElementById('policy-grid');
        container.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'policy-cell';
                
                if (i === this.startState[0] && j === this.startState[1]) {
                    cell.classList.add('start');
                } else if (i === this.goalState[0] && j === this.goalState[1]) {
                    cell.classList.add('goal');
                } else if (this.isObstacle(i, j)) {
                    cell.classList.add('obstacle');
                    cell.textContent = '█';
                } else {
                    cell.textContent = '↑';
                }
                
                container.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        // Algorithm selection
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
            this.updateEquationDisplay();
        });
        
        // Parameter sliders
        document.getElementById('gamma-slider').addEventListener('input', (e) => {
            this.gamma = parseFloat(e.target.value);
            document.getElementById('gamma-value').textContent = this.gamma.toFixed(2);
        });
        
        document.getElementById('alpha-slider').addEventListener('input', (e) => {
            this.alpha = parseFloat(e.target.value);
            document.getElementById('alpha-value').textContent = this.alpha.toFixed(2);
        });
        
        document.getElementById('iterations-input').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value);
        });
        
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.animationSpeed}ms`;
        });
        
        // Control buttons
        document.getElementById('run-btn').addEventListener('click', () => this.runAlgorithm());
        document.getElementById('step-btn').addEventListener('click', () => this.stepAlgorithm());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        
        // Initialize displays
        this.updateEquationDisplay();
    }
    
    updateEquationDisplay() {
        const equationEl = document.querySelector('.equation');
        if (this.currentAlgorithm === 'value-iteration') {
            equationEl.innerHTML = 'V(s) = max<sub>a</sub> Σ P(s\'|s,a)[R(s,a,s\') + γV(s\')]';
        } else {
            equationEl.innerHTML = 'Q(s,a) = Q(s,a) + α[r + γ max Q(s\',a\') - Q(s,a)]';
        }
    }
    
    isValidState(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }
    
    isObstacle(row, col) {
        return this.obstacles.some(obs => obs[0] === row && obs[1] === col);
    }
    
    isGoalState(row, col) {
        return row === this.goalState[0] && col === this.goalState[1];
    }
    
    getNextState(row, col, action) {
        const actionIndex = this.actions.indexOf(action);
        const [deltaR, deltaC] = this.actionDeltas[actionIndex];
        const newRow = row + deltaR;
        const newCol = col + deltaC;
        
        // Check boundaries and obstacles
        if (!this.isValidState(newRow, newCol) || this.isObstacle(newRow, newCol)) {
            return [row, col]; // Stay in same position
        }
        
        return [newRow, newCol];
    }
    
    getReward(row, col, action, nextRow, nextCol) {
        if (this.isGoalState(nextRow, nextCol)) {
            return this.rewards.goal;
        }
        
        // If we hit a wall or boundary (didn't move)
        if (row === nextRow && col === nextCol && !this.isGoalState(row, col)) {
            return this.rewards.wall;
        }
        
        return this.rewards.step;
    }
    
    async runAlgorithm() {
        if (this.isRunning) {
            this.isRunning = false;
            this.updateRunButton();
            return;
        }
        
        this.isRunning = true;
        this.updateRunButton();
        this.updateStatus('Running');
        this.currentIteration = 0;
        
        try {
            if (this.currentAlgorithm === 'value-iteration') {
                await this.runValueIteration();
            } else {
                await this.runQLearning();
            }
        } catch (error) {
            console.error('Algorithm error:', error);
        }
        
        this.isRunning = false;
        this.updateRunButton();
    }
    
    async runValueIteration() {
        for (let iter = 0; iter < this.maxIterations && this.isRunning; iter++) {
            this.currentIteration = iter + 1;
            const oldValues = { ...this.values };
            let maxChange = 0;
            
            // Update each state
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.isObstacle(i, j)) continue;
                    
                    const state = `${i},${j}`;
                    this.highlightCurrentState(i, j);
                    
                    let maxValue = -Infinity;
                    let bestAction = 'up';
                    
                    // Try each action
                    for (const action of this.actions) {
                        const [nextI, nextJ] = this.getNextState(i, j, action);
                        const reward = this.getReward(i, j, action, nextI, nextJ);
                        const nextState = `${nextI},${nextJ}`;
                        const value = reward + this.gamma * oldValues[nextState];
                        
                        if (value > maxValue) {
                            maxValue = value;
                            bestAction = action;
                        }
                    }
                    
                    this.values[state] = maxValue;
                    this.policy[state] = bestAction;
                    
                    const change = Math.abs(maxValue - oldValues[state]);
                    maxChange = Math.max(maxChange, change);
                    
                    this.showCalculation(i, j, bestAction, maxValue);
                    await this.sleep(this.animationSpeed / this.gridSize);
                }
            }
            
            this.updateDisplay();
            this.updateStats(maxChange);
            
            // Check convergence
            if (maxChange < this.convergenceThreshold) {
                this.updateStatus('Converged');
                break;
            }
            
            await this.sleep(100);
        }
        
        if (this.currentIteration >= this.maxIterations) {
            this.updateStatus('Max iterations reached');
        }
    }
    
    async runQLearning() {
        // Initialize Q-values
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const state = `${i},${j}`;
                for (const action of this.actions) {
                    this.qValues[state][action] = 0;
                }
            }
        }
        
        for (let iter = 0; iter < this.maxIterations && this.isRunning; iter++) {
            this.currentIteration = iter + 1;
            let maxChange = 0;
            
            // Episode simulation
            for (let episode = 0; episode < 10; episode++) {
                let currentRow = this.startState[0];
                let currentCol = this.startState[1];
                
                while (!this.isGoalState(currentRow, currentCol) && this.isRunning) {
                    const state = `${currentRow},${currentCol}`;
                    this.highlightCurrentState(currentRow, currentCol);
                    
                    // Epsilon-greedy action selection
                    const epsilon = Math.max(0.1, 1.0 - iter / this.maxIterations);
                    let action;
                    
                    if (Math.random() < epsilon) {
                        // Random action
                        action = this.actions[Math.floor(Math.random() * this.actions.length)];
                    } else {
                        // Greedy action
                        action = this.getBestAction(currentRow, currentCol);
                    }
                    
                    const [nextRow, nextCol] = this.getNextState(currentRow, currentCol, action);
                    const reward = this.getReward(currentRow, currentCol, action, nextRow, nextCol);
                    const nextState = `${nextRow},${nextCol}`;
                    
                    // Q-learning update
                    const oldQ = this.qValues[state][action];
                    const maxNextQ = Math.max(...this.actions.map(a => this.qValues[nextState][a]));
                    const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
                    
                    this.qValues[state][action] = newQ;
                    const change = Math.abs(newQ - oldQ);
                    maxChange = Math.max(maxChange, change);
                    
                    this.showQCalculation(currentRow, currentCol, action, reward, maxNextQ, newQ);
                    
                    currentRow = nextRow;
                    currentCol = nextCol;
                    
                    await this.sleep(this.animationSpeed / 20);
                }
            }
            
            // Update values and policy from Q-values
            this.updateFromQValues();
            this.updateDisplay();
            this.updateStats(maxChange);
            
            // Check convergence
            if (maxChange < this.convergenceThreshold) {
                this.updateStatus('Converged');
                break;
            }
        }
        
        if (this.currentIteration >= this.maxIterations) {
            this.updateStatus('Max iterations reached');
        }
    }
    
    updateFromQValues() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const state = `${i},${j}`;
                if (!this.isObstacle(i, j)) {
                    const bestAction = this.getBestAction(i, j);
                    this.policy[state] = bestAction;
                    this.values[state] = this.qValues[state][bestAction];
                }
            }
        }
    }
    
    getBestAction(row, col) {
        const state = `${row},${col}`;
        let bestAction = 'up';
        let maxQ = -Infinity;
        
        for (const action of this.actions) {
            if (this.qValues[state][action] > maxQ) {
                maxQ = this.qValues[state][action];
                bestAction = action;
            }
        }
        
        return bestAction;
    }
    
    stepAlgorithm() {
        if (this.isRunning) return;
        
        // Implement single step
        if (this.currentAlgorithm === 'value-iteration') {
            this.stepValueIteration();
        } else {
            this.stepQLearning();
        }
    }
    
    stepValueIteration() {
        this.currentIteration++;
        const oldValues = { ...this.values };
        let maxChange = 0;
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.isObstacle(i, j)) continue;
                
                const state = `${i},${j}`;
                let maxValue = -Infinity;
                let bestAction = 'up';
                
                for (const action of this.actions) {
                    const [nextI, nextJ] = this.getNextState(i, j, action);
                    const reward = this.getReward(i, j, action, nextI, nextJ);
                    const nextState = `${nextI},${nextJ}`;
                    const value = reward + this.gamma * oldValues[nextState];
                    
                    if (value > maxValue) {
                        maxValue = value;
                        bestAction = action;
                    }
                }
                
                this.values[state] = maxValue;
                this.policy[state] = bestAction;
                const change = Math.abs(maxValue - oldValues[state]);
                maxChange = Math.max(maxChange, change);
            }
        }
        
        this.updateDisplay();
        this.updateStats(maxChange);
    }
    
    stepQLearning() {
        // Simplified single step for Q-learning
        this.currentIteration++;
        let maxChange = 0;
        
        // Single episode
        let currentRow = this.startState[0];
        let currentCol = this.startState[1];
        
        while (!this.isGoalState(currentRow, currentCol)) {
            const state = `${currentRow},${currentCol}`;
            const epsilon = 0.1;
            let action;
            
            if (Math.random() < epsilon) {
                action = this.actions[Math.floor(Math.random() * this.actions.length)];
            } else {
                action = this.getBestAction(currentRow, currentCol);
            }
            
            const [nextRow, nextCol] = this.getNextState(currentRow, currentCol, action);
            const reward = this.getReward(currentRow, currentCol, action, nextRow, nextCol);
            const nextState = `${nextRow},${nextCol}`;
            
            const oldQ = this.qValues[state][action];
            const maxNextQ = Math.max(...this.actions.map(a => this.qValues[nextState][a]));
            const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
            
            this.qValues[state][action] = newQ;
            const change = Math.abs(newQ - oldQ);
            maxChange = Math.max(maxChange, change);
            
            currentRow = nextRow;
            currentCol = nextCol;
        }
        
        this.updateFromQValues();
        this.updateDisplay();
        this.updateStats(maxChange);
    }
    
    reset() {
        this.isRunning = false;
        this.currentIteration = 0;
        this.selectedState = null;
        this.initializeGridWorld();
        this.updateDisplay();
        this.updateStats(0);
        this.updateStatus('Ready');
        this.updateRunButton();
        document.getElementById('current-calculation').textContent = '';
        document.getElementById('cell-info').innerHTML = '<div class="info-placeholder">Hover over a cell for details</div>';
    }
    
    updateDisplay() {
        this.updateGridValues();
        this.updatePolicyDisplay();
        if (this.selectedState) {
            const [row, col] = this.selectedState.split(',').map(Number);
            this.updateQTable(row, col);
        }
    }
    
    updateGridValues() {
        const cells = document.querySelectorAll('.grid-cell');
        const allValues = Object.values(this.values).filter(v => !isNaN(v));
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const range = maxValue - minValue || 1;
        
        cells.forEach(cell => {
            const state = cell.dataset.state;
            const value = this.values[state];
            const { row, col } = cell.dataset;
            
            // Update value display
            const valueEl = cell.querySelector('.cell-value');
            if (!this.isObstacle(parseInt(row), parseInt(col))) {
                valueEl.textContent = value.toFixed(2);
                
                // Update background color based on value
                if (!cell.classList.contains('start') && !cell.classList.contains('goal')) {
                    const intensity = (value - minValue) / range;
                    const color = this.interpolateColor([33, 150, 243], [244, 67, 54], intensity);
                    cell.style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
                }
            }
        });
    }
    
    updatePolicyDisplay() {
        const cells = document.querySelectorAll('.policy-cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / this.gridSize);
            const col = index % this.gridSize;
            const state = `${row},${col}`;
            
            if (!this.isObstacle(row, col) && !this.isGoalState(row, col)) {
                const action = this.policy[state];
                const actionIndex = this.actions.indexOf(action);
                cell.textContent = this.actionSymbols[actionIndex];
            }
        });
    }
    
    selectState(row, col) {
        this.selectedState = `${row},${col}`;
        this.updateQTable(row, col);
        
        // Highlight selected cell
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        document.querySelector(`[data-state="${row},${col}"]`).classList.add('selected');
    }
    
    updateQTable(row, col) {
        const state = `${row},${col}`;
        const container = document.getElementById('q-table-display');
        const infoContainer = document.getElementById('selected-state-info');
        
        infoContainer.innerHTML = `<div class="selected-state-title">Q-Values for State (${row}, ${col})</div>`;
        
        if (this.isObstacle(row, col)) {
            container.innerHTML = '<div class="info-placeholder">Obstacle - No Q-values</div>';
            return;
        }
        
        container.innerHTML = '';
        
        // Find best action
        const qVals = this.qValues[state];
        const maxQ = Math.max(...Object.values(qVals));
        
        this.actions.forEach((action, index) => {
            const actionRow = document.createElement('div');
            actionRow.className = 'q-action-row';
            
            if (Math.abs(qVals[action] - maxQ) < 0.001) {
                actionRow.classList.add('optimal');
            }
            
            const nameEl = document.createElement('div');
            nameEl.className = 'q-action-name';
            nameEl.textContent = `${this.actionSymbols[index]} ${action}`;
            
            const valueEl = document.createElement('div');
            valueEl.className = 'q-action-value';
            valueEl.textContent = qVals[action].toFixed(3);
            
            actionRow.appendChild(nameEl);
            actionRow.appendChild(valueEl);
            container.appendChild(actionRow);
        });
    }
    
    showCellInfo(row, col) {
        const container = document.getElementById('cell-info');
        const state = `${row},${col}`;
        
        if (this.isObstacle(row, col)) {
            container.innerHTML = '<div class="info-placeholder">Obstacle</div>';
            return;
        }
        
        const value = this.values[state];
        const policy = this.policy[state];
        const isStart = row === this.startState[0] && col === this.startState[1];
        const isGoal = row === this.goalState[0] && col === this.goalState[1];
        
        container.innerHTML = `
            <div class="info-item">
                <span class="info-label">Coordinates:</span>
                <span class="info-value">(${row}, ${col})</span>
            </div>
            <div class="info-item">
                <span class="info-label">Value:</span>
                <span class="info-value">${value.toFixed(3)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Policy:</span>
                <span class="info-value">${policy} ${this.actionSymbols[this.actions.indexOf(policy)]}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Type:</span>
                <span class="info-value">${isStart ? 'Start' : isGoal ? 'Goal' : 'Normal'}</span>
            </div>
        `;
    }
    
    hideCellInfo() {
        document.getElementById('cell-info').innerHTML = '<div class="info-placeholder">Hover over a cell for details</div>';
    }
    
    highlightCurrentState(row, col) {
        // Remove previous highlight
        document.querySelectorAll('.grid-cell.current').forEach(cell => {
            cell.classList.remove('current');
        });
        
        // Add current highlight
        const cell = document.querySelector(`[data-state="${row},${col}"]`);
        if (cell) {
            cell.classList.add('current');
        }
    }
    
    showCalculation(row, col, action, value) {
        const calcEl = document.getElementById('current-calculation');
        if (this.currentAlgorithm === 'value-iteration') {
            calcEl.textContent = `V(${row},${col}) = ${value.toFixed(3)} (action: ${action})`;
        }
    }
    
    showQCalculation(row, col, action, reward, maxNextQ, newQ) {
        const calcEl = document.getElementById('current-calculation');
        if (this.currentAlgorithm === 'q-learning') {
            calcEl.textContent = `Q(${row},${col},${action}) = ${newQ.toFixed(3)} (r=${reward}, max_Q'=${maxNextQ.toFixed(2)})`;
        }
    }
    
    updateStats(maxChange) {
        document.getElementById('current-iteration').textContent = this.currentIteration;
        document.getElementById('max-change').textContent = maxChange.toFixed(3);
        document.getElementById('running-status').textContent = this.isRunning ? 'Yes' : 'No';
    }
    
    updateStatus(status) {
        const statusEl = document.getElementById('convergence-status');
        statusEl.textContent = status;
        statusEl.className = 'stat-value';
        
        if (status === 'Converged') {
            statusEl.classList.add('status--success');
        } else if (status === 'Running') {
            statusEl.classList.add('status--info');
        } else if (status === 'Max iterations reached') {
            statusEl.classList.add('status--warning');
        } else {
            statusEl.classList.add('status--info');
        }
    }
    
    updateRunButton() {
        const btn = document.getElementById('run-btn');
        btn.textContent = this.isRunning ? 'Stop' : `Run ${this.currentAlgorithm === 'value-iteration' ? 'Value Iteration' : 'Q-Learning'}`;
        btn.className = this.isRunning ? 'btn btn--warning' : 'btn btn--primary';
    }
    
    interpolateColor(color1, color2, factor) {
        return [
            Math.round(color1[0] + factor * (color2[0] - color1[0])),
            Math.round(color1[1] + factor * (color2[1] - color1[1])),
            Math.round(color1[2] + factor * (color2[2] - color1[2]))
        ];
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BellmanDemo();
});