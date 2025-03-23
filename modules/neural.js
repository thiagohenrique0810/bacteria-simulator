/**
 * Rede Neural avançada para tomada de decisões
 */
class NeuralNetwork {
    constructor(inputSize = 6, hiddenSize = 8, outputSize = 4) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        
        // Inicializa pesos
        this.weightsIH = this.createMatrix(this.hiddenSize, this.inputSize);
        this.weightsHO = this.createMatrix(this.outputSize, this.hiddenSize);
        this.biasH = this.createMatrix(this.hiddenSize, 1);
        this.biasO = this.createMatrix(this.outputSize, 1);
        
        // Memória de experiência anterior
        this.memory = {
            inputs: [],
            outputs: [],
            rewards: [],
            capacity: 100  // Número máximo de experiências memorizadas
        };
        
        // Parâmetros de aprendizado e mutação
        this.learningRate = 0.1;
        this.mutationRate = 0.1;
        this.mutationIntensity = 0.2;
        
        // Função de ativação padrão (pode ser alterada)
        this.activationFnName = 'relu';
    }

    /**
     * Cria uma matriz com valores aleatórios
     * @param {number} rows - Número de linhas
     * @param {number} cols - Número de colunas
     * @returns {Array} - Matriz inicializada
     */
    createMatrix(rows, cols) {
        return Array(rows).fill().map(() => 
            Array(cols).fill().map(() => random(-1, 1))
        );
    }

    /**
     * Função de ativação sigmoid
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    /**
     * Função de ativação ReLU (Rectified Linear Unit)
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    relu(x) {
        return Math.max(0, x);
    }
    
    /**
     * Função de ativação LeakyReLU
     * @param {number} x - Valor de entrada
     * @param {number} alpha - Inclinação para valores negativos
     * @returns {number} - Valor ativado
     */
    leakyRelu(x, alpha = 0.01) {
        return x > 0 ? x : alpha * x;
    }
    
    /**
     * Função de ativação tanh
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    tanh(x) {
        return Math.tanh(x);
    }
    
    /**
     * Aplica a função de ativação selecionada
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    activate(x) {
        switch (this.activationFnName) {
            case 'sigmoid': return this.sigmoid(x);
            case 'relu': return this.relu(x);
            case 'leakyrelu': return this.leakyRelu(x);
            case 'tanh': return this.tanh(x);
            default: return this.relu(x);
        }
    }
    
    /**
     * Define a função de ativação
     * @param {string} fnName - Nome da função de ativação
     */
    setActivationFunction(fnName) {
        if (['sigmoid', 'relu', 'leakyrelu', 'tanh'].includes(fnName)) {
            this.activationFnName = fnName;
        }
    }

    /**
     * Prediz uma ação baseada nos inputs
     * @param {Array} inputs - Array de inputs
     * @returns {Array} - Array de outputs
     */
    predict(inputs) {
        // Camada oculta
        let hidden = this.weightsIH.map((row, i) => 
            this.activate(row.reduce((sum, weight, j) => sum + weight * inputs[j], 0) + this.biasH[i][0])
        );

        // Camada de saída
        let outputs = this.weightsHO.map((row, i) =>
            this.activate(row.reduce((sum, weight, j) => sum + weight * hidden[j], 0) + this.biasO[i][0])
        );
        
        // Armazena na memória
        this.storeExperience(inputs, outputs);

        return outputs;
    }
    
    /**
     * Armazena experiência na memória
     * @param {Array} inputs - Valores de entrada
     * @param {Array} outputs - Valores de saída
     * @param {number} reward - Recompensa recebida (opcional)
     */
    storeExperience(inputs, outputs, reward = null) {
        // Adiciona à memória
        this.memory.inputs.push([...inputs]);
        this.memory.outputs.push([...outputs]);
        this.memory.rewards.push(reward);
        
        // Limita a capacidade da memória
        if (this.memory.inputs.length > this.memory.capacity) {
            this.memory.inputs.shift();
            this.memory.outputs.shift();
            this.memory.rewards.shift();
        }
    }
    
    /**
     * Atualiza a rede com base em recompensa recebida
     * @param {number} reward - Recompensa pela ação
     */
    updateWithReward(reward) {
        // Atualiza a recompensa da última experiência
        if (this.memory.rewards.length > 0) {
            this.memory.rewards[this.memory.rewards.length - 1] = reward;
        }
    }
    
    /**
     * Aprende baseado nas experiências passadas com recompensas positivas
     */
    learn() {
        // Verifica se há experiências com recompensas
        const validExperiences = this.memory.rewards.filter(r => r !== null && r > 0);
        if (validExperiences.length === 0) return;
        
        // Seleciona experiências com recompensas positivas para aprendizado
        const positiveIndices = this.memory.rewards
            .map((r, i) => r !== null && r > 0 ? i : -1)
            .filter(i => i !== -1);
        
        // Aprende com cada experiência positiva
        for (const idx of positiveIndices) {
            const inputs = this.memory.inputs[idx];
            const outputs = this.memory.outputs[idx];
            const reward = this.memory.rewards[idx];
            
            // Aplica o aprendizado (simplificado para esta demonstração)
            this.weightsIH = this.weightsIH.map((row, i) =>
                row.map((w, j) => w + this.learningRate * reward * inputs[j])
            );
            
            this.weightsHO = this.weightsHO.map((row, i) =>
                row.map((w, j) => {
                    const target = i === outputs.indexOf(Math.max(...outputs)) ? 1 : 0;
                    const output = outputs[i];
                    return w + this.learningRate * reward * (target - output);
                })
            );
        }
    }

    /**
     * Combina duas redes neurais com crossover de múltiplos pontos
     * @param {NeuralNetwork} other - Outra rede neural
     * @returns {NeuralNetwork} - Nova rede neural combinada
     */
    crossover(other) {
        let child = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
        
        // Pega a função de ativação de um dos pais aleatoriamente
        child.activationFnName = random() < 0.5 ? this.activationFnName : other.activationFnName;
        
        // Crossover de múltiplos pontos para pesos input-hidden
        for (let i = 0; i < this.weightsIH.length; i++) {
            const rowLength = this.weightsIH[i].length;
            const crossoverPoints = Math.floor(random(1, 3)); // 1 a 3 pontos de crossover
            
            let points = [];
            for (let p = 0; p < crossoverPoints; p++) {
                points.push(Math.floor(random(0, rowLength)));
            }
            points.sort((a, b) => a - b);
            
            let parent = random() < 0.5 ? this : other;
            for (let j = 0; j < rowLength; j++) {
                // Troca de pai a cada ponto de crossover
                if (points.includes(j)) {
                    parent = parent === this ? other : this;
                }
                child.weightsIH[i][j] = parent.weightsIH[i][j];
            }
        }
        
        // Crossover similar para pesos hidden-output
        for (let i = 0; i < this.weightsHO.length; i++) {
            const crossoverPoint = Math.floor(random(0, this.weightsHO[i].length));
            
            for (let j = 0; j < this.weightsHO[i].length; j++) {
                if (j < crossoverPoint) {
                    child.weightsHO[i][j] = this.weightsHO[i][j];
                } else {
                    child.weightsHO[i][j] = other.weightsHO[i][j];
                }
            }
        }
        
        // Taxa de mutação adaptativa baseada na fitness
        child.mutationRate = (this.mutationRate + other.mutationRate) / 2;
        
        // Pequena chance de ajustar a mutação para maior exploração
        if (random() < 0.1) {
            child.mutationRate = constrain(child.mutationRate + random(-0.05, 0.05), 0.01, 0.2);
        }

        return child;
    }

    /**
     * Aplica mutações adaptativas na rede
     * @param {number} fitness - Valor de fitness (opcional)
     */
    mutate(fitness = 1) {
        // Ajusta a intensidade da mutação com base no fitness
        // Menor fitness = maior mutação (mais exploração)
        const adjustedIntensity = this.mutationIntensity * (1 / Math.max(0.1, fitness));
        
        // Aplica mutação nos pesos
        this.weightsIH = this.weightsIH.map(row =>
            row.map(weight =>
                random() < this.mutationRate ? weight + random(-adjustedIntensity, adjustedIntensity) : weight
            )
        );
        
        this.weightsHO = this.weightsHO.map(row =>
            row.map(weight =>
                random() < this.mutationRate ? weight + random(-adjustedIntensity, adjustedIntensity) : weight
            )
        );
        
        // Aplica mutação nos bias
        this.biasH = this.biasH.map(row =>
            row.map(bias =>
                random() < this.mutationRate ? bias + random(-adjustedIntensity, adjustedIntensity) : bias
            )
        );
        
        this.biasO = this.biasO.map(row =>
            row.map(bias =>
                random() < this.mutationRate ? bias + random(-adjustedIntensity, adjustedIntensity) : bias
            )
        );
        
        // Pequena chance de mudar função de ativação
        if (random() < 0.05) {
            const activations = ['sigmoid', 'relu', 'leakyrelu', 'tanh'];
            this.activationFnName = activations[Math.floor(random(0, activations.length))];
        }
    }

    /**
     * Limpa recursos
     */
    dispose() {
        this.memory.inputs = [];
        this.memory.outputs = [];
        this.memory.rewards = [];
    }
}

// Exporta a classe
window.NeuralNetwork = NeuralNetwork; 