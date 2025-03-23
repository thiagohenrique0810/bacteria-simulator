/**
 * Classe responsável pelo aprendizado e tomada de decisões da bactéria
 */
class BacteriaLearning {
    /**
     * Inicializa o módulo de aprendizado
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        
        // Sistema de aprendizado Q-Learning
        this.qLearning = {
            qTable: {},
            learningRate: 0.1,
            discountFactor: 0.9,
            lastState: null,
            lastAction: null,
            actions: ['explore', 'seekFood', 'seekMate', 'rest']
        };

        // Sistema Neural
        this.brain = new NeuralNetwork();
        this.useNeural = true; // Flag para alternar entre Q-Learning e Rede Neural
        this.lastNeuralInputs = null;
        this.lastNeuralOutputs = null;
    }

    /**
     * Normaliza os inputs para a rede neural
     * @param {Object} conditions - Condições do ambiente
     * @returns {Array} - Array normalizado de inputs
     */
    normalizeInputs(conditions) {
        // Garante que conditions seja um objeto válido
        conditions = conditions || {};
        
        // Obtém a energia normalizada da bactéria (0-1)
        let normalizedEnergy = 0.5; // Valor padrão caso não consiga obter
        
        try {
            // Tenta obter energia do stateManager (nova implementação)
            if (this.bacteria.stateManager && this.bacteria.stateManager.currentEnergy !== undefined) {
                normalizedEnergy = this.bacteria.stateManager.currentEnergy / 100;
            }
            // Fallback para o sistema antigo se disponível
            else if (this.bacteria.states && typeof this.bacteria.states.getEnergy === 'function') {
                normalizedEnergy = this.bacteria.states.getEnergy() / 100;
            }
        } catch (error) {
            console.warn(`Erro ao obter energia da bactéria ${this.bacteria.id}:`, error);
        }
        
        // Garante que o valor está entre 0 e 1
        normalizedEnergy = Math.max(0, Math.min(1, normalizedEnergy));
        
        // Retorna o array de inputs normalizado
        return [
            this.bacteria.health / 100, // Saúde normalizada
            normalizedEnergy, // Energia normalizada (já calculada)
            conditions.foodNearby ? 1 : 0, // Comida próxima
            conditions.mateNearby ? 1 : 0, // Parceiro próximo
            conditions.predatorNearby ? 1 : 0, // Predador próximo
            conditions.friendsNearby ? 1 : 0, // Amigos próximos
            conditions.enemiesNearby ? 1 : 0, // Inimigos próximos
            this.bacteria.age / this.bacteria.lifespan, // Idade normalizada
            this.bacteria.dna && this.bacteria.dna.genes ? this.bacteria.dna.genes.aggressiveness || 0.5 : 0.5, // Agressividade
            this.bacteria.dna && this.bacteria.dna.genes ? this.bacteria.dna.genes.sociability || 0.5 : 0.5 // Sociabilidade
        ];
    }

    /**
     * Decide a próxima ação usando Q-Learning ou Rede Neural
     * @param {Object} conditions - Condições do ambiente
     * @returns {string} - Ação escolhida
     */
    decideAction(conditions) {
        // Garante que conditions seja um objeto válido
        conditions = conditions || {};
        
        // Normaliza os inputs para a rede neural
        const normalizedInputs = this.normalizeInputs(conditions);
        
        // Se usar rede neural, pega decisão dela
        if (this.useNeural) {
            return this.neuralDecision(normalizedInputs);
        } else {
            // Caso contrário, usa Q-Learning
            return this.qLearningDecision(conditions);
        }
    }

    /**
     * Implementa Q-Learning para decidir a próxima ação
     * @param {Object} conditions - Condições do ambiente
     * @returns {string} - Ação escolhida
     */
    qLearningDecision(conditions) {
        conditions = conditions || {};
        
        // Obtém a energia atual (com fallback seguro)
        let currentEnergy = 50; // Valor padrão
        try {
            // Tenta obter energia do stateManager (nova implementação)
            if (this.bacteria.stateManager && this.bacteria.stateManager.currentEnergy !== undefined) {
                currentEnergy = this.bacteria.stateManager.currentEnergy;
            }
            // Fallback para o sistema antigo se disponível
            else if (this.bacteria.states && typeof this.bacteria.states.getEnergy === 'function') {
                currentEnergy = this.bacteria.states.getEnergy();
            }
        } catch (error) {
            console.warn(`Erro ao obter energia da bactéria ${this.bacteria.id} para Q-Learning:`, error);
        }
        
        // Verifica se a ação foi recentemente recompensada
        // Converte as condições em uma string para usar como chave no mapa
        const stateKey = JSON.stringify({
            health: Math.floor(this.bacteria.health / 10) * 10,
            energy: Math.floor(currentEnergy / 10) * 10,
            foodNearby: conditions.foodNearby || false,
            mateNearby: conditions.mateNearby || false,
            predatorNearby: conditions.predatorNearby || false,
            friendsNearby: conditions.friendsNearby || false,
            enemiesNearby: conditions.enemiesNearby || false
        });
        
        // Inicializa valores na tabela Q se necessário
        if (!this.qLearning.qTable[stateKey]) {
            this.qLearning.qTable[stateKey] = {};
            for (const action of this.qLearning.actions) {
                this.qLearning.qTable[stateKey][action] = 0;
            }
        }
        
        // Epsilon-greedy: 10% de chance de exploração aleatória
        if (random() < 0.1) {
            // Ação aleatória
            const randomAction = this.qLearning.actions[
                Math.floor(random(this.qLearning.actions.length))
            ];
            
            // Armazena estado e ação para aprendizado futuro
            this.qLearning.lastState = conditions;
            this.qLearning.lastAction = randomAction;
            
            return randomAction;
        }
        
        // Escolhe a ação com maior valor Q para este estado
        let bestAction = this.qLearning.actions[0];
        let maxQ = this.qLearning.qTable[stateKey][bestAction] || 0;
        
        for (const action of this.qLearning.actions) {
            const actionValue = this.qLearning.qTable[stateKey][action] || 0;
            if (actionValue > maxQ) {
                maxQ = actionValue;
                bestAction = action;
            }
        }
        
        // Armazena estado e ação para aprendizado futuro
        this.qLearning.lastState = conditions;
        this.qLearning.lastAction = bestAction;
        
        return bestAction;
    }

    /**
     * Implementa decisão por rede neural
     * @param {Array} inputs - Inputs normalizados
     * @returns {string} - Ação escolhida
     */
    neuralDecision(inputs) {
        // Se não tiver inputs válidos, retorna ação padrão
        if (!inputs || !Array.isArray(inputs)) {
            return 'explore';
        }
        
        // Usa a rede neural para prever a ação
        const outputs = this.brain.predict(inputs);
        
        // Armazena para treinamento futuro
        this.lastNeuralInputs = [...inputs];
        this.lastNeuralOutputs = [...outputs];
        
        // Encontra o índice da maior saída
        let maxIndex = 0;
        for (let i = 1; i < outputs.length; i++) {
            if (outputs[i] > outputs[maxIndex]) {
                maxIndex = i;
            }
        }
        
        // Mapeia o índice para a ação correspondente
        const action = this.qLearning.actions[
            maxIndex % this.qLearning.actions.length
        ];
        
        return action;
    }

    /**
     * Atualiza a tabela Q com uma recompensa
     * @param {Object} conditions - Condições do ambiente
     * @param {string} action - Ação tomada
     * @param {number} reward - Recompensa recebida
     * @param {Object} newConditions - Novas condições após a ação
     */
    updateQTable(conditions, action, reward, newConditions) {
        if (!conditions || !action) return;
        
        // Garante que as condições são objetos válidos
        conditions = conditions || {};
        newConditions = newConditions || {};
        
        // Obtém a energia atual (com fallback seguro)
        let currentEnergy = 50; // Valor padrão
        let newEnergy = 50; // Valor padrão
        
        try {
            // Tenta obter energia atual do stateManager (nova implementação)
            if (this.bacteria.stateManager && this.bacteria.stateManager.currentEnergy !== undefined) {
                currentEnergy = this.bacteria.stateManager.currentEnergy;
            }
            // Fallback para o sistema antigo se disponível
            else if (this.bacteria.states && typeof this.bacteria.states.getEnergy === 'function') {
                currentEnergy = this.bacteria.states.getEnergy();
            }
        } catch (error) {
            console.warn(`Erro ao obter energia atual para updateQTable:`, error);
        }
        
        // Converte condições em chave para a tabela Q
        const stateKey = JSON.stringify({
            health: Math.floor(this.bacteria.health / 10) * 10,
            energy: Math.floor(currentEnergy / 10) * 10,
            foodNearby: conditions.foodNearby || false,
            mateNearby: conditions.mateNearby || false,
            predatorNearby: conditions.predatorNearby || false
        });
        
        const newStateKey = JSON.stringify({
            health: Math.floor(this.bacteria.health / 10) * 10,
            energy: Math.floor(currentEnergy / 10) * 10, // Usamos mesma energia, pois já foi atualizada
            foodNearby: newConditions.foodNearby || false,
            mateNearby: newConditions.mateNearby || false,
            predatorNearby: newConditions.predatorNearby || false
        });
        
        // Inicializa valores na tabela Q se necessário
        if (!this.qLearning.qTable[stateKey]) {
            this.qLearning.qTable[stateKey] = {};
            for (const a of this.qLearning.actions) {
                this.qLearning.qTable[stateKey][a] = 0;
            }
        }
        
        if (!this.qLearning.qTable[newStateKey]) {
            this.qLearning.qTable[newStateKey] = {};
            for (const a of this.qLearning.actions) {
                this.qLearning.qTable[newStateKey][a] = 0;
            }
        }
        
        // Encontra o maior valor Q para o novo estado
        let maxQ = -Infinity;
        for (const a of this.qLearning.actions) {
            const q = this.qLearning.qTable[newStateKey][a] || 0;
            if (q > maxQ) {
                maxQ = q;
            }
        }
        
        // Atualiza valor Q para o estado e ação atual usando a equação de Bellman
        const oldQ = this.qLearning.qTable[stateKey][action] || 0;
        const newQ = oldQ + this.qLearning.learningRate * (
            reward + this.qLearning.discountFactor * maxQ - oldQ
        );
        
        this.qLearning.qTable[stateKey][action] = newQ;
    }

    /**
     * Calcula a recompensa para o sistema de aprendizado
     * @param {Object} conditions - Condições do ambiente
     * @returns {number} - Valor da recompensa
     */
    calculateReward(conditions) {
        // Garante que conditions é um objeto válido
        if (!conditions) {
            return 0;
        }

        let reward = 0;
        
        // Obtém a energia atual (com fallback seguro)
        let currentEnergy = 50; // Valor padrão
        let currentState = 'exploring'; // Estado padrão
        
        try {
            // Tenta obter valores do stateManager (nova implementação)
            if (this.bacteria.stateManager) {
                if (this.bacteria.stateManager.currentEnergy !== undefined) {
                    currentEnergy = this.bacteria.stateManager.currentEnergy;
                }
                if (this.bacteria.stateManager.currentState) {
                    currentState = this.bacteria.stateManager.currentState;
                }
            }
            // Fallback para o sistema antigo se disponível
            else if (this.bacteria.states) {
                if (typeof this.bacteria.states.getEnergy === 'function') {
                    currentEnergy = this.bacteria.states.getEnergy();
                }
                if (typeof this.bacteria.states.getCurrentState === 'function') {
                    currentState = this.bacteria.states.getCurrentState();
                }
            }
        } catch (error) {
            console.warn(`Erro ao obter energia/estado para calculateReward:`, error);
        }
        
        // Recompensas por comida
        if (conditions.foodNearby) {
            reward += 0.5;
            if (currentState === 'seekingFood' || currentState === window.BacteriaStates?.SEARCHING_FOOD) {
                reward += 1.0; // Recompensa extra por buscar comida quando está com fome
            }
        }
        
        // Recompensas por parceiros
        if (conditions.mateNearby && currentEnergy > 70) {
            reward += 0.5;
            if (currentState === 'reproducing' || currentState === window.BacteriaStates?.SEARCHING_MATE) {
                reward += 1.0; // Recompensa extra por buscar parceiro quando tem energia
            }
        }
        
        return reward;
    }
}

// Exporta a classe para uso global
window.BacteriaLearning = BacteriaLearning; 