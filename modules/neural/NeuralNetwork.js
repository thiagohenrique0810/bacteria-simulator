/**
 * Rede Neural avançada para tomada de decisões
 * Versão modularizada para facilitar manutenção
 */
class NeuralNetwork {
    /**
     * Inicializa a rede neural
     * @param {number} inputSize - Tamanho da camada de entrada
     * @param {number} hiddenSize - Tamanho da camada oculta
     * @param {number} outputSize - Tamanho da camada de saída
     */
    constructor(inputSize = 12, hiddenSize = 12, outputSize = 5) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        
        // Inicializa pesos
        this.weightsIH = this.createMatrix(this.hiddenSize, this.inputSize);
        this.weightsHO = this.createMatrix(this.outputSize, this.hiddenSize);
        this.biasH = this.createMatrix(this.hiddenSize, 1);
        this.biasO = this.createMatrix(this.outputSize, 1);
        
        // Memória de experiência - usando o módulo NeuralMemory
        this.memory = new NeuralMemory(100);
        
        // Parâmetros de aprendizado e mutação
        this.learningRate = 0.1;
        this.mutationRate = 0.1;
        this.mutationIntensity = 0.2;
        
        // Função de ativação padrão
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
     * Aplica a função de ativação selecionada usando o módulo ActivationFunctions
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    activate(x) {
        return ActivationFunctions.activate(this.activationFnName, x);
    }
    
    /**
     * Define a função de ativação
     * @param {string} fnName - Nome da função de ativação
     */
    setActivationFunction(fnName) {
        const availableFunctions = ActivationFunctions.getAvailableFunctions();
        if (availableFunctions.includes(fnName)) {
            this.activationFnName = fnName;
        }
    }

    /**
     * Prediz uma ação baseada nos inputs
     * @param {Array} inputs - Array de inputs
     * @returns {Array} - Array de outputs
     */
    predict(inputs) {
        // Verificação de segurança para inputs
        if (!inputs || !Array.isArray(inputs)) {
            console.warn('Neural network received null or non-array inputs:', inputs);
            // Retorna um array de saída com valores padrão
            return Array(this.outputSize).fill(0.5);
        }
        
        // Adapta o tamanho dos inputs se necessário
        let processedInputs = [...inputs];
        if (inputs.length !== this.inputSize) {
            console.warn(`Neural network expected ${this.inputSize} inputs but received ${inputs.length}:`, inputs);
            
            // Se recebeu menos inputs que o esperado, preenche com valores padrão (0.5)
            if (inputs.length < this.inputSize) {
                processedInputs = [...inputs, ...Array(this.inputSize - inputs.length).fill(0.5)];
            } 
            // Se recebeu mais inputs que o esperado, trunca para o tamanho esperado
            else {
                processedInputs = inputs.slice(0, this.inputSize);
            }
            
            console.log('Adjusted inputs to match network size:', processedInputs);
        }
        
        try {
            // Camada oculta
            let hidden = this.weightsIH.map((row, i) => 
                this.activate(row.reduce((sum, weight, j) => sum + weight * processedInputs[j], 0) + this.biasH[i][0])
            );

            // Camada de saída
            let outputs = this.weightsHO.map((row, i) =>
                this.activate(row.reduce((sum, weight, j) => sum + weight * hidden[j], 0) + this.biasO[i][0])
            );
            
            // Armazena na memória
            this.memory.storeExperience(inputs, outputs);

            return outputs;
        } catch (error) {
            console.error('Error in neural network prediction:', error);
            // Em caso de erro, retorna um array com valores padrão
            return Array(this.outputSize).fill(0.5);
        }
    }
    
    /**
     * Atualiza a rede com base em recompensa recebida
     * @param {number} reward - Recompensa pela ação
     */
    updateWithReward(reward) {
        this.memory.updateLastReward(reward);
    }
    
    /**
     * Aprende baseado nas experiências passadas com recompensas positivas
     */
    learn() {
        // Verifica se há experiências com recompensas positivas
        if (!this.memory.hasRewardedExperiences()) return;
        
        // Obtém experiências com recompensas positivas
        const positiveExperiences = this.memory.getPositiveExperiences();
        
        // Aprende com cada experiência positiva
        for (const idx of positiveExperiences.indices) {
            const experience = this.memory.getExperience(idx);
            const inputs = experience.inputs;
            const outputs = experience.outputs;
            const reward = experience.reward;
            
            // Aplica o aprendizado
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
        child.weightsIH = NeuralEvolution.crossoverMatrix(
            this.weightsIH, other.weightsIH, Math.floor(random(1, 3))
        );
        
        // Crossover para pesos hidden-output
        child.weightsHO = NeuralEvolution.crossoverMatrix(
            this.weightsHO, other.weightsHO, 1
        );
        
        // Crossover para bias de ambas as camadas
        child.biasH = NeuralEvolution.crossoverMatrix(this.biasH, other.biasH, 1);
        child.biasO = NeuralEvolution.crossoverMatrix(this.biasO, other.biasO, 1);
        
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
        const adjustedIntensity = NeuralEvolution.adjustIntensity(this.mutationIntensity, fitness);
        
        // Aplica mutação nos pesos e bias usando o módulo de evolução
        this.weightsIH = NeuralEvolution.mutateMatrix(
            this.weightsIH, this.mutationRate, adjustedIntensity
        );
        
        this.weightsHO = NeuralEvolution.mutateMatrix(
            this.weightsHO, this.mutationRate, adjustedIntensity
        );
        
        this.biasH = NeuralEvolution.mutateMatrix(
            this.biasH, this.mutationRate, adjustedIntensity
        );
        
        this.biasO = NeuralEvolution.mutateMatrix(
            this.biasO, this.mutationRate, adjustedIntensity
        );
        
        // Pequena chance de mudar função de ativação
        if (NeuralEvolution.shouldMutateActivation(0.05)) {
            this.activationFnName = NeuralEvolution.randomActivationFunction();
        }
    }

    /**
     * Limpa recursos
     */
    dispose() {
        this.memory.clear();
    }
}

// Exporta a classe 
window.NeuralNetwork = NeuralNetwork; 