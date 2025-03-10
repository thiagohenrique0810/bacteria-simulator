/**
 * Rede Neural simples para tomada de decisões
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
        
        this.mutationRate = 0.1;
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
     * Prediz uma ação baseada nos inputs
     * @param {Array} inputs - Array de inputs
     * @returns {Array} - Array de outputs
     */
    predict(inputs) {
        // Camada oculta
        let hidden = this.weightsIH.map(row => 
            this.sigmoid(row.reduce((sum, weight, i) => sum + weight * inputs[i], 0))
        );

        // Camada de saída
        let outputs = this.weightsHO.map(row =>
            this.sigmoid(row.reduce((sum, weight, i) => sum + weight * hidden[i], 0))
        );

        return outputs;
    }

    /**
     * Combina duas redes neurais
     * @param {NeuralNetwork} other - Outra rede neural
     * @returns {NeuralNetwork} - Nova rede neural combinada
     */
    crossover(other) {
        let child = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
        
        // Combina pesos
        child.weightsIH = this.weightsIH.map((row, i) =>
            row.map((weight, j) => 
                random() < 0.5 ? weight : other.weightsIH[i][j]
            )
        );
        
        child.weightsHO = this.weightsHO.map((row, i) =>
            row.map((weight, j) => 
                random() < 0.5 ? weight : other.weightsHO[i][j]
            )
        );

        return child;
    }

    /**
     * Aplica mutações na rede
     */
    mutate() {
        this.weightsIH = this.weightsIH.map(row =>
            row.map(weight =>
                random() < this.mutationRate ? weight + random(-0.1, 0.1) : weight
            )
        );
        
        this.weightsHO = this.weightsHO.map(row =>
            row.map(weight =>
                random() < this.mutationRate ? weight + random(-0.1, 0.1) : weight
            )
        );
    }

    /**
     * Limpa recursos
     */
    dispose() {
        // Nada a limpar nesta implementação simples
    }
}

// Exporta a classe
window.NeuralNetwork = NeuralNetwork; 