/**
 * Classe principal que representa uma bactéria
 * Integra todos os componentes em um sistema único
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
        // Inicializa a base da bactéria
        this.base = new BacteriaBase(x, y, parentDNA, energy);
        
        // Acesso direto a propriedades importantes da base
        this.pos = this.base.pos;
        this.size = this.base.size;
        this.dna = this.base.dna;
        this.health = this.base.health;
        this.energy = this.base.energy;
        this.age = this.base.age;
        this.lifespan = this.base.lifespan;
        this.isFemale = this.base.isFemale;
        this.isInfected = this.base.isInfected;
        this.activeDiseases = this.base.activeDiseases;
        this.immuneMemory = this.base.immuneMemory;
        this.canReproduce = this.base.canReproduce;
        this.id = this.base.id;
        this.perceptionRadius = this.base.perceptionRadius;
        
        // Inicializa subsistemas
        this.states = new BacteriaStateManager();
        this.movement = new BacteriaMovement(this.base);
        this.environment = new BacteriaEnvironment(this.base);
        this.learning = new BacteriaLearning(this.base);
        this.social = new BacteriaSocial(this.base);
        this.reproduction = new Reproduction(this.isFemale);
        this.reproduction.setDNA(this.dna);
        this.visualization = new BacteriaVisualizationComponent(this.base);
        
        // Estado atual
        this.state = window.BacteriaStates.EXPLORING;
        
        // Referência à simulação
        this.simulation = null;
        
        // Adiciona referências cruzadas
        this.base.states = this.states;
        this.base.visualization = this.visualization;
        this.base.simulation = this.simulation;
        
        // Proxy para facilitar acesso aos mapas e métodos sociais
        this.friendships = this.social.friendships;
        this.enemies = this.social.enemies;
    }
    
    /**
     * Define a simulação para a bactéria
     * @param {Simulation} simulation - Referência para a simulação
     */
    setSimulation(simulation) {
        this.simulation = simulation;
        this.base.simulation = simulation;
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
            // Atualiza idade e propriedades base
            this.base.age += deltaTime;
            this.age = this.base.age;

            // Verifica se está morta
            if (this.isDead()) {
                return null;
            }

            // Reduz energia ao longo do tempo
            this.base.health -= this.base.healthLossRate * deltaTime;
            this.health = this.base.health;

            // Analisa o ambiente
            let conditions = this.environment.analyzeEnvironment(food, predators, obstacles, entities) || {};
            
            // Considera os relacionamentos na análise do ambiente
            conditions = this.environment.considerRelationships(conditions, entities);

            // Processa interações sociais
            this.social.processInteractions(entities);

            // Decide a ação
            const action = this.learning.decideAction(conditions);

            // Executa a ação
            this.executeAction(action, conditions, deltaTime);

            // Atualiza o sistema de estados
            const stateActions = this.states.update({
                predatorNearby: conditions.predatorNearby || false,
                foodNearby: conditions.foodNearby || false,
                mateNearby: conditions.mateNearby || false,
                forcedState: action
            });

            // Aplica ações do estado ao movimento
            this.movement.applyStateActions(stateActions, conditions, deltaTime);

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
                    this.movement.moveTowards(conditions.foodTarget.position, 1.2, deltaTime);
                } else {
                    this.movement.moveRandom(deltaTime);
                }
                // Gasta energia ao procurar comida
                this.states.removeEnergy(0.15 * deltaTime);
                break;
            
            case 'seekMate':
                if (conditions.mateTarget) {
                    this.movement.moveTowards(conditions.mateTarget.pos, 0.8, deltaTime);
                } else {
                    this.movement.moveRandom(deltaTime);
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
                this.movement.moveRandom(deltaTime);
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
     * Faz a bactéria comer comida
     * @param {Food} food - Comida a ser consumida
     * @returns {boolean} - Se conseguiu comer
     */
    eat(food) {
        return this.base.eat(food);
    }
    
    /**
     * Verifica se a bactéria está morta
     * @returns {boolean} - Se a bactéria está morta
     */
    isDead() {
        return this.base.isDead();
    }
    
    /**
     * Tenta reproduzir com outra bactéria
     * @param {Bacteria} partner - Parceiro para reprodução
     * @returns {boolean} - Se conseguiu reproduzir
     */
    mate(partner) {
        // Verifica se ambos podem se reproduzir
        if (!this.canReproduce || !partner.canReproduce) {
            return false;
        }
        
        // Tenta acasalar com o sistema reprodutivo do parceiro
        return this.reproduction.mate(partner.reproduction);
    }
    
    /**
     * Desenha a bactéria
     */
    draw() {
        this.visualization.draw();
    }
    
    /**
     * Obtém um ID para a bactéria
     * @param {Bacteria} bacteria - Bactéria a identificar
     * @returns {number} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        // Delega a função para o componente social
        if (this.social && typeof this.social.getBacteriaId === 'function') {
            return this.social.getBacteriaId(bacteria);
        }
        
        // Fallback caso o componente social não esteja disponível
        if (!bacteria) return 0;
        
        // Usa o ID da bactéria se existir
        if (bacteria.id) {
            return bacteria.id;
        }
        
        // Usa o communicationId se existir
        if (bacteria.communicationId) {
            return bacteria.communicationId;
        }
        
        // Se tudo falhar, gera um ID aleatório
        bacteria.id = Math.floor(Math.random() * 10000) + 1000;
        return bacteria.id;
    }
    
    /**
     * Adiciona uma bactéria como amiga
     * @param {Bacteria} bacteria - Bactéria amiga
     * @param {number} level - Nível de amizade (1-10)
     */
    addFriend(bacteria, level = 5) {
        this.social.addFriend(bacteria, level);
    }
    
    /**
     * Adiciona uma bactéria como inimiga
     * @param {Bacteria} bacteria - Bactéria inimiga
     * @param {number} level - Nível de inimizade (1-10)
     */
    addEnemy(bacteria, level = 5) {
        this.social.addEnemy(bacteria, level);
    }
    
    /**
     * Verifica se outra bactéria é amiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é amiga
     */
    isFriend(bacteria) {
        return this.social.isFriend(bacteria);
    }
    
    /**
     * Verifica se outra bactéria é inimiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é inimiga
     */
    isEnemy(bacteria) {
        return this.social.isEnemy(bacteria);
    }
    
    /**
     * Limpa recursos quando a bactéria morre
     */
    dispose() {
        this.base.dispose();
    }
    
    /**
     * Calcula a recompensa para Q-Learning
     * @returns {number} - Valor de recompensa
     */
    calculateReward() {
        let reward = 0;
        
        // Recompensa baseada na saúde (0-1)
        const healthReward = this.health / 100;
        
        // Recompensa baseada na energia (0-1)
        const energyReward = this.states ? this.states.getEnergy() / 100 : this.energy / 100;
        
        // Penalidade por idade avançada
        const ageRatio = this.age / this.lifespan;
        const agePenalty = ageRatio > 0.8 ? (ageRatio - 0.8) * 2 : 0;
        
        // Calcula recompensa final
        reward = (healthReward * 0.4) + (energyReward * 0.6) - agePenalty;
        
        // Garante que a recompensa esteja entre -1 e 1
        return Math.max(-1, Math.min(1, reward));
    }
}

// Exporta a classe para uso global
window.Bacteria = Bacteria; 