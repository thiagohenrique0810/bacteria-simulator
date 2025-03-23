/**
 * Gerencia os estados e energia da bactéria
 */
class BacteriaStateManager {
    constructor() {
        this.energy = 100;
        this.currentState = window.BacteriaStates.EXPLORING;
    }

    /**
     * Obtém o estado atual
     * @returns {string} Estado atual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Define o estado atual
     * @param {string} state - Novo estado
     */
    setCurrentState(state) {
        this.currentState = state;
    }

    /**
     * Obtém o nível de energia atual
     * @returns {number} Nível de energia
     */
    getEnergy() {
        return this.energy;
    }

    /**
     * Adiciona energia
     * @param {number} amount - Quantidade de energia a adicionar
     */
    addEnergy(amount) {
        this.energy += amount;
        this.normalizeEnergy();
    }

    /**
     * Remove energia
     * @param {number} amount - Quantidade de energia a remover
     */
    removeEnergy(amount) {
        this.energy -= amount;
        this.normalizeEnergy();
    }

    /**
     * Normaliza o nível de energia entre 0 e 100
     */
    normalizeEnergy() {
        this.energy = constrain(this.energy, 0, 100);
    }

    /**
     * Atualiza o estado baseado nas condições do ambiente
     * @param {Object} conditions - Condições do ambiente
     * @returns {Object} - Ações baseadas no estado atual
     */
    update(conditions) {
        // Assegura que conditions seja um objeto válido
        conditions = conditions || {};
        
        // Atualiza o estado com base nas condições
        if (conditions.forcedState) {
            // Se uma ação forçada foi especificada, use-a para determinar o estado
            switch (conditions.forcedState) {
                case 'seekFood':
                    this.currentState = window.BacteriaStates.SEARCHING_FOOD;
                    break;
                case 'seekMate':
                    this.currentState = window.BacteriaStates.SEARCHING_MATE;
                    break;
                case 'rest':
                    this.currentState = window.BacteriaStates.RESTING;
                    break;
                case 'explore':
                default:
                    this.currentState = window.BacteriaStates.EXPLORING;
                    break;
            }
        } else {
            // Lógica de transição baseada nas condições do ambiente
            if (conditions.predatorNearby) {
                this.currentState = window.BacteriaStates.FLEEING;
            } else if (this.energy < 30) {
                this.currentState = window.BacteriaStates.RESTING;
            } else if (this.energy < 60 && conditions.foodNearby) {
                this.currentState = window.BacteriaStates.SEARCHING_FOOD;
            } else if (this.energy > 70 && conditions.mateNearby) {
                this.currentState = window.BacteriaStates.SEARCHING_MATE;
            } else if (this.energy < 50) {
                this.currentState = window.BacteriaStates.SEARCHING_FOOD;
            } else {
                this.currentState = window.BacteriaStates.EXPLORING;
            }
        }
        
        // Retorna ações baseadas no estado atual
        return this.getActionsForState();
    }
    
    /**
     * Retorna as ações recomendadas para o estado atual
     * @returns {Object} - Ações recomendadas
     */
    getActionsForState() {
        const actions = {
            state: this.currentState,
            energy: this.energy,
            shouldMove: true,
            targetType: null,
            speedMultiplier: 1
        };

        switch (this.currentState) {
            case window.BacteriaStates.EXPLORING:
                actions.speedMultiplier = 0.8;
                actions.targetType = 'random';
                break;

            case window.BacteriaStates.SEARCHING_FOOD:
                actions.speedMultiplier = 1;
                actions.targetType = 'food';
                break;

            case window.BacteriaStates.FLEEING:
                actions.speedMultiplier = 1.5;
                actions.targetType = 'escape';
                break;

            case window.BacteriaStates.SEARCHING_MATE:
                actions.speedMultiplier = 0.6;
                actions.targetType = 'mate';
                break;

            case window.BacteriaStates.RESTING:
                actions.shouldMove = false;
                actions.speedMultiplier = 0;
                break;
        }

        return actions;
    }

    /**
     * Calcula recompensa baseada no estado atual
     * @param {Object} conditions - Condições do ambiente
     * @returns {number} Valor da recompensa
     */
    calculateStateReward(conditions) {
        let reward = 0;

        switch (this.currentState) {
            case window.BacteriaStates.SEARCHING_FOOD:
                reward += conditions.foodNearby ? 1 : -0.5;
                break;
            case window.BacteriaStates.SEARCHING_MATE:
                reward += conditions.mateNearby ? 1 : -0.5;
                break;
            case window.BacteriaStates.RESTING:
                reward += this.energy < 50 ? 0.5 : -0.2;
                break;
            case window.BacteriaStates.FLEEING:
                reward += conditions.predatorNearby ? 1 : -1;
                break;
        }

        return reward;
    }
}

/**
 * Classe principal que representa uma bactéria
 */
class Bacteria {
    /**
     * Cria uma nova bactéria
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {Object} parentDNA - DNA dos pais (opcional)
     * @param {number} energy - Energia inicial
     */
    constructor(x, y, parentDNA = null, energy = 100) {
        // Posição e tamanho
        this.pos = createVector(x, y);
        this.size = 20;

        // Inicializa DNA primeiro para ter acesso ao tempo de vida
        this.dna = new DNA(parentDNA);

        // Atributos básicos
        this.health = energy;
        this.energy = energy;
        this.age = 0;
        this.lifespan = this.dna.baseLifespan;
        this.lastMealTime = frameCount;
        
        // Valores padrão para os atributos
        let defaultHealthLossRate = 0.05;
        let defaultStarvationTime = 30 * 60 * 60; // 30 minutos em frames
        
        try {
            // Tenta acessar os controles de forma segura
            if (window.simulation && 
                window.simulation.controls && 
                typeof window.simulation.controls.healthLossSlider?.value === 'function') {
                defaultHealthLossRate = window.simulation.controls.healthLossSlider.value();
            }
            
            if (window.simulation && 
                window.simulation.controls && 
                typeof window.simulation.controls.feedingIntervalSlider?.value === 'function') {
                defaultStarvationTime = window.simulation.controls.feedingIntervalSlider.value() * 60 * 60;
            }
        } catch (e) {
            console.log("Usando valores padrão para healthLossRate e starvationTime", e);
        }
        
        this.healthLossRate = defaultHealthLossRate;
        this.starvationTime = defaultStarvationTime;
        this.isFemale = random() > 0.5;
        
        // Referência à simulação para acessar sistemas
        this.simulation = null;

        // Atributos relacionados a doenças
        this.isInfected = false;              // Indica se está infectada
        this.activeDiseases = new Set();      // Conjunto de doenças ativas
        this.immuneMemory = new Set();        // Memória de doenças para as quais já tem imunidade
        this.canReproduce = true;             // Flag que pode ser alterada por doenças
        this.id = Date.now() + Math.floor(random(0, 1000)); // ID único

        // Estado atual
        this.state = window.BacteriaStates.EXPLORING;

        // Inicializa sistemas
        this.movement = new Movement(this.pos.copy(), this.size);
        this.states = new BacteriaStateManager(); // Sistema de estados
        this.reproduction = new Reproduction(this.isFemale);
        this.reproduction.setDNA(this.dna);
        this.visualization = new BacteriaVisualization({
            size: this.size,
            isFemale: this.isFemale
        });

        // Raio de percepção
        this.perceptionRadius = 150;

        // Sistema de aprendizado
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
        
        // Atributos de comunicação
        this.communicationId = null;    // ID único para comunicação
        this.lastCommunication = 0;     // Último frame em que se comunicou
        this.communicationCooldown = 60;  // Frames de espera entre comunicações
        this.friendships = new Map();     // Mapa de amizades
        this.enemies = new Map();         // Mapa de inimizades
        this.communityRole = this.determineCommunityRole(); // Papel na comunidade
    }
    
    /**
     * Determina o papel da bactéria na comunidade baseado em seus genes
     * @returns {string} - Papel na comunidade
     */
    determineCommunityRole() {
        const roles = [
            { name: 'explorador', threshold: 0.7, gene: 'curiosity' },
            { name: 'protetor', threshold: 0.7, gene: 'aggressiveness' },
            { name: 'comunicador', threshold: 0.7, gene: 'sociability' },
            { name: 'reprodutor', threshold: 0.7, gene: 'fertility' },
            { name: 'sobrevivente', threshold: 0.7, gene: 'immunity' }
        ];
        
        for (const role of roles) {
            if (this.dna.genes[role.gene] >= role.threshold) {
                return role.name;
            }
        }
        
        return 'comum'; // Papel padrão
    }

    /**
     * Normaliza os inputs para a rede neural
     * @param {Object} conditions - Condições do ambiente
     * @returns {Array} - Array normalizado de inputs
     */
    normalizeInputs(conditions) {
        // Garante que conditions seja um objeto válido
        conditions = conditions || {};
        
        return [
            this.health / 100, // Saúde normalizada
            this.states.getEnergy() / 100, // Energia normalizada
            conditions.foodNearby ? 1 : 0, // Comida próxima
            conditions.mateNearby ? 1 : 0, // Parceiro próximo
            conditions.predatorNearby ? 1 : 0, // Predador próximo
            conditions.friendsNearby ? 1 : 0, // Amigos próximos
            conditions.enemiesNearby ? 1 : 0, // Inimigos próximos
            this.age / this.lifespan, // Idade normalizada
            this.dna.genes.aggressiveness, // Agressividade
            this.dna.genes.sociability // Sociabilidade
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
     * Faz a bactéria se mover em uma direção aleatória
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveRandom(deltaTime) {
        deltaTime = deltaTime || 1;
        
        // Chance de mudar de direção (10% por segundo)
        if (random() < 0.01 * deltaTime * 60) {
            // Gera um vetor aleatório para movimento
            const randomDirection = p5.Vector.random2D();
            // Força normalizada
            randomDirection.normalize();
            // Aplica velocidade baseada no gene de velocidade
            const speedMultiplier = this.dna.genes.speed || 1;
            randomDirection.mult(speedMultiplier);
            
            // Aplica a força ao sistema de movimento
            this.movement.setDirection(randomDirection);
        }
        
        // Sempre atualiza o movimento
        this.movement.update(deltaTime);
    }

    /**
     * Move a bactéria em direção a uma posição
     * @param {p5.Vector} target - Posição alvo
     * @param {number} speedMultiplier - Multiplicador de velocidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveTowards(target, speedMultiplier, deltaTime) {
        // Verifica se target é válido
        if (!target || !target.x || !target.y) return;
        
        // Valores padrão
        speedMultiplier = speedMultiplier || 1;
        deltaTime = deltaTime || 1;
        
        // Cria um vetor do ponto atual para o alvo
        const direction = createVector(target.x - this.pos.x, target.y - this.pos.y);
        
        // Normaliza para manter velocidade constante
        direction.normalize();
        
        // Aplica o multiplicador de velocidade e gene de velocidade
        const geneSpeedMultiplier = this.dna.genes.speed || 1;
        direction.mult(speedMultiplier * geneSpeedMultiplier);
        
        // Define a direção no sistema de movimento
        this.movement.setDirection(direction);
        
        // Atualiza o movimento
        this.movement.update(deltaTime);
    }

    /**
     * Implementa Q-Learning para decidir a próxima ação
     * @param {Object} conditions - Condições do ambiente
     * @returns {string} - Ação escolhida
     */
    qLearningDecision(conditions) {
        conditions = conditions || {};
        
        // Verifica se a ação foi recentemente recompensada
        // Converte as condições em uma string para usar como chave no mapa
        const stateKey = JSON.stringify({
            health: Math.floor(this.health / 10) * 10,
            energy: Math.floor(this.states.getEnergy() / 10) * 10,
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
        // ... código existente mantido ...
    }

    /**
     * Atualiza a bactéria
     * @param {Array} food - Array de comida disponível
     * @param {Array} predators - Array de predadores
     * @param {Array} obstacles - Array de obstáculos
     * @param {Array} entities - Array de todas as entidades
     * @param {number} deltaTime - Tempo desde o último frame
     * @returns {Bacteria|null} - Retorna um filho se reproduzir, null caso contrário
     */
    update(food, predators, obstacles, entities, deltaTime = 1) {
        try {
            // Atualiza idade
            this.age += deltaTime;

            // Verifica se está morta
            if (this.isDead()) {
                return null;
            }

            // Reduz energia ao longo do tempo
            this.health -= this.healthLossRate * deltaTime;

            // Verifica condições do ambiente - garantindo que retorne um objeto válido
            let conditions = this.analyzeEnvironment(food, predators, obstacles, entities) || {};
            
            // Considera os relacionamentos na análise do ambiente - atualiza conditions com o retorno
            conditions = this.considerRelationships(conditions, entities);

            // Decide a ação
            const action = this.decideAction(conditions);

            // Executa a ação
            this.executeAction(action, conditions, deltaTime);

            // Atualiza o sistema de estados
            const stateActions = this.states.update({
                predatorNearby: conditions.predatorNearby || false,
                foodNearby: conditions.foodNearby || false,
                mateNearby: conditions.mateNearby || false,
                forcedState: action
            });

            // Aplica ações do estado
            this.applyStateActions(stateActions, conditions, deltaTime);

            // Tenta reproduzir
            const child = this.reproduction.update();
            if (child) {
                const childX = this.pos.x + random(-20, 20);
                const childY = this.pos.y + random(-20, 20);
                return new Bacteria(childX, childY, child);
            }

            // Sem filhos
            return null;
        } catch (error) {
            console.error("Erro no update da Bacteria:", error);
            return null;
        }
    }
    
    /**
     * Considera relacionamentos na análise do ambiente
     * @param {Object} conditions - Condições do ambiente
     * @param {Array} entities - Todas as entidades
     */
    considerRelationships(conditions, entities) {
        // Verifica se conditions é válido, se não, inicializa
        if (!conditions) {
            conditions = {};
        }
        
        // Filtrar apenas bactérias
        const bacteria = entities && Array.isArray(entities) 
            ? entities.filter(e => e instanceof Bacteria && e !== this) 
            : [];
        
        // Verifica relações de amizade e inimizade
        let nearbyFriends = [];
        let nearbyEnemies = [];
        
        for (const b of bacteria) {
            const distance = dist(this.pos.x, this.pos.y, b.pos.x, b.pos.y);
            
            if (distance <= this.perceptionRadius) {
                // Verifica se esta bactéria está nos mapas de amizade/inimizade
                const id = this.getBacteriaId(b);
                
                if (this.friendships.has(id)) {
                    nearbyFriends.push(b);
                } else if (this.enemies.has(id)) {
                    nearbyEnemies.push(b);
                }
            }
        }
        
        // Adiciona informações às condições
        conditions.friendsNearby = nearbyFriends.length > 0;
        conditions.enemiesNearby = nearbyEnemies.length > 0;
        conditions.nearbyFriends = nearbyFriends;
        conditions.nearbyEnemies = nearbyEnemies;
        
        return conditions;
    }
    
    /**
     * Obtém um ID para a bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {number} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        // Verifica se o parâmetro é válido
        if (!bacteria) return 0;
        
        // Usa o communicationId se existir
        if (bacteria.communicationId) {
            return bacteria.communicationId;
        }
        
        try {
            // Tenta usar o índice no array de simulação
            const index = window.simulation?.bacteria?.indexOf(bacteria);
            if (index !== undefined && index >= 0) {
                // Atribui o ID à bactéria para referência futura
                bacteria.communicationId = index + 1;
                return bacteria.communicationId;
            }
        } catch (error) {
            console.error("Erro ao obter ID da bactéria:", error);
        }
        
        // Se tudo falhar, usa um ID aleatório
        bacteria.communicationId = Math.floor(Math.random() * 10000) + 1000;
        return bacteria.communicationId;
    }

    /**
     * Analisa o ambiente em volta
     * @param {Array} food - Array de comida
     * @param {Array} predators - Array de predadores
     * @param {Array} obstacles - Array de obstáculos
     * @param {Array} entities - Array de todas as entidades
     * @returns {Object} - Condições do ambiente
     */
    analyzeEnvironment(food, predators, obstacles, entities) {
        // Inicializa objeto de condições
        const conditions = {
            foodNearby: false,
            mateNearby: false,
            predatorNearby: false,
            foodTarget: null,
            mateTarget: null,
            predatorTarget: null,
            obstacleNearby: false
        };

        // Garante que os arrays são válidos
        food = Array.isArray(food) ? food : [];
        predators = Array.isArray(predators) ? predators : [];
        obstacles = Array.isArray(obstacles) ? obstacles : [];
        entities = Array.isArray(entities) ? entities : [];

        // Verifica comida próxima
        for (const f of food) {
            if (!f || !f.position) continue;
            
            const d = dist(this.pos.x, this.pos.y, f.position.x, f.position.y);
            if (d < this.perceptionRadius) {
                conditions.foodNearby = true;
                
                // Se não tiver alvo de comida ou se esta comida estiver mais perto
                if (!conditions.foodTarget || d < dist(this.pos.x, this.pos.y, conditions.foodTarget.position.x, conditions.foodTarget.position.y)) {
                    conditions.foodTarget = f;
                }
            }
        }

        // Verifica predadores próximos
        for (const p of predators) {
            if (!p || !p.pos) continue;
            
            const d = dist(this.pos.x, this.pos.y, p.pos.x, p.pos.y);
            if (d < this.perceptionRadius) {
                conditions.predatorNearby = true;
                
                // Se não tiver alvo de predador ou se este predador estiver mais perto
                if (!conditions.predatorTarget || d < dist(this.pos.x, this.pos.y, conditions.predatorTarget.pos.x, conditions.predatorTarget.pos.y)) {
                    conditions.predatorTarget = p;
                }
            }
        }

        // Verifica bactérias compatíveis para reprodução
        for (const e of entities) {
            if (!e || !(e instanceof Bacteria) || e === this) continue;
            
            // Verifica se é um parceiro em potencial (sexo oposto)
            if (e.isFemale !== this.isFemale) {
                const d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
                if (d < this.perceptionRadius) {
                    // Verifica se tem energia suficiente para reprodução
                    if (e.states && e.states.getEnergy() > 60 && this.states.getEnergy() > 60) {
                        conditions.mateNearby = true;
                        
                        // Se não tiver alvo de parceiro ou se este parceiro estiver mais perto
                        if (!conditions.mateTarget || d < dist(this.pos.x, this.pos.y, conditions.mateTarget.pos.x, conditions.mateTarget.pos.y)) {
                            conditions.mateTarget = e;
                        }
                    }
                }
            }
        }

        // Verifica obstáculos próximos
        for (const o of obstacles) {
            if (!o || !o.collidesWith) continue;
            
            // Verifica colisão com uma margem
            if (o.collidesWith(this.pos, this.size * 1.5)) {
                conditions.obstacleNearby = true;
                break;
            }
        }

        return conditions;
    }

    /**
     * Executa uma ação
     * @param {string} action - Ação a ser executada
     * @param {Object} conditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    executeAction(action, conditions, deltaTime) {
        // Garante valores padrão para parâmetros
        action = action || 'explore';
        conditions = conditions || {};
        deltaTime = deltaTime || 1;
        
        // Ações baseadas na decisão
        switch (action) {
            case 'seekFood':
                if (conditions.foodTarget) {
                    this.moveTowards(conditions.foodTarget.position, 1.2, deltaTime);
                } else {
                    this.moveRandom(deltaTime);
                }
                // Gasta energia ao procurar comida
                this.states.removeEnergy(0.15 * deltaTime);
                break;
            
            case 'seekMate':
                if (conditions.mateTarget) {
                    this.moveTowards(conditions.mateTarget.pos, 0.8, deltaTime);
                } else {
                    this.moveRandom(deltaTime);
                }
                // Gasta energia ao procurar parceiro
                this.states.removeEnergy(0.2 * deltaTime);
                break;
            
            case 'rest':
                // Não se move enquanto descansa
                this.movement.stop();
                // Recupera energia ao descansar
                this.states.addEnergy(0.3 * deltaTime);
                break;
            
            case 'explore':
            default:
                // Movimento aleatório durante exploração
                this.moveRandom(deltaTime);
                // Gasta energia ao explorar
                this.states.removeEnergy(0.1 * deltaTime);
                break;
        }
        
        // Se detectar predador, entra em modo de fuga independente da ação escolhida
        if (conditions.predatorNearby && conditions.predatorTarget) {
            // Calcula vetor de fuga na direção oposta ao predador
            const fleeVector = p5.Vector.sub(this.pos, conditions.predatorTarget.pos);
            fleeVector.normalize();
            fleeVector.mult(3); // Movimento mais rápido ao fugir
            
            // Aplica movimento de fuga
            this.movement.applyForce(fleeVector);
            
            // Gasta mais energia ao fugir
            this.states.removeEnergy(0.25 * deltaTime);
        }
    }

    /**
     * Aplica ações baseadas no estado atual
     * @param {Object} stateActions - Ações do estado atual
     * @param {Object} conditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    applyStateActions(stateActions, conditions, deltaTime) {
        // Verifica se stateActions é válido
        if (!stateActions) return;
        
        // Aplica as ações de movimento baseadas no estado
        if (!stateActions.shouldMove) {
            // Para de se mover se estiver descansando
            this.movement.stop();
        } else {
            // Continua movendo conforme o estado
            this.movement.resume();
            
            // Define a velocidade baseada no multiplicador do estado e gene de velocidade
            const speedMultiplier = stateActions.speedMultiplier * (this.dna.genes.speed || 1);
            
            // Aplica o movimento baseado no tipo de alvo
            switch (stateActions.targetType) {
                case 'food':
                    if (conditions.foodTarget) {
                        this.moveTowards(conditions.foodTarget.position, speedMultiplier, deltaTime);
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'mate':
                    if (conditions.mateTarget) {
                        this.moveTowards(conditions.mateTarget.pos, speedMultiplier, deltaTime);
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'escape':
                    if (conditions.predatorTarget) {
                        // Movimento na direção oposta ao predador
                        const escapeVector = createVector(
                            this.pos.x - conditions.predatorTarget.pos.x,
                            this.pos.y - conditions.predatorTarget.pos.y
                        );
                        escapeVector.normalize();
                        escapeVector.mult(speedMultiplier * 1.5); // Mais rápido ao fugir
                        
                        this.movement.setDirection(escapeVector);
                        this.movement.update(deltaTime);
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'random':
                default:
                    this.moveRandom(deltaTime);
                    break;
            }
        }
        
        // Atualiza a posição com base no movimento
        this.pos = this.movement.getPosition();
    }

    /**
     * Calcula a recompensa para o sistema de aprendizado
     * @param {Object} conditions - Condições do ambiente
     * @returns {number} - Valor da recompensa
     */
    calculateReward(conditions) {
        // ... código existente mantido ...
    }

    /**
     * Faz a bactéria se mover em uma direção aleatória
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveRandom(deltaTime) {
        // ... código existente mantido ...
    }

    /**
     * Move a bactéria em direção a uma posição
     * @param {p5.Vector} target - Posição alvo
     * @param {number} speedMultiplier - Multiplicador de velocidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveTowards(target, speedMultiplier, deltaTime) {
        // ... código existente mantido ...
    }

    /**
     * Faz a bactéria procurar comida
     * @param {Array} food - Array de comida
     * @param {number} deltaTime - Tempo desde o último frame
     */
    seekFood(food, deltaTime) {
        // ... código existente mantido ...
    }

    /**
     * Faz a bactéria fugir de predadores
     * @param {Array} predators - Array de predadores
     * @param {number} deltaTime - Tempo desde o último frame
     */
    fleeFromPredator(predators, deltaTime) {
        // ... código existente mantido ...
    }

    /**
     * Procura um parceiro para reprodução
     * @param {Array} bacteria - Array de bactérias
     * @param {number} deltaTime - Tempo desde o último frame
     */
    seekMate(bacteria, deltaTime) {
        // ... código existente mantido ...
    }

    /**
     * Faz a bactéria comer comida
     * @param {Food} food - Comida a ser consumida
     * @returns {boolean} - Se conseguiu comer
     */
    eat(food) {
        // Verifica se a comida ainda existe
        if (!food) return false;

        // Aumenta energia baseado no valor nutricional da comida
        const energyGain = food.nutrition || 30;
        this.health = Math.min(100, this.health + energyGain * 0.5);
        this.states.addEnergy(energyGain);
        
        // Atualiza o último tempo de alimentação
        this.lastMealTime = frameCount;

        // Recompensa para o aprendizado
        const reward = 2.0; // Recompensa por ter comido
        
        // Atualiza o Q-Learning se disponível
        if (this.qLearning.lastState && this.qLearning.lastAction) {
            const newConditions = { // Estado atual após comer
                health: this.health,
                energy: this.states.getEnergy(),
                foodNearby: false, // Já comeu a comida
                mateNearby: false,
                predatorNearby: false
            };
            this.updateQTable(this.qLearning.lastState, this.qLearning.lastAction, reward, newConditions);
        }

        return true;
    }

    /**
     * Tenta reproduzir com outra bactéria
     * @param {Bacteria} partner - Parceiro para reprodução
     * @returns {boolean} - Se conseguiu reproduzir
     */
    mate(partner) {
        // ... código existente mantido ...
    }

    /**
     * Verifica se a bactéria está morta
     * @returns {boolean} - Se a bactéria está morta
     */
    isDead() {
        // Morte por saúde esgotada
        if (this.health <= 0) {
            return true;
        }
        
        // Morte por velhice
        if (this.age >= this.lifespan) {
            return true;
        }
        
        // Morte por doença (chance de morte aumenta com mais doenças ativas)
        if (this.isInfected && this.activeDiseases.size > 0) {
            // Cada doença aumenta a chance de morte
            const deathChance = 0.0001 * this.activeDiseases.size;
            // Fator redutor baseado na imunidade
            const immunityFactor = 1 - (this.dna.genes.immunity * 0.8);
            
            // Verifica chance de morte por doença
            if (random() < deathChance * immunityFactor) {
                // Atualiza estatísticas
                if (this.simulation && this.simulation.stats) {
                    this.simulation.stats.diseaseDeaths++;
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * Desenha a bactéria
     */
    draw() {
        push();
        
        // Tamanho baseado no DNA
        const size = this.size * (0.7 + this.dna.genes.size * 0.6);
        
        // Cor base baseada no gênero, DNA e estado
        let baseColor;
        
        if (this.isFemale) {
            baseColor = color(255, 150, 200); // Rosa para fêmeas
        } else {
            baseColor = color(150, 200, 255); // Azul para machos
        }
        
        // Ajusta cor com base no DNA
        const r = baseColor.levels[0] * (0.7 + this.dna.genes.colorR * 0.3);
        const g = baseColor.levels[1] * (0.7 + this.dna.genes.colorG * 0.3);
        const b = baseColor.levels[2] * (0.7 + this.dna.genes.colorB * 0.3);
        
        // Cor final
        const finalColor = color(r, g, b);
        
        // Transparência baseada na saúde
        const alpha = map(this.health, 0, 100, 100, 255);
        finalColor.setAlpha(alpha);
        
        // Desenha corpo base da bactéria
        fill(finalColor);
        noStroke();
        
        // Corpo da bactéria
        ellipse(this.pos.x, this.pos.y, size, size);
        
        // Indicador de infecção (se presente)
        if (this.isInfected) {
            // Desenha símbolo de alerta
            strokeWeight(1.5);
            stroke(255, 50, 50);
            noFill();
            drawingContext.setLineDash([2, 2]);
            ellipse(this.pos.x, this.pos.y, size * 1.5, size * 1.5);
            drawingContext.setLineDash([]);
            
            // Pequeno símbolo de doença
            fill(255, 50, 50);
            noStroke();
            const symbolSize = size * 0.2;
            ellipse(this.pos.x, this.pos.y - (size * 0.5), symbolSize, symbolSize);
        }
        
        // Desenha indicador de estado
        const stateColor = this.getStateColor();
        fill(stateColor);
        noStroke();
        ellipse(this.pos.x, this.pos.y, size * 0.5, size * 0.5);
        
        // Indicador de energia (se habilitado)
        if (window.simulation && window.simulation.showEnergy) {
            const energyWidth = size * 1.2;
            const energyHeight = 3;
            const energyY = this.pos.y + (size / 2) + 5;
            
            // Fundo da barra
            fill(50, 50, 50, 150);
            rect(this.pos.x - energyWidth/2, energyY, energyWidth, energyHeight);
            
            // Barra de energia
            const energyLevel = map(this.energy, 0, 100, 0, energyWidth);
            fill(50, 200, 50, 200);
            rect(this.pos.x - energyWidth/2, energyY, energyLevel, energyHeight);
        }
        
        pop();
    }

    /**
     * Retorna a cor associada ao estado atual
     * @returns {p5.Color} Cor do estado
     */
    getStateColor() {
        switch (this.states.getCurrentState()) {
            case window.BacteriaStates.EXPLORING:
                return color(50, 200, 50);
            case window.BacteriaStates.SEARCHING_FOOD:
                return color(200, 150, 50);
            case window.BacteriaStates.SEARCHING_MATE:
                return color(200, 50, 200);
            case window.BacteriaStates.FLEEING:
                return color(200, 0, 0);
            case window.BacteriaStates.RESTING:
                return color(50, 50, 200);
            default:
                return color(150, 150, 150);
        }
    }

    /**
     * Limpa recursos quando a bactéria morre
     */
    dispose() {
        // ... código existente mantido ...
    }
    
    /**
     * Adiciona uma bactéria como amiga
     * @param {Bacteria} bacteria - Bactéria amiga
     * @param {number} level - Nível de amizade (1-10)
     */
    addFriend(bacteria, level = 5) {
        const id = this.getBacteriaId(bacteria);
        this.friendships.set(id, {
            level: level,
            since: frameCount
        });
        
        // Remove da lista de inimigos se existir
        if (this.enemies.has(id)) {
            this.enemies.delete(id);
        }
    }
    
    /**
     * Adiciona uma bactéria como inimiga
     * @param {Bacteria} bacteria - Bactéria inimiga
     * @param {number} level - Nível de inimizade (1-10)
     */
    addEnemy(bacteria, level = 5) {
        const id = this.getBacteriaId(bacteria);
        this.enemies.set(id, {
            level: level,
            since: frameCount
        });
        
        // Remove da lista de amigos se existir
        if (this.friendships.has(id)) {
            this.friendships.delete(id);
        }
    }
    
    /**
     * Verifica se outra bactéria é amiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é amiga
     */
    isFriend(bacteria) {
        const id = this.getBacteriaId(bacteria);
        return this.friendships.has(id);
    }
    
    /**
     * Verifica se outra bactéria é inimiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é inimiga
     */
    isEnemy(bacteria) {
        const id = this.getBacteriaId(bacteria);
        return this.enemies.has(id);
    }
}

// Tornando a classe global
window.Bacteria = Bacteria;
window.BacteriaStateManager = BacteriaStateManager; 