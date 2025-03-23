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
        this.brain = new NeuralNetwork(12, 12, 5); // 12 inputs, 12 neurônios na camada oculta, 5 outputs
        this.useNeural = true; // Flag para alternar entre Q-Learning e Rede Neural
        this.lastNeuralInputs = null;
        this.lastNeuralOutputs = null;
        
        // Parâmetros contínuos para movimento mais orgânico
        this.movementParams = {
            direction: 0,           // Direção de 0-360 graus
            speed: 0.5,             // Velocidade de 0-1
            wanderStrength: 0.3,    // Intensidade do movimento aleatório
            noiseStrength: 0.2,     // Intensidade do ruído perlin
            targetWeight: 0.5       // Peso do alvo vs. movimento aleatório
        };
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
        
        // Calcula idade normalizada com segurança para evitar NaN
        let ageNormalized = 0.5; // Valor padrão caso não consiga calcular
        if (this.bacteria && typeof this.bacteria.age === 'number' && 
            typeof this.bacteria.lifespan === 'number' && this.bacteria.lifespan > 0) {
            ageNormalized = this.bacteria.age / this.bacteria.lifespan;
            // Garante que o valor está entre 0 e 1
            ageNormalized = Math.max(0, Math.min(1, ageNormalized));
        }
        
        // Inicializa o valor de curiosidade da bactéria
        let curiosity = 0.5; // Valor padrão
        if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes && 
            typeof this.bacteria.dna.genes.curiosity === 'number') {
            curiosity = this.bacteria.dna.genes.curiosity;
            // Garante que o valor está entre 0 e 1
            curiosity = Math.max(0, Math.min(1, curiosity));
        }
        
        // Retorna o array de inputs normalizado
        return [
            this.bacteria && typeof this.bacteria.health === 'number' ? this.bacteria.health / 100 : 0.5, // Saúde normalizada
            normalizedEnergy, // Energia normalizada (já calculada)
            conditions.foodNearby ? 1 : 0, // Comida próxima
            conditions.foodDistance ? Math.min(1, 1/conditions.foodDistance) : 0, // Distância inversamente proporcional
            conditions.mateNearby ? 1 : 0, // Parceiro próximo
            conditions.mateDistance ? Math.min(1, 1/conditions.mateDistance) : 0, // Distância inversamente proporcional
            conditions.predatorNearby ? 1 : 0, // Predador próximo
            conditions.friendsNearby ? 1 : 0, // Amigos próximos
            ageNormalized, // Idade normalizada (com proteção contra NaN)
            curiosity // Curiosidade (com proteção contra valores inválidos)
        ];
    }

    /**
     * Decide a próxima ação usando Q-Learning ou Rede Neural
     * @param {Object} conditions - Condições do ambiente
     * @returns {Object} - Parâmetros de movimento e ação escolhida
     */
    decideAction(conditions) {
        // Garante que conditions seja um objeto válido
        conditions = conditions || {};
        
        // Normaliza os inputs para a rede neural
        const normalizedInputs = this.normalizeInputs(conditions);
        
        // Se usar rede neural, pega decisão dela
        if (this.useNeural) {
            const result = this.neuralDecisionContinuous(normalizedInputs, conditions);
            // Armazena para aprendizado
            this.lastNeuralInputs = normalizedInputs;
            this.lastNeuralOutputs = result;
            return result;
        } else {
            // Caso contrário, usa Q-Learning
            return {
                action: this.qLearningDecision(conditions),
                movementParams: this.movementParams
            };
        }
    }
    
    /**
     * Versão contínua da decisão neural para movimentos mais naturais
     * @param {Array} inputs - Inputs normalizados para a rede
     * @param {Object} conditions - Condições do ambiente
     * @returns {Object} - Parâmetros de movimento e ação
     */
    neuralDecisionContinuous(inputs, conditions) {
        try {
            // Garante que conditions seja um objeto válido
            conditions = conditions || {};
            
            // Obtém as coordenadas relativas da bactéria no mundo
            const worldWidth = typeof width !== 'undefined' ? width : 800;
            const worldHeight = typeof height !== 'undefined' ? height : 600;
            
            // Protege contra valores NaN ou indefinidos na posição
            let relX = 0.5;
            let relY = 0.5;
            
            if (this.bacteria && this.bacteria.pos && 
                typeof this.bacteria.pos.x === 'number' && !isNaN(this.bacteria.pos.x) &&
                typeof this.bacteria.pos.y === 'number' && !isNaN(this.bacteria.pos.y)) {
                relX = this.bacteria.pos.x / worldWidth;
                relY = this.bacteria.pos.y / worldHeight;
                
                // Garante que os valores estão entre 0 e 1
                relX = Math.max(0, Math.min(1, relX));
                relY = Math.max(0, Math.min(1, relY));
            }
            
            // Verifica se a bactéria está em um canto
            const marginSize = 0.12; // 12% da largura/altura do mundo é considerado "perto da borda"
            const isNearLeft = relX < marginSize;
            const isNearRight = relX > (1 - marginSize);
            const isNearTop = relY < marginSize;
            const isNearBottom = relY > (1 - marginSize);
            
            // Considera em canto se estiver em duas bordas adjacentes
            const isInCorner = (isNearLeft && isNearTop) || 
                             (isNearLeft && isNearBottom) || 
                             (isNearRight && isNearTop) || 
                             (isNearRight && isNearBottom);
            
            // Detecta se está preso em um canto
            // Mantém o estado de quando ficou presa no canto pela última vez
            if (!this.hasOwnProperty('cornerData')) {
                this.cornerData = {
                    lastPosition: { x: relX, y: relY },
                    timeInCorner: 0,
                    lastCornerTime: 0,
                    isStuck: false
                };
            }
            
            // Atualiza a detecção de "preso no canto"
            if (isInCorner) {
                // Calcula distância desde a última posição registrada
                const movementDistance = Math.sqrt(
                    Math.pow(relX - this.cornerData.lastPosition.x, 2) + 
                    Math.pow(relY - this.cornerData.lastPosition.y, 2)
                );
                
                // Se moveu muito pouco, aumenta o contador de tempo no canto
                if (movementDistance < 0.01) { // 1% do tamanho do mundo é considerado "parado"
                    this.cornerData.timeInCorner++;
                    
                    // Considera preso após ficar por um tempo no mesmo lugar do canto
                    if (this.cornerData.timeInCorner > 60) { // 60 frames = ~1 segundo
                        this.cornerData.isStuck = true;
                        // Registra quando ficou presa para aprendizado
                        this.cornerData.lastCornerTime = frameCount;
                    }
                } else {
                    // Se moveu o suficiente, diminui o contador (mas não reseta completamente)
                    this.cornerData.timeInCorner = Math.max(0, this.cornerData.timeInCorner - 1);
                }
            } else {
                // Fora do canto, diminui progressivamente o contador
                this.cornerData.timeInCorner = Math.max(0, this.cornerData.timeInCorner - 2);
                // Se saiu do canto e estava preso, considera que aprendeu a sair
                if (this.cornerData.isStuck) {
                    this.cornerData.isStuck = false;
                    
                    // Aplica reforço positivo por ter saído do canto
                    // O cérebro aprende que o comportamento que levou a sair do canto é bom
                    if (this.lastNeuralOutputs && this.lastNeuralInputs) {
                        console.log("Bactéria aprendeu a sair do canto!");
                        this.brain.train(this.lastNeuralInputs, this.lastNeuralOutputs.movementParams);
                    }
                }
            }
            
            // Atualiza a posição para a próxima comparação
            this.cornerData.lastPosition = { x: relX, y: relY };
            
            // Inclui informação de canto nos inputs
            const cornerInput = this.cornerData.isStuck ? 1 : (isInCorner ? 0.5 : 0);
            
            // Adiciona informação de posição e canto aos inputs
            // Os 12 inputs completos são:
            // 0: Saúde normalizada (0-1)
            // 1: Energia normalizada (0-1)
            // 2: Comida próxima (0/1)
            // 3: Distância inversamente proporcional à comida (0-1)
            // 4: Parceiro próximo (0/1)
            // 5: Distância inversamente proporcional ao parceiro (0-1)
            // 6: Predador próximo (0/1)
            // 7: Amigos próximos (0/1)
            // 8: Idade normalizada (0-1)
            // 9: Curiosidade (0-1)
            // 10: Posição relativa X (0-1)
            // 11: Posição relativa Y (0-1)
            
            // Substitui o último input (curiosidade) por cornerInput quando a bactéria está presa
            // para manter apenas 12 inputs no total
            if (this.cornerData.isStuck) {
                inputs[9] = cornerInput; // Substitui curiosidade por cornerInput quando presa
            }
            
            const positionInputs = [...inputs, relX, relY];
            
            // Obtém as saídas contínuas da rede neural
            const outputs = this.brain.predict(positionInputs);
            
            // Os 5 outputs agora representam:
            // 0: Direção (0-1, escalado para 0-360 graus)
            // 1: Velocidade (0-1)
            // 2: Intensidade de wandering (0-1)
            // 3: Intensidade de noise (0-1)
            // 4: Peso do alvo (0-1)
            
            // Converte a direção para graus
            const direction = outputs[0] * TWO_PI;
            
            // Calcula a proximidade da borda (0 na borda, 1 no centro)
            const borderProximity = Math.min(relX, 1-relX, relY, 1-relY) * 4;
            
            // Ajusta parâmetros para situações de canto
            let wanderStrength, noiseStrength, explorationSpeed;
            
            if (this.cornerData.isStuck) {
                // Se estiver presa no canto, aumenta drasticamente a aleatoriedade e velocidade
                wanderStrength = Math.max(0.8, outputs[2]); // Mínimo de 0.8
                noiseStrength = Math.max(0.6, outputs[3]); // Mínimo de 0.6
                explorationSpeed = Math.max(0.7, outputs[1]); // Mínimo de 0.7
            } else {
                // Comportamento normal, ajustado pela proximidade da borda
                wanderStrength = outputs[2] * (1 + (1-borderProximity) * 0.3);
                noiseStrength = outputs[3] * (1 + (1-borderProximity) * 0.2);
                
                // Aumenta a velocidade para explorar mais se estiver em áreas sem alvos
                explorationSpeed = !conditions.foodNearby && !conditions.mateNearby 
                    ? outputs[1] * 1.1 // Aumento moderado para exploração
                    : outputs[1];
            }
            
            // Atualiza os parâmetros de movimento
            this.movementParams = {
                direction: direction,
                speed: explorationSpeed,
                wanderStrength: wanderStrength,
                noiseStrength: noiseStrength,
                targetWeight: outputs[4],
                isStuck: this.cornerData.isStuck // Indica se está presa para o sistema de movimento
            };
            
            // Determina a ação principal com base nos parâmetros
            let action;
            
            // Regras para decidir a ação
            if (this.cornerData.isStuck) {
                // Se estiver presa, prioriza exploração para sair do canto
                action = 'explore';
            } else if (outputs[1] < 0.2) { // Velocidade muito baixa
                action = 'rest';
            } else if (outputs[4] > 0.7 && conditions.foodNearby) { // Alto peso de alvo e comida próxima
                action = 'seekFood';
            } else if (outputs[4] > 0.7 && conditions.mateNearby) { // Alto peso de alvo e parceiro próximo
                action = 'seekMate';
            } else {
                // Permite explorar cantos, mas com menor probabilidade
                action = 'explore';
            }
            
            return {
                action: action,
                movementParams: this.movementParams
            };
        } catch (error) {
            console.error("Erro na decisão neural contínua:", error);
            // Retorna valores padrão em caso de erro
            return {
                action: 'explore',
                movementParams: {
                    direction: random(TWO_PI),
                    speed: 0.5,
                    wanderStrength: 0.3,
                    noiseStrength: 0.2,
                    targetWeight: 0.5,
                    isStuck: false
                }
            };
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
     * Aplica recompensa para o aprendizado
     * @param {number} reward - Valor da recompensa
     */
    applyReward(reward) {
        // Atualiza o Q-Learning se foi a última decisão
        if (!this.useNeural && this.qLearning.lastState && this.qLearning.lastAction) {
            this.updateQTable(this.qLearning.lastState, this.qLearning.lastAction, reward);
        }
        
        // Atualiza a rede neural se foi a última decisão
        if (this.useNeural && this.lastNeuralInputs && this.lastNeuralOutputs) {
            // Ajusta os pesos com base na recompensa
            // Para simplificar, apenas reforçamos os outputs atuais quando a recompensa é positiva
            if (reward > 0) {
                this.brain.train(this.lastNeuralInputs, this.lastNeuralOutputs.movementParams);
            }
        }
    }

    /**
     * Atualiza a tabela Q com base na recompensa recebida
     * @param {Object} state - Estado anterior
     * @param {string} action - Ação tomada
     * @param {number} reward - Recompensa recebida
     */
    updateQTable(state, action, reward) {
        if (!state || !action) return;
        
        // Garante que as condições são objetos válidos
        state = state || {};
        
        // Obtém a energia atual (com fallback seguro)
        let currentEnergy = 50; // Valor padrão
        
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
            foodNearby: state.foodNearby || false,
            mateNearby: state.mateNearby || false,
            predatorNearby: state.predatorNearby || false
        });
        
        // Inicializa valores na tabela Q se necessário
        if (!this.qLearning.qTable[stateKey]) {
            this.qLearning.qTable[stateKey] = {};
            for (const a of this.qLearning.actions) {
                this.qLearning.qTable[stateKey][a] = 0;
            }
        }
        
        // Atualiza valor Q para o estado e ação atual usando a equação de Bellman
        const oldQ = this.qLearning.qTable[stateKey][action] || 0;
        const newQ = oldQ + this.qLearning.learningRate * (
            reward + this.qLearning.discountFactor * oldQ - oldQ
        );
        
        this.qLearning.qTable[stateKey][action] = newQ;
    }

    /**
     * Decisão neural padrão (para compatibilidade com código existente)
     * @param {Array} inputs - Inputs normalizados 
     * @returns {string} - Ação escolhida
     */
    neuralDecision(inputs) {
        try {
            // Chama a versão contínua e retorna apenas a ação
            const result = this.neuralDecisionContinuous(inputs);
            return result.action;
        } catch (error) {
            console.error("Erro na decisão neural:", error);
            return 'explore'; // Valor padrão em caso de erro
        }
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