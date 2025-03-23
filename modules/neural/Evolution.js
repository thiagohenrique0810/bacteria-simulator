/**
 * Classe para operações evolutivas da rede neural
 */
class NeuralEvolution {
    /**
     * Combina duas matrizes de pesos usando crossover de múltiplos pontos
     * @param {Array} matrix1 - Primeira matriz de pesos
     * @param {Array} matrix2 - Segunda matriz de pesos
     * @param {number} crossoverPoints - Número de pontos de crossover 
     * @returns {Array} - Nova matriz combinada
     */
    static crossoverMatrix(matrix1, matrix2, crossoverPoints = 1) {
        const result = [];
        
        for (let i = 0; i < matrix1.length; i++) {
            const row1 = matrix1[i];
            const row2 = matrix2[i];
            const rowLength = row1.length;
            const newRow = [];
            
            // Gera pontos de crossover aleatórios
            const points = [];
            for (let p = 0; p < crossoverPoints; p++) {
                points.push(Math.floor(random(0, rowLength)));
            }
            points.sort((a, b) => a - b);
            
            // Define o pai inicial aleatoriamente
            let fromFirst = random() < 0.5;
            
            for (let j = 0; j < rowLength; j++) {
                // Troca de pai a cada ponto de crossover
                if (points.includes(j)) {
                    fromFirst = !fromFirst;
                }
                newRow.push(fromFirst ? row1[j] : row2[j]);
            }
            
            result.push(newRow);
        }
        
        return result;
    }
    
    /**
     * Aplica mutações em uma matriz de pesos
     * @param {Array} matrix - Matriz a ser mutada
     * @param {number} rate - Taxa de mutação (0-1)
     * @param {number} intensity - Intensidade da mutação
     * @returns {Array} - Matriz mutada
     */
    static mutateMatrix(matrix, rate, intensity) {
        return matrix.map(row =>
            row.map(weight =>
                random() < rate ? weight + random(-intensity, intensity) : weight
            )
        );
    }
    
    /**
     * Ajusta a intensidade da mutação com base no fitness
     * @param {number} baseIntensity - Intensidade base de mutação
     * @param {number} fitness - Valor de fitness (1 = normal)
     * @returns {number} - Intensidade ajustada
     */
    static adjustIntensity(baseIntensity, fitness) {
        return baseIntensity * (1 / Math.max(0.1, fitness));
    }
    
    /**
     * Escolhe aleatoriamente uma função de ativação
     * @returns {string} - Nome da função escolhida
     */
    static randomActivationFunction() {
        const activations = ActivationFunctions.getAvailableFunctions();
        return activations[Math.floor(random(0, activations.length))];
    }
    
    /**
     * Determina se deve ocorrer uma mutação na função de ativação
     * @param {number} probability - Probabilidade de mutação (0-1)
     * @returns {boolean} - Verdadeiro se deve mutar
     */
    static shouldMutateActivation(probability) {
        return random() < probability;
    }
}

// Exportar a classe
window.NeuralEvolution = NeuralEvolution; 