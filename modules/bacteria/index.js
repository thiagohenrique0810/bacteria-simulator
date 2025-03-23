/**
 * Módulo de bactéria
 * Integra todos os componentes em um sistema único
 */
class Bacteria extends BacteriaBase {
    /**
     * Inicializa uma nova bactéria
     * @param {Object} params - Parâmetros de inicialização
     */
    constructor(params = {}) {
        // Extrai parâmetros
        const { x, y, parentDNA, energy = 100, initialState, initialEnergy } = params;
        
        // Chama construtor da classe pai
        super({ x, y, parentDNA, energy });
        
        // Inicializa comportamentos
        this.initBehaviors();
        
        // Inicializa sistema de movimento (verificando se existe)
        try {
            this.movement = new BacteriaMovement(this);
            if (!this.movement) {
                console.error(`Falha ao criar sistema de movimento para bactéria ${this.id}`);
                // Tenta criar novamente com um construtor alternativo
                this.movement = new window.BacteriaMovement(this);
            }
        } catch (error) {
            console.error(`Erro ao inicializar sistema de movimento: ${error.message}`);
            // Tenta um fallback se disponível
            if (typeof window.BacteriaMovement === 'function') {
                this.movement = new window.BacteriaMovement(this);
            }
        }
        
        // Inicializa gerenciador de estados (verificando se existe)
        try {
            this.stateManager = new BacteriaStateManager(this);
            if (!this.stateManager) {
                console.error(`Falha ao criar gerenciador de estados para bactéria ${this.id}`);
                // Tenta criar novamente com um construtor alternativo
                this.stateManager = new window.BacteriaStateManager(this);
            }
        } catch (error) {
            console.error(`Erro ao inicializar gerenciador de estados: ${error.message}`);
            // Tenta um fallback se disponível
            if (typeof window.BacteriaStateManager === 'function') {
                this.stateManager = new window.BacteriaStateManager(this);
            }
        }
        
        // Inicializa componente de visualização
        try {
            this.visualization = new BacteriaVisualizationComponent(this);
        } catch (error) {
            console.error(`Erro ao inicializar visualização: ${error.message}`);
            // Tenta um fallback se disponível
            if (typeof window.BacteriaVisualizationComponent === 'function') {
                this.visualization = new window.BacteriaVisualizationComponent(this);
            }
        }
        
        // Inicializa em estado específico se fornecido
        if (initialState && this.stateManager && typeof this.stateManager.setCurrentState === 'function') {
            this.stateManager.setCurrentState(initialState);
        }

        // Configurar energia inicial se fornecida
        if (initialEnergy !== undefined && this.stateManager) {
            this.stateManager.currentEnergy = initialEnergy;
        }
        
        console.log(`Bactéria criada: ID=${this.id}, Sexo=${this.isFemale ? 'Feminino' : 'Masculino'}, Estado=${this.stateManager ? this.stateManager.currentState : 'não definido'}`);
    }
    
    /**
     * Inicializa os comportamentos da bactéria
     */
    initBehaviors() {
        // Inicializa subsistemas de comportamento
        this.environment = new BacteriaEnvironment(this);
        this.learning = new BacteriaLearning(this);
        this.social = new BacteriaSocial(this);
        this.reproduction = new Reproduction(this.isFemale);
        this.reproduction.setDNA(this.dna);
    }
    
    /**
     * Atualiza a bactéria
     */
    update() {
        // Incrementa a idade
        this.age++;
        
        // Depuração a cada 60 frames (aproximadamente 1 segundo a 60 FPS)
        if (this.age % 60 === 0) {
            console.log(`Bactéria ${this.id}: pos=(${this.pos.x.toFixed(2)},${this.pos.y.toFixed(2)}), idade=${this.age}, energia=${this.stateManager ? this.stateManager.currentEnergy.toFixed(1) : 'N/A'}`);
        }
        
        try {
            // Analisa o ambiente atual - CRÍTICO para IA
            const environmentConditions = this.environment.analyzeEnvironment();
            
            // Usa o sistema de aprendizado para decidir a próxima ação
            let action = 'explore'; // Ação padrão
            
            if (this.learning && typeof this.learning.decideAction === 'function') {
                action = this.learning.decideAction(environmentConditions);
                if (this.age % 60 === 0) {
                    console.log(`Bactéria ${this.id} decidiu: ${action} baseado no ambiente`);
                }
            }
            
            // Mapeia a ação decidida pela IA para um estado do gerenciador de estados
            if (this.stateManager) {
                // Mapeia a ação para o estado correspondente
                switch (action) {
                    case 'seekFood':
                        this.stateManager.setCurrentState('seekingFood');
                        break;
                    case 'seekMate':
                        this.stateManager.setCurrentState('reproducing');
                        break;
                    case 'rest':
                        this.stateManager.setCurrentState('resting');
                        break;
                    case 'explore':
                    default:
                        this.stateManager.setCurrentState('exploring');
                        break;
                }
                
                // Atualiza o gerenciador de estados
                this.stateManager.update(environmentConditions);
            } else {
                console.warn(`Sistema de estados não inicializado para a bactéria ${this.id}`);
            }
            
            // Determina as ações de movimento com base na ação escolhida
            const stateInfo = {
                state: this.stateManager ? this.stateManager.currentState : 'exploring',
                shouldMove: true, // Por padrão, as bactérias devem se mover
                targetType: 'random',
                speedMultiplier: 1.0
            };
            
            // Ajusta os parâmetros de movimento com base na ação
            if (action === 'seekFood' && environmentConditions.foodTarget) {
                stateInfo.targetType = 'food';
                stateInfo.target = environmentConditions.foodTarget;
                stateInfo.speedMultiplier = 1.2;
            } else if (action === 'seekMate' && environmentConditions.mateTarget) {
                stateInfo.targetType = 'mate';
                stateInfo.target = environmentConditions.mateTarget;
                stateInfo.speedMultiplier = 0.8;
            } else if (action === 'rest') {
                stateInfo.shouldMove = false;
            } else if (environmentConditions.predatorNearby) {
                // Sempre prioriza fuga de predadores
                stateInfo.targetType = 'escape';
                stateInfo.target = environmentConditions.predatorTarget;
                stateInfo.speedMultiplier = 1.5;
            }
            
            // Processa ações com base no estado atual
            if (this.movement) {
                // Aplica ações baseadas no estado atual e nas condições ambientais
                this.movement.applyStateActions(
                    stateInfo,
                    environmentConditions,
                    1/60 // Delta time (assumindo 60 fps)
                );
                
                // Atualiza o sistema de movimento
                if (this.movement.movement && typeof this.movement.movement.update === 'function') {
                    // Calcula a razão da idade (0-1)
                    const ageRatio = this.age / this.lifespan;
                    
                    // Verifica se está descansando
                    const isResting = stateInfo.shouldMove === false;
                    
                    this.movement.movement.update(
                        ageRatio,
                        environmentConditions.obstacles || [], 
                        this.size,
                        isResting,
                        1/60 // delta time
                    );
                } else {
                    // Fallback: método alternativo para atualizar movimento
                    this.movement.moveRandom(1/60);
                }
                
                // CRÍTICO: Sincroniza a posição da bactéria com a posição calculada pelo sistema de movimento
                if (this.movement.movement && this.movement.movement.position) {
                    this.pos.x = this.movement.movement.position.x;
                    this.pos.y = this.movement.movement.position.y;
                }
            } else {
                console.warn(`Sistema de movimento não inicializado para a bactéria ${this.id}`);
            }
            
            // Aprende com a experiência atual (fornece feedback para IA)
            if (this.learning && this.learning.updateQTable && this.stateManager) {
                // Calcula recompensa com base nas mudanças de energia/saúde
                const reward = this.calculateReward(action, environmentConditions);
                
                // Atualiza o sistema de aprendizado com a recompensa
                this.learning.updateQTable(
                    this.learning.lastState, 
                    this.learning.lastAction, 
                    reward, 
                    environmentConditions
                );
            }
        } catch (error) {
            console.error(`Erro durante atualização da bactéria ${this.id}:`, error);
        }
    }
    
    /**
     * Calcula a recompensa para o sistema de aprendizado
     * @param {string} action - Ação tomada
     * @param {Object} conditions - Condições ambientais 
     * @returns {number} - Valor da recompensa
     */
    calculateReward(action, conditions) {
        // Garante que conditions é um objeto válido
        if (!conditions) {
            conditions = {};
        }
        
        let reward = 0;
        
        // Energia atual
        const energy = this.stateManager ? this.stateManager.currentEnergy : 50;
        
        // Recompensa baseada na energia (valores negativos quando baixa energia)
        if (energy < 20) reward -= 0.5;
        else if (energy > 80) reward += 0.3;
        
        // Recompensas específicas por ação
        switch (action) {
            case 'seekFood':
                // Premia busca por comida quando tem pouca energia
                if (energy < 50) reward += 0.7;
                // Penaliza busca por comida quando já tem muita energia
                if (energy > 70) reward -= 0.3;
                // Premia muito se encontrou comida
                if (conditions.foodNearby) reward += 1.0;
                break;
                
            case 'seekMate':
                // Premia busca por parceiro quando tem muita energia
                if (energy > 70) reward += 0.7;
                // Penaliza fortemente busca por parceiro quando tem pouca energia
                if (energy < 30) reward -= 0.8;
                // Premia muito se encontrou parceiro
                if (conditions.mateNearby) reward += 1.0;
                break;
                
            case 'rest':
                // Premia descanso quando tem pouca energia
                if (energy < 30) reward += 0.8;
                // Penaliza descanso quando tem muita energia
                if (energy > 70) reward -= 0.5;
                break;
                
            case 'explore':
                // Pequena recompensa por explorar o ambiente
                reward += 0.2;
                // Penaliza exploração quando tem pouca energia
                if (energy < 20) reward -= 0.4;
                break;
        }
        
        // Penaliza fortemente se um predador está próximo e não está fugindo
        if (conditions.predatorNearby && action !== 'rest') reward -= 1.0;
        
        return reward;
    }
    
    /**
     * Desenha a bactéria
     */
    draw() {
        if (this.visualization) {
            this.visualization.draw();
        } else {
            // Fallback se a visualização não estiver disponível
            push();
            fill(this.isFemale ? color(255, 150, 200) : color(150, 200, 255));
            noStroke();
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
            pop();
        }
    }
    
    /**
     * Processa a interação com outro organismo
     * @param {Object} other - Outro organismo
     */
    interact(other) {
        // Delegado para o componente social
        this.social.interact(other);
    }
    
    /**
     * Processa a ingestão de comida
     * @param {Object} food - Item de comida
     * @returns {number} - Quantidade de energia obtida
     */
    eat(food) {
        const nutrition = food.nutrition || 20;
        this.stateManager.addEnergy(nutrition);
        return nutrition;
    }
    
    /**
     * Tenta reproduzir com outra bactéria
     * @param {Bacteria} partner - Parceiro para reprodução
     * @returns {Bacteria|null} - Nova bactéria ou null se falhar
     */
    reproduce(partner) {
        // Verifica compatibilidade
        if (!this.canReproduceWith(partner)) {
            return null;
        }
        
        // Recupera o DNA do parceiro
        const partnerDNA = partner.dna;
        
        // Realiza a reprodução
        const childDNA = this.reproduction.reproduce(partnerDNA);
        
        // Gasta energia reproduzindo
        this.stateManager.consumeEnergy(30);
        partner.stateManager.consumeEnergy(30);
        
        // Cria uma nova bactéria com o DNA resultante
        const childX = (this.pos.x + partner.pos.x) / 2;
        const childY = (this.pos.y + partner.pos.y) / 2;
        
        return new Bacteria({
            x: childX,
            y: childY,
            parentDNA: childDNA,
            energy: 60,
            initialState: "resting"
        });
    }
    
    /**
     * Verifica se pode reproduzir com outra bactéria
     * @param {Bacteria} partner - Parceiro potencial
     * @returns {boolean} - Verdadeiro se pode reproduzir
     */
    canReproduceWith(partner) {
        // Sexos diferentes e energia suficiente
        return this.isFemale !== partner.isFemale && 
               this.stateManager.currentEnergy > 40 && 
               partner.stateManager.currentEnergy > 40;
    }
}

// Exporta a classe para uso global
window.Bacteria = Bacteria; 