/**
 * Sistema de comunicação neural entre bactérias
 * Implementa codificação e decodificação neural de mensagens
 */
class NeuralCommunication {
    /**
     * Inicializa o sistema de comunicação neural
     * @param {CommunicationSystem} communicationSystem - Sistema de comunicação principal
     */
    constructor(communicationSystem) {
        this.communicationSystem = communicationSystem;
        this.simulation = communicationSystem.simulation;
        
        // Configurações do sistema de comunicação neural
        this.vocabSize = 5;         // Tamanho do vocabulário inicial
        this.messageLength = 3;     // Comprimento máximo das mensagens
        this.stateSize = 10;        // Dimensão do vetor de estado interno
        this.rewardMemory = {};     // Armazena recompensas por bactérias
        this.useApproximation = true; // Usa aproximação para bactérias sem capacidade neural
        
        // Vocabulário inicial - tokens básicos
        this.vocabulary = {
            0: "COMIDA",    // Informação sobre comida
            1: "PERIGO",    // Aviso de perigo
            2: "AJUDA",     // Pedido de ajuda
            3: "AMIZADE",   // Proposta de cooperação
            4: "NEUTRO"     // Comentário neutro/genérico
        };
        
        // Inicializa redes neurais para codificação/decodificação
        this.initializeNetworks();
        
        console.log("Sistema de comunicação neural inicializado");
    }
    
    /**
     * Inicializa as redes neurais do sistema
     */
    initializeNetworks() {
        try {
            // Encoder: Estado interno -> Mensagem (tokens)
            this.encoder = new NeuralNetwork(
                this.stateSize,     // Input: Estado interno da bactéria
                8,                  // Hidden: 8 neurônios ocultos
                this.vocabSize      // Output: Probabilidades dos tokens
            );
            
            // Decoder: Mensagem -> Ação/Interpretação
            this.decoder = new NeuralNetwork(
                this.vocabSize,     // Input: Tokens recebidos
                8,                  // Hidden: 8 neurônios ocultos
                4                   // Output: Parâmetros de ação (direção, intensidade, etc.)
            );
            
            // Define função de ativação mais adequada
            this.encoder.setActivationFunction('tanh');
            this.decoder.setActivationFunction('sigmoid');
            
            console.log("Redes neurais de comunicação inicializadas com sucesso");
        } catch (error) {
            console.error("Erro ao inicializar redes neurais de comunicação:", error);
            
            // Cria placeholders para evitar erros
            this.encoder = { predict: (i) => Array(this.vocabSize).fill(0.2) };
            this.decoder = { predict: (i) => Array(4).fill(0.5) };
        }
    }
    
    /**
     * Extrai o vetor de estado interno da bactéria para codificação
     * @param {Object} bacteria - A bactéria da qual extrair o estado
     * @returns {Array} - Vetor de estado normalizado
     */
    extractStateVector(bacteria) {
        // Verifica se a bactéria é válida
        if (!bacteria) {
            console.warn('NeuralCommunication: Tentativa de extrair estado de bactéria inválida');
            return Array(this.stateSize).fill(0.5); // Valores médios como padrão
        }
        
        // Define valores padrão para todos os estados possíveis
        const defaultState = {
            health: 0.5,
            energy: 0.5, 
            age: 0.5,
            generation: 0.5,
            size: 0.5,
            speed: 0.5,
            sociability: 0.5,
            aggressiveness: 0.5,
            curiosity: 0.5,
            posX: 0.5,
            posY: 0.5
        };
        
        try {
            // Extrai valores básicos com validação
            let health = 0.5;
            if (bacteria.health != null && typeof bacteria.health.current === 'number' && 
                typeof bacteria.health.max === 'number' && bacteria.health.max > 0) {
                health = Math.max(0, Math.min(1, bacteria.health.current / bacteria.health.max));
                if (isNaN(health)) health = defaultState.health;
            }
            
            let energy = 0.5;
            if (bacteria.energy != null && typeof bacteria.energy.current === 'number' && 
                typeof bacteria.energy.max === 'number' && bacteria.energy.max > 0) {
                energy = Math.max(0, Math.min(1, bacteria.energy.current / bacteria.energy.max));
                if (isNaN(energy)) energy = defaultState.energy;
            }
            
            let age = 0.5;
            if (bacteria.age != null && typeof bacteria.age === 'number' &&
                typeof bacteria.lifespan === 'number' && bacteria.lifespan > 0) {
                age = Math.max(0, Math.min(1, bacteria.age / bacteria.lifespan));
                if (isNaN(age)) age = defaultState.age;
            } else if (bacteria.age != null && typeof bacteria.age === 'number') {
                // Normaliza com base em uma idade máxima típica (3000 frames ≈ 1 minuto)
                age = Math.max(0, Math.min(1, bacteria.age / 3000));
                if (isNaN(age)) age = defaultState.age;
            }
            
            let generation = 0.5;
            if (bacteria.generation != null && typeof bacteria.generation === 'number') {
                // Normaliza com base em uma geração máxima típica (30)
                generation = Math.max(0, Math.min(1, bacteria.generation / 30));
                if (isNaN(generation)) generation = defaultState.generation;
            }
            
            // Extrai informações genéticas se disponíveis
            let sociability = 0.5;
            let aggressiveness = 0.5;
            let curiosity = 0.5;
            
            if (bacteria.dna) {
                try {
                    if (typeof bacteria.dna.getGeneValue === 'function') {
                        // Método preferido para acessar genes
                        sociability = bacteria.dna.getGeneValue('sociability', 0.5);
                        aggressiveness = bacteria.dna.getGeneValue('aggressiveness', 0.5);
                        curiosity = bacteria.dna.getGeneValue('curiosity', 0.5);
                        
                        // Verificação adicional para NaN
                        if (isNaN(sociability)) sociability = defaultState.sociability;
                        if (isNaN(aggressiveness)) aggressiveness = defaultState.aggressiveness;
                        if (isNaN(curiosity)) curiosity = defaultState.curiosity;
                    } else if (bacteria.dna.genes) {
                        // Alternativa se os genes estão disponíveis diretamente
                        sociability = bacteria.dna.genes.sociability != null ? 
                            Math.max(0, Math.min(1, bacteria.dna.genes.sociability)) : defaultState.sociability;
                        aggressiveness = bacteria.dna.genes.aggressiveness != null ? 
                            Math.max(0, Math.min(1, bacteria.dna.genes.aggressiveness)) : defaultState.aggressiveness;
                        curiosity = bacteria.dna.genes.curiosity != null ? 
                            Math.max(0, Math.min(1, bacteria.dna.genes.curiosity)) : defaultState.curiosity;
                        
                        // Verificação adicional para NaN
                        if (isNaN(sociability)) sociability = defaultState.sociability;
                        if (isNaN(aggressiveness)) aggressiveness = defaultState.aggressiveness;
                        if (isNaN(curiosity)) curiosity = defaultState.curiosity;
                    }
                } catch (geneError) {
                    console.warn('NeuralCommunication: Erro ao acessar genes:', geneError);
                    // Usa valores padrão se houver erro
                }
            }
            
            // Extrai o estado atual da bactéria
            let currentState = 'normal';
            try {
                if (bacteria.state && bacteria.state.current) {
                    currentState = bacteria.state.current;
                } else if (bacteria.state && bacteria.state.seeking) {
                    currentState = 'seeking_' + bacteria.state.seeking;
                } else if (bacteria.stateManager && bacteria.stateManager.getCurrentState) {
                    currentState = bacteria.stateManager.getCurrentState();
                }
            } catch (stateError) {
                console.warn('NeuralCommunication: Erro ao extrair estado atual:', stateError);
            }
            
            // Codifica o estado atual em um valor
            let stateValue = 0.5;
            switch (currentState) {
                case 'seekingFood':
                case 'seeking_food':
                    stateValue = 0.25;
                    break;
                case 'seekingMate':
                case 'seeking_mate':
                    stateValue = 0.75;
                    break;
                case 'fleeing':
                    stateValue = 0.1;
                    break;
                case 'idle':
                    stateValue = 0.9;
                    break;
                default:
                    stateValue = 0.5; // Estado normal/desconhecido
            }
            
            // Extrai posição relativa no mundo, se disponível
            let posX = 0.5;
            let posY = 0.5;
            
            try {
                if (bacteria.pos && typeof bacteria.pos.x === 'number' && typeof bacteria.pos.y === 'number' && 
                    window.width > 0 && window.height > 0) {
                    posX = Math.max(0, Math.min(1, bacteria.pos.x / window.width));
                    posY = Math.max(0, Math.min(1, bacteria.pos.y / window.height));
                    
                    if (isNaN(posX)) posX = defaultState.posX;
                    if (isNaN(posY)) posY = defaultState.posY;
                }
            } catch (posError) {
                console.warn('NeuralCommunication: Erro ao extrair posição:', posError);
            }
            
            // Constrói o vetor de estado final
            const stateVector = [
                health,
                energy,
                age,
                generation,
                sociability,
                aggressiveness,
                curiosity,
                stateValue,
                posX,
                posY
            ];
            
            // Garante que não há valores NaN no vetor
            const cleanVector = stateVector.map((value, index) => {
                if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                    console.warn(`NeuralCommunication: Valor inválido no índice ${index} do vetor de estado`);
                    return 0.5; // Valor padrão para substituir NaN
                }
                return value;
            });
            
            // Garante que o vetor tem o tamanho correto
            while (cleanVector.length < this.stateSize) {
                cleanVector.push(0.5);
            }
            
            // Trunca o vetor se for maior que o tamanho esperado
            const finalVector = cleanVector.slice(0, this.stateSize);
            
            // Log para debug (muito baixa frequência)
            if (Math.random() < 0.005) { // 0.5% das extrações
                console.log("ExtractState:", 
                    "health:", health.toFixed(2),
                    "energy:", energy.toFixed(2),
                    "age:", age.toFixed(2),
                    "state:", currentState);
            }
            
            return finalVector;
        } catch (error) {
            console.error('NeuralCommunication: Erro crítico ao extrair estado da bactéria:', error);
            // Retorna um vetor com valores padrão em caso de erro
            return Array(this.stateSize).fill(0.5);
        }
    }
    
    /**
     * Codifica o estado interno da bactéria em uma mensagem
     * @param {Object} bacteria - A bactéria que está enviando a mensagem
     * @returns {Array} - Mensagem codificada com distribuição de probabilidades de tokens
     */
    encodeMessage(bacteria) {
        // Verifica se a bactéria é válida
        if (!bacteria) {
            console.warn('NeuralCommunication: Tentativa de codificar mensagem com bactéria inválida');
            return this.getDefaultMessage();
        }
        
        try {
            // Extrai o vetor de estado interno da bactéria
            const stateVector = this.extractStateVector(bacteria);
            
            // Verifica se o vetor de estado é válido
            if (!stateVector || !Array.isArray(stateVector) || stateVector.some(val => isNaN(val))) {
                console.warn('NeuralCommunication: Vetor de estado inválido extraído da bactéria:', stateVector);
                return this.getDefaultMessage();
            }
            
            // Garante que o tamanho do vetor de estado corresponde ao esperado
            if (stateVector.length !== this.stateSize) {
                console.warn(`NeuralCommunication: Tamanho do vetor de estado incorreto. Esperado ${this.stateSize}, recebido ${stateVector.length}`);
                
                // Adapta o tamanho do vetor para corresponder ao esperado
                let adjustedState = [...stateVector];
                if (stateVector.length < this.stateSize) {
                    adjustedState = [...stateVector, ...Array(this.stateSize - stateVector.length).fill(0.5)];
                } else {
                    adjustedState = stateVector.slice(0, this.stateSize);
                }
                
                // Substitui o vetor de estado original pelo ajustado
                stateVector = adjustedState;
            }
            
            // Usa o encoder para gerar as probabilidades dos tokens
            const encoder = this.encoder;
            if (!encoder) {
                console.warn('NeuralCommunication: Encoder não disponível para codificação');
                return this.getDefaultMessage();
            }
            
            // Gera os tokens com verificação de erros
            let tokenProbabilities;
            try {
                tokenProbabilities = encoder.predict(stateVector);
            } catch (encoderError) {
                console.error('NeuralCommunication: Erro ao codificar estado com a rede neural:', encoderError);
                return this.getDefaultMessage();
            }
            
            // Verifica se as probabilidades geradas são válidas
            if (!tokenProbabilities || !Array.isArray(tokenProbabilities) || 
                tokenProbabilities.length !== this.vocabSize || 
                tokenProbabilities.some(prob => isNaN(prob))) {
                console.warn('NeuralCommunication: Probabilidades de tokens inválidas geradas:', tokenProbabilities);
                return this.getDefaultMessage();
            }
            
            // Normaliza as probabilidades para que somem 1
            const sum = tokenProbabilities.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
            let normalizedProbabilities;
            
            if (sum > 0) {
                normalizedProbabilities = tokenProbabilities.map(prob => 
                    isNaN(prob) ? (1/this.vocabSize) : (prob / sum)
                );
            } else {
                // Se a soma for zero ou negativa, use uma distribuição uniforme
                normalizedProbabilities = this.getDefaultMessage();
            }
            
            // Log para debug (baixa frequência)
            if (Math.random() < 0.01) { // 1% das codificações
                console.log("EncodeMessage: state =", stateVector.map(s => s.toFixed(2)).join(', '));
                console.log("EncodeMessage: message =", normalizedProbabilities.map(p => p.toFixed(2)).join(', '));
            }
            
            return normalizedProbabilities;
        } catch (error) {
            console.error('NeuralCommunication: Erro crítico na codificação da mensagem:', error);
            return this.getDefaultMessage();
        }
    }
    
    /**
     * Retorna uma mensagem padrão com distribuição uniforme para casos de erro
     * @returns {Array} - Mensagem padrão com valores uniformemente distribuídos
     */
    getDefaultMessage() {
        // Cria uma mensagem com distribuição uniforme
        return Array(this.vocabSize).fill(1/this.vocabSize);
    }
    
    /**
     * Decodifica a mensagem de comunicação em um conjunto de parâmetros de ação
     * @param {Object} bacteria - A bactéria que recebeu a mensagem
     * @param {Array} message - Array representando a mensagem codificada
     * @returns {Object} - Parâmetros da ação
     */
    decodeMessage(bacteria, message) {
        // Verifica se a mensagem é válida
        if (!message || !Array.isArray(message)) {
            console.warn('NeuralCommunication: Mensagem inválida para decodificação:', message);
            return this.getDefaultActionParams();
        }
        
        try {
            // Verifica se o tamanho da mensagem corresponde ao vocabulário esperado
            if (message.length !== this.vocabSize) {
                console.warn(`NeuralCommunication: Tamanho da mensagem inválido. Esperado ${this.vocabSize}, recebido ${message.length}`);
                
                // Cria uma nova mensagem do tamanho correto
                const validMessage = this.getDefaultMessage();
                
                // Se a mensagem original tem alguns valores, tenta aproveitá-los
                if (message.length > 0) {
                    const minSize = Math.min(this.vocabSize, message.length);
                    for (let i = 0; i < minSize; i++) {
                        if (!isNaN(message[i]) && isFinite(message[i])) {
                            validMessage[i] = message[i];
                        }
                    }
                }
                
                message = validMessage;
            }
            
            // Aplica a mensagem ao decoder para obter parâmetros de ação
            const decoder = this.decoder;
            if (!decoder) {
                console.warn('NeuralCommunication: Decoder não disponível para decodificação');
                return this.getDefaultActionParams();
            }
            
            // Validação adicional para cada valor da mensagem
            const validatedMessage = message.map(val => {
                if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
                    return 1/this.vocabSize; // Valor padrão uniformemente distribuído
                }
                return val;
            });
            
            // Decodifica a mensagem usando a rede neural
            const outputs = decoder.predict(validatedMessage);
            
            // Verifica se os outputs são válidos
            if (!outputs || !Array.isArray(outputs) || outputs.length < 4) {
                console.warn('NeuralCommunication: Outputs inválidos do decoder:', outputs);
                return this.getDefaultActionParams();
            }
            
            // Extrai os parâmetros da ação dos outputs da rede
            // Índices esperados: 0=direção, 1=magnitude, 2=duração, 3+=tipo de ação
            let actionParams = {
                direction: outputs[0] * Math.PI * 2, // Converte para radianos (0-2π)
                magnitude: Math.max(0, Math.min(1, outputs[1])), // Entre 0 e 1
                duration: Math.max(1, Math.floor(outputs[2] * 10)) * 30, // Converte para frames (30-300)
                type: this.interpretActionType(outputs[3]) // Tipo de ação
            };
            
            // Verificação final para garantir que não há NaN
            if (isNaN(actionParams.direction)) {
                console.warn('NeuralCommunication: Direção NaN detectada na decodificação');
                actionParams.direction = Math.random() * Math.PI * 2;
            }
            
            if (isNaN(actionParams.magnitude) || actionParams.magnitude < 0) {
                console.warn('NeuralCommunication: Magnitude inválida detectada na decodificação');
                actionParams.magnitude = 0.5;
            }
            
            if (isNaN(actionParams.duration) || actionParams.duration < 30) {
                console.warn('NeuralCommunication: Duração inválida detectada na decodificação');
                actionParams.duration = 90; // 3 segundos em 30fps
            }
            
            // Valida e ajusta o tipo de ação
            if (!actionParams.type || typeof actionParams.type !== 'string') {
                console.warn('NeuralCommunication: Tipo de ação inválido detectado na decodificação');
                actionParams.type = 'explore'; // Tipo padrão
            }
            
            // Log para debug (baixa frequência)
            if (Math.random() < 0.01) { // 1% das decodificações
                console.log("DecodeMessage: action =", 
                    actionParams.type, 
                    "dir:", (actionParams.direction / Math.PI).toFixed(2) + "π", 
                    "mag:", actionParams.magnitude.toFixed(2), 
                    "dur:", Math.round(actionParams.duration/30) + "s");
            }
            
            return actionParams;
        } catch (error) {
            console.error('Erro na decodificação da mensagem:', error);
            return this.getDefaultActionParams();
        }
    }
    
    /**
     * Retorna parâmetros de ação padrão para casos de erro
     * @returns {Object} - Parâmetros padrão
     */
    getDefaultActionParams() {
        return {
            direction: Math.random() * Math.PI * 2, // Direção aleatória
            magnitude: 0.5, // Magnitude média
            duration: 90, // 3 segundos em 30fps
            type: this.interpretActionType(this.getDefaultMessage().slice(3)) // Primeiro tipo de ação
        };
    }
    
    /**
     * Interpreta o tipo de ação com base no valor
     * @param {number} value - Valor do parâmetro de tipo
     * @returns {string} - Tipo de ação
     */
    interpretActionType(value) {
        if (value < 0.25) return 'explore';
        if (value < 0.5) return 'seekFood';
        if (value < 0.75) return 'rest';
        return 'seekMate';
    }
    
    /**
     * Aplica a ação interpretada à bactéria
     * @param {Object} bacteria - A bactéria que receberá a ação
     * @param {Object} actionParams - Parâmetros da ação a ser aplicada
     * @returns {boolean} - Indica se a ação foi aplicada com sucesso
     */
    applyAction(bacteria, actionParams) {
        // Verifica se a bactéria é válida
        if (!bacteria || !bacteria.movement) {
            console.warn('NeuralCommunication: Tentativa de aplicar ação em bactéria inválida');
            return false;
        }
        
        try {
            // Usa parâmetros padrão se os fornecidos forem inválidos
            let params = actionParams;
            if (!params || typeof params !== 'object') {
                console.warn('NeuralCommunication: Parâmetros de ação inválidos:', actionParams);
                params = this.getDefaultActionParams();
            }
            
            // Normaliza os parâmetros para garantir valores válidos
            let direction = typeof params.direction === 'number' && !isNaN(params.direction) 
                ? params.direction 
                : Math.random() * Math.PI * 2;
                
            let magnitude = typeof params.magnitude === 'number' && !isNaN(params.magnitude) 
                ? Math.max(0, Math.min(1, params.magnitude)) 
                : 0.5;
                
            let duration = typeof params.duration === 'number' && !isNaN(params.duration) 
                ? Math.max(30, Math.min(300, params.duration)) 
                : 90;
                
            let type = params.type && typeof params.type === 'string' 
                ? params.type 
                : 'explore';
            
            // Cria um vetor de força com a direção e magnitude especificadas
            let force;
            try {
                // Usa p5.Vector se disponível, caso contrário cria um objeto simples
                if (typeof createVector === 'function') {
                    force = createVector(
                        Math.cos(direction) * magnitude,
                        Math.sin(direction) * magnitude
                    );
                } else {
                    force = {
                        x: Math.cos(direction) * magnitude,
                        y: Math.sin(direction) * magnitude
                    };
                }
            } catch (vectorError) {
                console.warn('NeuralCommunication: Erro ao criar vetor de força:', vectorError);
                // Cria um vetor simples como fallback
                force = {
                    x: Math.cos(direction) * magnitude,
                    y: Math.sin(direction) * magnitude
                };
            }
            
            // Aplica a força à bactéria conforme o tipo de ação
            try {
                if (bacteria.movement && typeof bacteria.movement.applyForce === 'function') {
                    bacteria.movement.applyForce(force);
                } else if (bacteria.applyForce) {
                    bacteria.applyForce(force);
                } else {
                    console.warn('NeuralCommunication: Bactéria não possui método applyForce válido');
                    return false;
                }
            } catch (forceError) {
                console.error('NeuralCommunication: Erro ao aplicar força à bactéria:', forceError);
                return false;
            }
            
            // Atualiza o estado da bactéria conforme o tipo de ação
            try {
                if (type === 'seekFood' && bacteria.state) {
                    bacteria.state.seeking = 'food';
                } else if (type === 'seekMate' && bacteria.state) {
                    bacteria.state.seeking = 'mate';
                } else if (type === 'flee' && bacteria.state) {
                    bacteria.state.fleeing = true;
                }
            } catch (stateError) {
                console.warn('NeuralCommunication: Erro ao atualizar estado da bactéria:', stateError);
                // Continua a execução, pois a força já foi aplicada
            }
            
            // Log para debug (baixa frequência)
            if (Math.random() < 0.01) { // 1% das ações aplicadas
                console.log("ApplyAction:", 
                    bacteria.id,
                    "type:", type,
                    "dir:", (direction / Math.PI).toFixed(2) + "π", 
                    "mag:", magnitude.toFixed(2), 
                    "dur:", Math.round(duration/30) + "s");
            }
            
            return true;
        } catch (error) {
            console.error('NeuralCommunication: Erro crítico ao aplicar ação:', error);
            return false;
        }
    }
    
    /**
     * Avalia o resultado de uma ação e fornece recompensa
     * @param {Bacteria} bacteria - Bactéria que recebeu a mensagem
     */
    evaluateActionResult(bacteria) {
        if (!bacteria || !bacteria.lastCommunicationAction) return;
        
        try {
            const action = bacteria.lastCommunicationAction;
            const timePassed = frameCount - action.time;
            
            // Só avalia após passar tempo suficiente
            if (timePassed < action.params.duration) return;
            
            let reward = 0;
            
            // Avalia com base no tipo de ação
            switch (action.params.type) {
                case 'seekFood':
                    // Verifica se encontrou comida
                    const foundFood = bacteria.foodEaten && 
                                     (bacteria.foodEaten > (bacteria.lastFoodEaten || 0));
                    if (foundFood) {
                        reward = 1.0; // Recompensa alta para comida encontrada
                        bacteria.lastFoodEaten = bacteria.foodEaten;
                    } else {
                        reward = -0.2; // Pequena penalização por não encontrar
                    }
                    break;
                    
                case 'explore':
                    // Recompensa exploração se tiver se movido suficientemente
                    const distance = bacteria.pos.dist(action.initialPosition);
                    reward = map(distance, 0, 100, 0, 0.5); // Maior distância, maior recompensa
                    break;
                    
                case 'rest':
                    // Recompensa descanso se energia aumentou
                    const currentEnergy = this.getBacteriaEnergy(bacteria);
                    const energyGain = currentEnergy - (bacteria.lastEnergy || 0);
                    bacteria.lastEnergy = currentEnergy;
                    reward = energyGain > 0 ? 0.5 : -0.1;
                    break;
                    
                case 'seekMate':
                    // Recompensa se conseguiu reproduzir
                    if (bacteria.reproduction && bacteria.reproduction.offspringCount > 
                        (bacteria.lastOffspringCount || 0)) {
                        reward = 1.0;
                        bacteria.lastOffspringCount = bacteria.reproduction.offspringCount;
                    } else {
                        reward = -0.3;
                    }
                    break;
            }
            
            // Armazena a recompensa
            if (!this.rewardMemory[bacteria.id]) {
                this.rewardMemory[bacteria.id] = [];
            }
            
            this.rewardMemory[bacteria.id].push({
                reward: reward,
                time: frameCount
            });
            
            // Limpa a referência da ação
            bacteria.lastCommunicationAction = null;
            
            // Retorna recompensa para uso potencial
            return reward;
        } catch (error) {
            console.error(`Erro ao avaliar resultado da ação para bactéria ${bacteria.id}:`, error);
            return 0;
        }
    }
    
    /**
     * Obtém energia da bactéria com segurança
     * @param {Bacteria} bacteria - Bactéria
     * @returns {number} - Energia atual
     */
    getBacteriaEnergy(bacteria) {
        if (!bacteria) return 50;
        
        try {
            if (bacteria.stateManager && typeof bacteria.stateManager.getEnergy === 'function') {
                return bacteria.stateManager.getEnergy();
            } else if (bacteria.states && typeof bacteria.states.getEnergy === 'function') {
                return bacteria.states.getEnergy();
            } else if (typeof bacteria.energy === 'number') {
                return bacteria.energy;
            }
            return 50; // Valor padrão
        } catch (error) {
            return 50;
        }
    }
    
    /**
     * Treina as redes neurais com base nas recompensas recebidas
     */
    trainNetworks() {
        try {
            // Coleta experiências positivas para treinamento
            let positiveExperiences = [];
            
            // Processa recompensas por bactéria
            for (const bacteriaId in this.rewardMemory) {
                const rewards = this.rewardMemory[bacteriaId];
                
                // Ignora bactérias sem recompensas suficientes
                if (!rewards || rewards.length < 5) continue;
                
                // Calcula média de recompensas
                const avgReward = rewards.reduce((sum, r) => sum + r.reward, 0) / rewards.length;
                
                // Se a média for positiva, considera uma experiência positiva
                if (avgReward > 0.2) {
                    positiveExperiences.push({
                        bacteriaId: bacteriaId,
                        reward: avgReward
                    });
                }
                
                // Limpa recompensas antigas
                this.rewardMemory[bacteriaId] = rewards.filter(r => 
                    frameCount - r.time < 300 // Mantém apenas últimos 300 frames
                );
            }
            
            // Se há experiências positivas suficientes, treina as redes
            if (positiveExperiences.length >= 3) {
                console.log(`Treinando redes com ${positiveExperiences.length} experiências positivas`);
                
                // Treina encoder/decoder com ajustes pequenos
                // Este é um treinamento simplificado, um sistema real usaria
                // reinforcement learning mais sofisticado
                this.encoder.learningRate = 0.05;
                this.decoder.learningRate = 0.05;
                
                // Aprende com base nas experiências positivas
                this.encoder.learn();
                this.decoder.learn();
                
                console.log("Redes neurais de comunicação treinadas com sucesso");
            }
        } catch (error) {
            console.error("Erro ao treinar redes neurais de comunicação:", error);
        }
    }
    
    /**
     * Processa comunicação neural entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia a mensagem
     * @param {Bacteria} receiver - Bactéria que recebe a mensagem
     * @returns {String} - Resultado da comunicação
     */
    processCommunication(sender, receiver) {
        // Verifica se ambas bactérias são válidas
        if (!sender || !receiver) {
            console.warn('NeuralCommunication: Tentativa de processar comunicação com bactérias inválidas');
            return null;
        }
        
        try {
            // Log para debug (baixa frequência)
            if (Math.random() < 0.005) { // 0.5% das comunicações
                console.log(`ProcessCommunication: ${sender.id} → ${receiver.id}`);
            }
            
            // Codifica o estado do emissor em uma mensagem
            const message = this.encodeMessage(sender);
            
            // Verifica se a mensagem é válida
            if (!message || !Array.isArray(message) || message.length !== this.vocabSize) {
                console.warn('NeuralCommunication: Mensagem inválida gerada para comunicação:', message);
                return null;
            }
            
            // Encontra o token dominante na mensagem para classificação
            let maxTokenIndex = 0;
            let maxTokenValue = message[0] || 0;
            
            for (let i = 1; i < message.length; i++) {
                if (!isNaN(message[i]) && message[i] > maxTokenValue) {
                    maxTokenValue = message[i];
                    maxTokenIndex = i;
                }
            }
            
            // Verifica se o índice do token dominante é válido
            if (maxTokenIndex >= message.length || isNaN(maxTokenIndex)) {
                console.warn('NeuralCommunication: Índice de token dominante inválido:', maxTokenIndex);
                maxTokenIndex = Math.floor(Math.random() * message.length); // Fallback para índice aleatório
            }
            
            // Decodifica a mensagem para obter os parâmetros da ação
            const actionParams = this.decodeMessage(receiver, message);
            
            // Verifica se os parâmetros da ação são válidos
            if (!actionParams || typeof actionParams !== 'object') {
                console.warn('NeuralCommunication: Parâmetros de ação inválidos:', actionParams);
                return null;
            }
            
            // Aplica a ação à bactéria receptora
            const actionApplied = this.applyAction(receiver, actionParams);
            
            // Programa a avaliação do resultado da ação
            if (actionApplied && typeof actionParams.duration === 'number') {
                // Garante que a duração está dentro de limites razoáveis
                const duration = Math.max(30, Math.min(300, actionParams.duration));
                
                // Programa avaliação futura (não implementado neste snippet)
                // this.scheduleEvaluation(sender, receiver, actionParams, duration);
            }
            
            // Log para debug (baixa frequência)
            if (Math.random() < 0.01) { // 1% das comunicações
                console.log(`Communication: ${sender.id} → ${receiver.id}: ${actionParams.type} (${maxTokenIndex})`);
            }
            
            // Retorna o tipo da mensagem para o sistema de comunicação
            return `NEURAL:${maxTokenIndex}`;
        } catch (error) {
            console.error('NeuralCommunication: Erro crítico no processamento da comunicação:', error);
            return "ERRO"; // Indica erro no processamento
        }
    }
    
    /**
     * Atualiza o sistema de comunicação neural
     */
    update() {
        // A cada 300 frames (aproximadamente 5 segundos), treina as redes
        if (frameCount % 300 === 0) {
            this.trainNetworks();
        }
    }

    /**
     * Verifica se uma bactéria pode usar comunicação neural
     * @param {Object} bacteria - A bactéria para verificar
     * @returns {Boolean} - True se a bactéria pode usar comunicação neural
     */
    canUseNeuralCommunication(bacteria) {
        // Se não tivermos a forçarmos comunicação neural, verificamos se a bactéria tem o gene necessário
        if (!this.forceNeuralCommunication) {
            // Verifica se a bactéria existe e tem DNA
            if (!bacteria || !bacteria.dna) {
                return false;
            }

            // Verifica se o DNA tem o método hasGene
            if (typeof bacteria.dna.hasGene !== 'function') {
                console.warn("DNA da bactéria não possui método hasGene:", bacteria.id);
                
                // Tenta verificar se existe o gene como propriedade ou em um array de genes
                if (bacteria.dna.genes && bacteria.dna.genes.neural_communication) {
                    return true;
                }
                
                return false;
            }
            
            // Verifica se a bactéria tem o gene para comunicação neural
            return bacteria.dna.hasGene('neural_communication');
        }

        // Se forçarmos comunicação neural, todas as bactérias podem usar
        return true;
    }
}

// Torna a classe disponível globalmente
window.NeuralCommunication = NeuralCommunication; 