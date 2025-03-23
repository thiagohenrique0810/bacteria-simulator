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
     * Calcula a derivada da função de ativação para backpropagation
     * @param {number} x - Valor já ativado
     * @returns {number} - Derivada da função de ativação
     */
    activationDerivative(x) {
        switch (this.activationFnName) {
            case 'sigmoid':
                // A derivada do sigmoid é: f(x) * (1 - f(x))
                return x * (1 - x);
            case 'relu':
                // A derivada do ReLU é: 1 se x > 0, 0 caso contrário
                return x > 0 ? 1 : 0;
            case 'leakyrelu':
                // A derivada do LeakyReLU é: 1 se x > 0, alpha caso contrário
                return x > 0 ? 1 : 0.01;
            case 'tanh':
                // A derivada do tanh é: 1 - (f(x))²
                return 1 - (x * x);
            default:
                // Derivada padrão (relu)
                return x > 0 ? 1 : 0;
        }
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
        
        try {
            // Adapta o tamanho dos inputs se necessário
            let processedInputs = [...inputs];
            if (inputs.length !== this.inputSize) {
                console.warn(`Neural network expected ${this.inputSize} inputs but received ${inputs.length}`);
                
                // Se recebeu menos inputs que o esperado, preenche com valores padrão (0.5)
                if (inputs.length < this.inputSize) {
                    processedInputs = [...inputs, ...Array(this.inputSize - inputs.length).fill(0.5)];
                } 
                // Se recebeu mais inputs que o esperado, trunca para o tamanho esperado
                else {
                    processedInputs = inputs.slice(0, this.inputSize);
                }
            }
            
            // Normaliza os inputs para garantir valores válidos
            processedInputs = processedInputs.map(input => {
                // Verifica se o input é um número válido
                if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
                    return 0.5; // Valor padrão para inputs inválidos
                }
                // Garante que o valor está entre 0 e 1
                return Math.max(0, Math.min(1, input));
            });
            
            // Camada oculta - forward pass
            let hidden = [];
            try {
                hidden = this.weightsIH.map((row, i) => {
                    const sum = row.reduce((acc, weight, j) => {
                        const weightedInput = weight * processedInputs[j];
                        return isNaN(weightedInput) ? acc : acc + weightedInput;
                    }, 0);
                    
                    const biasedSum = sum + this.biasH[i][0];
                    return isNaN(biasedSum) ? 0.5 : this.activate(biasedSum);
                });
            } catch (hiddenError) {
                console.error("Erro ao calcular camada oculta:", hiddenError);
                hidden = Array(this.hiddenSize).fill(0.5);
            }

            // Verifica se 'hidden' tem valores válidos
            if (!hidden || !Array.isArray(hidden) || hidden.some(h => isNaN(h))) {
                console.warn("Valores inválidos na camada oculta:", hidden);
                hidden = Array(this.hiddenSize).fill(0.5);
            }

            // Camada de saída - forward pass
            let outputs = [];
            try {
                outputs = this.weightsHO.map((row, i) => {
                    const sum = row.reduce((acc, weight, j) => {
                        const weightedHidden = weight * hidden[j];
                        return isNaN(weightedHidden) ? acc : acc + weightedHidden;
                    }, 0);
                    
                    const biasedSum = sum + this.biasO[i][0];
                    return isNaN(biasedSum) ? 0.5 : this.activate(biasedSum);
                });
            } catch (outputError) {
                console.error("Erro ao calcular camada de saída:", outputError);
                outputs = Array(this.outputSize).fill(0.5);
            }
            
            // Verificação final - garante que todos os outputs são números válidos
            outputs = outputs.map((output, i) => {
                if (typeof output !== 'number' || isNaN(output) || !isFinite(output)) {
                    console.warn(`Output inválido no índice ${i}:`, output);
                    return 0.5;
                }
                // Garante que o valor está entre 0 e 1
                return Math.max(0, Math.min(1, output));
            });
            
            // Armazena na memória se estiver disponível
            if (this.memory && typeof this.memory.storeExperience === 'function') {
                this.memory.storeExperience(inputs, outputs);
            }

            // Log para debug (baixa frequência)
            if (Math.random() < 0.001) { // 0.1% das predições
                console.log("Predict: outputs =", outputs.map(o => o.toFixed(3)));
            }

            return outputs;
        } catch (error) {
            console.error('Erro grave na rede neural:', error);
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
     * Treina a rede com um conjunto de inputs e targets
     * @param {Array} inputs - Array de inputs
     * @param {Array} targets - Array de targets esperados
     * @returns {number} - Erro médio
     */
    train(inputs, targets) {
        // Verificação de segurança para inputs e targets
        if (!inputs || !Array.isArray(inputs)) {
            console.warn('Neural network train received null or non-array inputs:', inputs);
            return 1; // Retorna erro máximo
        }
        
        if (!targets || !Array.isArray(targets)) {
            console.warn('Neural network train received null or non-array targets:', targets);
            return 1; // Retorna erro máximo
        }

        try {
            // Adapta o tamanho dos inputs se necessário
            let processedInputs = [...inputs];
            if (inputs.length !== this.inputSize) {
                console.warn(`Neural network expected ${this.inputSize} inputs but received ${inputs.length}`);
                
                // Se recebeu menos inputs que o esperado, preenche com valores padrão (0.5)
                if (inputs.length < this.inputSize) {
                    processedInputs = [...inputs, ...Array(this.inputSize - inputs.length).fill(0.5)];
                } 
                // Se recebeu mais inputs que o esperado, trunca para o tamanho esperado
                else {
                    processedInputs = inputs.slice(0, this.inputSize);
                }
            }
            
            // Normaliza os inputs para garantir valores válidos
            processedInputs = processedInputs.map(input => {
                // Verifica se o input é um número válido
                if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
                    return 0.5; // Valor padrão para inputs inválidos
                }
                // Garante que o valor está entre 0 e 1
                return Math.max(0, Math.min(1, input));
            });
            
            // Adapta o tamanho dos targets se necessário
            let processedTargets = [...targets];
            if (targets.length !== this.outputSize) {
                console.warn(`Neural network expected ${this.outputSize} targets but received ${targets.length}`);
                
                // Se recebeu menos targets que o esperado, preenche com valores padrão (0.5)
                if (targets.length < this.outputSize) {
                    processedTargets = [...targets, ...Array(this.outputSize - targets.length).fill(0.5)];
                } 
                // Se recebeu mais targets que o esperado, trunca para o tamanho esperado
                else {
                    processedTargets = targets.slice(0, this.outputSize);
                }
            }
            
            // Normaliza os targets para garantir valores válidos
            processedTargets = processedTargets.map(target => {
                // Verifica se o target é um número válido
                if (typeof target !== 'number' || isNaN(target) || !isFinite(target)) {
                    return 0.5; // Valor padrão para targets inválidos
                }
                // Garante que o valor está entre 0 e 1
                return Math.max(0, Math.min(1, target));
            });
            
            // Converte objetos para arrays se necessário (para compatibilidade)
            if (!Array.isArray(processedInputs) && typeof processedInputs === 'object') {
                processedInputs = Object.values(processedInputs);
            }
            
            if (!Array.isArray(processedTargets) && typeof processedTargets === 'object') {
                processedTargets = Object.values(processedTargets);
            }
            
            // Camada oculta - forward pass
            let hidden = [];
            try {
                hidden = this.weightsIH.map((row, i) => {
                    const sum = row.reduce((acc, weight, j) => {
                        const weightedInput = weight * processedInputs[j];
                        return isNaN(weightedInput) ? acc : acc + weightedInput;
                    }, 0);
                    
                    const biasedSum = sum + this.biasH[i][0];
                    return isNaN(biasedSum) ? 0.5 : this.activate(biasedSum);
                });
            } catch (hiddenError) {
                console.error("Erro ao calcular camada oculta durante treino:", hiddenError);
                hidden = Array(this.hiddenSize).fill(0.5);
                return 1; // Retorna erro máximo
            }

            // Verifica se 'hidden' tem valores válidos
            if (!hidden || !Array.isArray(hidden) || hidden.some(h => isNaN(h))) {
                console.warn("Valores inválidos na camada oculta durante treino:", hidden);
                hidden = Array(this.hiddenSize).fill(0.5);
                return 1; // Retorna erro máximo
            }

            // Camada de saída - forward pass
            let outputs = [];
            try {
                outputs = this.weightsHO.map((row, i) => {
                    const sum = row.reduce((acc, weight, j) => {
                        const weightedHidden = weight * hidden[j];
                        return isNaN(weightedHidden) ? acc : acc + weightedHidden;
                    }, 0);
                    
                    const biasedSum = sum + this.biasO[i][0];
                    return isNaN(biasedSum) ? 0.5 : this.activate(biasedSum);
                });
            } catch (outputError) {
                console.error("Erro ao calcular camada de saída durante treino:", outputError);
                outputs = Array(this.outputSize).fill(0.5);
                return 1; // Retorna erro máximo
            }
            
            // Cálculo do erro
            const errors = processedTargets.map((target, i) => target - outputs[i]);
            
            // Backpropagation - camada de saída
            const outputGradients = outputs.map((output, i) => 
                errors[i] * this.activationDerivative(output) * this.learningRate
            );
            
            // Backpropagation - camada oculta
            const hiddenErrors = this.weightsHO[0].map((_, i) => {
                return this.weightsHO.reduce((error, row, j) => {
                    return error + outputGradients[j] * row[i];
                }, 0);
            });
            
            const hiddenGradients = hidden.map((h, i) => 
                hiddenErrors[i] * this.activationDerivative(h) * this.learningRate
            );
            
            // Atualiza pesos camada oculta -> saída
            this.weightsHO.forEach((row, i) => {
                row.forEach((_, j) => {
                    const delta = outputGradients[i] * hidden[j];
                    if (!isNaN(delta)) {
                        this.weightsHO[i][j] += delta;
                    }
                });
                // Atualiza bias
                if (!isNaN(outputGradients[i])) {
                    this.biasO[i][0] += outputGradients[i];
                }
            });
            
            // Atualiza pesos entrada -> camada oculta
            this.weightsIH.forEach((row, i) => {
                row.forEach((_, j) => {
                    const delta = hiddenGradients[i] * processedInputs[j];
                    if (!isNaN(delta)) {
                        this.weightsIH[i][j] += delta;
                    }
                });
                // Atualiza bias
                if (!isNaN(hiddenGradients[i])) {
                    this.biasH[i][0] += hiddenGradients[i];
                }
            });
            
            // Calcula erro médio
            const meanError = errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
            
            // Log para debug (baixa frequência)
            if (Math.random() < 0.001) { // 0.1% dos treinos
                console.log("Train: error =", meanError.toFixed(4));
            }
            
            return meanError;
        } catch (error) {
            console.error('Erro grave no treinamento da rede neural:', error);
            return 1; // Retorna erro máximo
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