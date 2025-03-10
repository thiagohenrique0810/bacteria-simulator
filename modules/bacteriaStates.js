/**
 * Sistema de estados para as bactérias usando Máquina de Estados Finitos (FSM)
 */
class BacteriaStates {
    constructor() {
        // Estados possíveis
        this.states = {
            EXPLORING: 'exploring',
            SEEKING_FOOD: 'seekingFood',
            FLEEING: 'fleeing',
            REPRODUCING: 'reproducing',
            RESTING: 'resting'
        };

        // Estado inicial
        this.currentState = this.states.EXPLORING;

        // Configurações de energia
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyLossRate = 0.05;  // Reduzido para 0.05
        this.restingEnergyGain = 0.2;  // Reduzido para 0.2
        
        // Limites de energia para mudança de estado
        this.energyThresholds = {
            REST: 30,      // Abaixo disso, precisa descansar
            SEEK_FOOD: 60, // Abaixo disso, procura comida
            MATE: 80       // Acima disso, pode se reproduzir
        };

        // Mapeamento de ações do Q-Learning para estados
        this.qLearningToStateMap = {
            'explore': this.states.EXPLORING,
            'seekFood': this.states.SEEKING_FOOD,
            'seekMate': this.states.REPRODUCING,
            'rest': this.states.RESTING
        };
    }

    /**
     * Atualiza o estado da bactéria com base nas condições do ambiente
     * @param {Object} conditions - Condições do ambiente e da bactéria
     * @returns {Object} - Informações sobre o estado atual e ações recomendadas
     */
    update(conditions) {
        this.updateEnergy();
        
        // Se houver uma ação forçada do Q-Learning, use-a
        if (conditions.forcedState && this.qLearningToStateMap[conditions.forcedState]) {
            this.currentState = this.qLearningToStateMap[conditions.forcedState];
        } else {
            // Lógica padrão de FSM
            if (this.energy < this.energyThresholds.REST) {
                this.currentState = this.states.RESTING;
            } else if (conditions.predatorNearby) {
                this.currentState = this.states.FLEEING;
            } else if (this.energy < this.energyThresholds.SEEK_FOOD && conditions.foodNearby) {
                this.currentState = this.states.SEEKING_FOOD;
            } else if (this.energy > this.energyThresholds.MATE && conditions.mateNearby) {
                this.currentState = this.states.REPRODUCING;
            } else if (this.energy < this.energyThresholds.SEEK_FOOD) {
                this.currentState = this.states.SEEKING_FOOD;
            } else {
                this.currentState = this.states.EXPLORING;
            }
        }

        return this.getStateActions();
    }

    /**
     * Atualiza o nível de energia da bactéria
     */
    updateEnergy() {
        if (this.currentState === this.states.RESTING) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.restingEnergyGain);
        } else {
            // Gasta energia baseado no estado atual
            let energyLoss = this.energyLossRate;
            
            switch (this.currentState) {
                case this.states.FLEEING:
                    energyLoss *= 2; // Fuga gasta mais energia
                    break;
                case this.states.SEEKING_FOOD:
                    energyLoss *= 1.5; // Procurar comida gasta mais energia
                    break;
                case this.states.REPRODUCING:
                    energyLoss *= 1.2; // Reprodução gasta um pouco mais de energia
                    break;
            }
            
            this.energy = Math.max(0, this.energy - energyLoss);
        }
    }

    /**
     * Retorna as ações recomendadas para o estado atual
     * @returns {Object} - Ações recomendadas
     */
    getStateActions() {
        const actions = {
            state: this.currentState,
            energy: this.energy,
            shouldMove: true,
            targetType: null,
            speedMultiplier: 1
        };

        switch (this.currentState) {
            case this.states.EXPLORING:
                actions.speedMultiplier = 0.8;
                actions.targetType = 'random';
                break;

            case this.states.SEEKING_FOOD:
                actions.speedMultiplier = 1;
                actions.targetType = 'food';
                break;

            case this.states.FLEEING:
                actions.speedMultiplier = 1.5;
                actions.targetType = 'escape';
                break;

            case this.states.REPRODUCING:
                actions.speedMultiplier = 0.6;
                actions.targetType = 'mate';
                break;

            case this.states.RESTING:
                actions.shouldMove = false;
                actions.speedMultiplier = 0;
                break;
        }

        return actions;
    }

    /**
     * Adiciona energia à bactéria (quando come)
     * @param {number} amount - Quantidade de energia a ser adicionada
     */
    addEnergy(amount) {
        // Limita o ganho de energia para não ultrapassar o máximo
        const energyGain = Math.min(amount, this.maxEnergy - this.energy);
        this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
    }

    /**
     * Remove energia da bactéria
     * @param {number} amount - Quantidade de energia a ser removida
     */
    removeEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
    }

    /**
     * Retorna o estado atual da bactéria
     * @returns {string} - Estado atual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Retorna o nível atual de energia
     * @returns {number} - Nível de energia
     */
    getEnergy() {
        return this.energy;
    }

    /**
     * Converte um estado do Q-Learning para um estado da FSM
     * @param {string} qLearningState - Estado do Q-Learning
     * @returns {string} - Estado correspondente da FSM
     */
    convertQStateToFSMState(qLearningState) {
        return this.qLearningToStateMap[qLearningState] || this.states.EXPLORING;
    }

    /**
     * Calcula a recompensa baseada no estado atual e condições
     * @param {Object} conditions - Condições atuais da bactéria
     * @returns {number} - Valor da recompensa
     */
    calculateStateReward(conditions) {
        let reward = 0;

        switch (this.currentState) {
            case this.states.RESTING:
                reward = this.energy < this.energyThresholds.REST ? 1 : -0.5;
                break;
            case this.states.SEEKING_FOOD:
                reward = conditions.foodNearby ? 1 : -0.2;
                break;
            case this.states.REPRODUCING:
                reward = (this.energy > this.energyThresholds.MATE && conditions.mateNearby) ? 2 : -1;
                break;
            case this.states.EXPLORING:
                reward = 0.1; // Pequena recompensa por explorar
                break;
            case this.states.FLEEING:
                reward = conditions.predatorNearby ? 2 : -1;
                break;
        }

        // Ajusta recompensa baseado na energia
        if (this.energy < this.energyThresholds.REST) {
            reward -= 0.5;
        }

        return reward;
    }
}

// Exporta a classe para uso global
window.BacteriaStates = BacteriaStates; 