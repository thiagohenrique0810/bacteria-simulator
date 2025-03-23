/**
 * Classe para gerenciamento de memória de experiências para rede neural
 */
class NeuralMemory {
    /**
     * Inicializa o sistema de memória
     * @param {number} capacity - Capacidade máxima de experiências armazenadas
     */
    constructor(capacity = 100) {
        this.inputs = [];
        this.outputs = [];
        this.rewards = [];
        this.capacity = capacity;
    }
    
    /**
     * Armazena uma nova experiência na memória
     * @param {Array} inputs - Valores de entrada
     * @param {Array} outputs - Valores de saída
     * @param {number} reward - Recompensa recebida (opcional)
     */
    storeExperience(inputs, outputs, reward = null) {
        // Adiciona à memória
        this.inputs.push([...inputs]);
        this.outputs.push([...outputs]);
        this.rewards.push(reward);
        
        // Limita a capacidade da memória
        if (this.inputs.length > this.capacity) {
            this.inputs.shift();
            this.outputs.shift();
            this.rewards.shift();
        }
    }
    
    /**
     * Atualiza a recompensa da última experiência
     * @param {number} reward - Recompensa pela ação
     */
    updateLastReward(reward) {
        if (this.rewards.length > 0) {
            this.rewards[this.rewards.length - 1] = reward;
        }
    }
    
    /**
     * Retorna experiências com recompensas positivas
     * @returns {Object} - Experiências positivas organizadas em um objeto
     */
    getPositiveExperiences() {
        const positiveIndices = this.rewards
            .map((r, i) => r !== null && r > 0 ? i : -1)
            .filter(i => i !== -1);
        
        return {
            indices: positiveIndices,
            count: positiveIndices.length
        };
    }
    
    /**
     * Retorna uma experiência específica pelo índice
     * @param {number} index - Índice da experiência
     * @returns {Object} - Experiência com inputs, outputs e reward
     */
    getExperience(index) {
        if (index < 0 || index >= this.inputs.length) {
            return null;
        }
        
        return {
            inputs: this.inputs[index],
            outputs: this.outputs[index],
            reward: this.rewards[index]
        };
    }
    
    /**
     * Limpa a memória
     */
    clear() {
        this.inputs = [];
        this.outputs = [];
        this.rewards = [];
    }
    
    /**
     * Verifica se existem experiências com recompensas
     * @returns {boolean} - Verdadeiro se há experiências com recompensas
     */
    hasRewardedExperiences() {
        return this.rewards.some(r => r !== null && r > 0);
    }
}

// Exportar a classe
window.NeuralMemory = NeuralMemory; 