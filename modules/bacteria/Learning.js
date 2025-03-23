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
            const result = this.neuralDecisionContinuous(conditions);
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
     * @param {Object} conditions - Condições do ambiente
     * @returns {Object} - Parâmetros de movimento e ação
     */
    neuralDecisionContinuous(conditions) {
        try {
            // Garante que conditions seja um objeto válido
            conditions = conditions || {};
            
            // Obtém a posição da bactéria
            const pos = this.bacteria.pos;
            const worldWidth = typeof width !== 'undefined' ? width : 800;
            const worldHeight = typeof height !== 'undefined' ? height : 600;
            
            // Protege contra valores NaN ou indefinidos na posição
            let relX = 0.5;
            let relY = 0.5;
            
            if (pos && typeof pos.x === 'number' && !isNaN(pos.x) &&
                typeof pos.y === 'number' && !isNaN(pos.y)) {
                relX = pos.x / worldWidth;
                relY = pos.y / worldHeight;
                
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
                        
                        // Verifica se movementParams existe e é um array ou objeto válido
                        if (this.lastNeuralOutputs.movementParams) {
                            try {
                                // Extrai os valores necessários para o treino
                                const targetArray = [];
                                
                                // Se movementParams for um objeto, converte para array
                                if (typeof this.lastNeuralOutputs.movementParams === 'object' && !Array.isArray(this.lastNeuralOutputs.movementParams)) {
                                    // Extrai os 5 valores necessários para o treinamento
                                    // Direção normalizada para 0-1
                                    targetArray.push(this.lastNeuralOutputs.movementParams.direction / TWO_PI);
                                    // Velocidade
                                    targetArray.push(this.lastNeuralOutputs.movementParams.speed);
                                    // Intensidade do wandering
                                    targetArray.push(this.lastNeuralOutputs.movementParams.wanderStrength);
                                    // Intensidade do noise
                                    targetArray.push(this.lastNeuralOutputs.movementParams.noiseStrength);
                                    // Peso do alvo
                                    targetArray.push(this.lastNeuralOutputs.movementParams.targetWeight);
                                } else if (Array.isArray(this.lastNeuralOutputs.movementParams)) {
                                    // Se já for um array, usa diretamente
                                    targetArray.push(...this.lastNeuralOutputs.movementParams);
                                } else {
                                    // Se não for nem objeto nem array, cria valores padrão
                                    targetArray.push(0.5, 0.5, 0.5, 0.5, 0.5);
                                }
                                
                                // Valida o tamanho do array
                                while (targetArray.length < 5) {
                                    targetArray.push(0.5); // Preenche com valores padrão se necessário
                                }
                                
                                // Agora treina com o array validado
                                console.log("Treinando com targets:", targetArray);
                                this.brain.train(this.lastNeuralInputs, targetArray);
                            } catch (error) {
                                console.error("Erro ao treinar rede neural após sair do canto:", error);
                            }
                        } else {
                            console.warn("Impossível treinar: movementParams inválido", this.lastNeuralOutputs);
                        }
                    }
                }
            }
            
            // Atualiza a posição para a próxima comparação
            this.cornerData.lastPosition = { x: relX, y: relY };
            
            // Inclui informação de canto nos inputs
            const cornerInput = this.cornerData.isStuck ? 1 : (isInCorner ? 0.5 : 0);
            
            // Substitui o último input (curiosidade) por cornerInput quando a bactéria está presa
            // para manter apenas 12 inputs no total
            if (this.cornerData.isStuck) {
                conditions.curiosity = cornerInput; // Substitui curiosidade por cornerInput quando presa
            }
            
            // Cria o array de inputs normalizado e adiciona as posições relativas
            // Use normalizeInputs em vez de tentar espalhar o objeto conditions
            const normalizedInputs = this.normalizeInputs(conditions);
            const positionInputs = [...normalizedInputs, relX, relY];
            
            // Obtém as saídas contínuas da rede neural
            const outputs = this.brain.predict(positionInputs);
            
            // Se os outputs não forem válidos, use valores padrão
            if (!outputs || !Array.isArray(outputs) || outputs.length < 5) {
                console.warn("Outputs inválidos da rede neural:", outputs);
                // Valores padrão para evitar erros
                return {
                    direction: random(0, TWO_PI),
                    speed: 0.5,
                    wanderStrength: 0.1,
                    noiseStrength: 0.1,
                    targetWeight: 0.5
                };
            }
            
            // Decodifica os outputs para os parâmetros de movimento
            const movementParams = {
                direction: outputs[0] * TWO_PI, // Direção entre 0 e 2π
                speed: outputs[1], // Velocidade entre 0 e 1
                wanderStrength: outputs[2], // Intensidade do wandering entre 0 e 1
                noiseStrength: outputs[3], // Intensidade do ruído entre 0 e 1
                targetWeight: outputs[4] // Peso do alvo entre 0 e 1
            };
            
            // Verifica se a bactéria está perto das bordas
            const margin = 50;
            
            // Detecção de cantos
            const isNearLeftEdge = pos.x < margin;
            const isNearRightEdge = pos.x > worldWidth - margin;
            const isNearTopEdge = pos.y < margin;
            const isNearBottomEdge = pos.y > worldHeight - margin;
            
            // Atualiza os dados de canto existentes
            this.cornerData.framesInCorner = this.cornerData.framesInCorner || 0;
            
            // Usa a variável isInCorner já definida anteriormente
            if (isInCorner) {
                // Se está em um canto, incrementa o contador
                this.cornerData.framesInCorner++;
                
                // Se está muito tempo no canto, considera preso
                if (this.cornerData.framesInCorner > 60 && !this.cornerData.isStuck) {
                    this.cornerData.isStuck = true;
                    console.log("Bactéria presa no canto por muito tempo!");
                    
                    // Pode aplicar alguma penalidade aqui, mas continua usando os parâmetros normais
                }
            } else {
                // Se saiu do canto e estava preso, considera que aprendeu a sair
                if (this.cornerData.isStuck) {
                    this.cornerData.isStuck = false;
                    
                    // Aplica reforço positivo por ter saído do canto
                    // O cérebro aprende que o comportamento que levou a sair do canto é bom
                    if (this.lastNeuralOutputs && this.lastNeuralInputs) {
                        console.log("Bactéria aprendeu a sair do canto!");
                        
                        // Verificação já implementada anteriormente
                    }
                }
                
                // Resetar contador de frames no canto
                this.cornerData.framesInCorner = 0;
            }
            
            // Treina com base na entrada atual se a bactéria não estiver presa
            if (!this.cornerData.isStuck && random() < 0.01) { // Treina ocasionalmente (1% de chance)
                try {
                    // Cria um array de targets baseado nos parâmetros de movimento atuais
                    const targetArray = [
                        movementParams.direction / TWO_PI,
                        movementParams.speed,
                        movementParams.wanderStrength,
                        movementParams.noiseStrength,
                        movementParams.targetWeight
                    ];
                    
                    // Valida o array de targets
                    if (Array.isArray(targetArray) && targetArray.length === 5) {
                        // Salva para possível uso futuro
                        this.lastNeuralInputs = positionInputs;
                        this.lastNeuralOutputs = { movementParams: targetArray };
                        
                        // Treina a rede para reforçar o comportamento atual
                        this.brain.train(positionInputs, targetArray);
                    } else {
                        console.warn("Array de targets inválido para treinamento:", targetArray);
                    }
                } catch (error) {
                    console.error("Erro durante treinamento neural ocasional:", error);
                }
            } else {
                // Se estiver presa ou não for momento de treinar, apenas salva os dados para uso futuro
                this.lastNeuralInputs = positionInputs;
                this.lastNeuralOutputs = { 
                    movementParams: [
                        movementParams.direction / TWO_PI,
                        movementParams.speed,
                        movementParams.wanderStrength,
                        movementParams.noiseStrength,
                        movementParams.targetWeight
                    ]
                };
            }
            
            return movementParams;
        } catch (error) {
            console.error("Erro na decisão neural contínua:", error);
            // Retorna valores padrão em caso de erro
            return {
                direction: random(0, TWO_PI),
                speed: 0.5,
                wanderStrength: 0.1,
                noiseStrength: 0.1,
                targetWeight: 0.5
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