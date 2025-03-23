/**
 * Funções de ativação para redes neurais
 */
class ActivationFunctions {
    /**
     * Função de ativação sigmoid
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    /**
     * Função de ativação ReLU (Rectified Linear Unit)
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    static relu(x) {
        return Math.max(0, x);
    }
    
    /**
     * Função de ativação LeakyReLU
     * @param {number} x - Valor de entrada
     * @param {number} alpha - Inclinação para valores negativos
     * @returns {number} - Valor ativado
     */
    static leakyRelu(x, alpha = 0.01) {
        return x > 0 ? x : alpha * x;
    }
    
    /**
     * Função de ativação tanh
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    static tanh(x) {
        return Math.tanh(x);
    }
    
    /**
     * Aplica a função de ativação selecionada
     * @param {string} fnName - Nome da função de ativação
     * @param {number} x - Valor de entrada
     * @returns {number} - Valor ativado
     */
    static activate(fnName, x) {
        switch (fnName) {
            case 'sigmoid': return this.sigmoid(x);
            case 'relu': return this.relu(x);
            case 'leakyrelu': return this.leakyRelu(x);
            case 'tanh': return this.tanh(x);
            default: return this.relu(x);
        }
    }
    
    /**
     * Retorna lista de funções de ativação disponíveis
     * @returns {Array} - Lista de nomes de funções de ativação
     */
    static getAvailableFunctions() {
        return ['sigmoid', 'relu', 'leakyrelu', 'tanh'];
    }
}

// Exportar a classe
window.ActivationFunctions = ActivationFunctions; 