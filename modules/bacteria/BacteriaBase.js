/**
 * Classe base que representa uma bactéria
 * Contém as propriedades e métodos fundamentais
 */
class BacteriaBase {
    /**
     * Cria uma nova bactéria
     * @param {number|Object} x - Posição X inicial ou objeto com coordenadas {x, y}
     * @param {number} y - Posição Y inicial
     * @param {Object} parentDNA - DNA dos pais (opcional)
     * @param {number} energy - Energia inicial
     */
    constructor(x, y, parentDNA = null, energy = 100) {
        // Verifica se o primeiro parâmetro é um objeto (compatibilidade retroativa)
        if (typeof x === 'object' && x !== null) {
            // Extrai valores do objeto, com validação
            const posObj = x;
            const posX = typeof posObj.x === 'number' && !isNaN(posObj.x) ? posObj.x : random(width * 0.1, width * 0.9);
            const posY = typeof posObj.y === 'number' && !isNaN(posObj.y) ? posObj.y : random(height * 0.1, height * 0.9);
            
            // Atribui parâmetros a partir do objeto
            x = posX;
            y = posY;
            parentDNA = posObj.parentDNA || parentDNA;
            energy = typeof posObj.energy === 'number' ? posObj.energy : energy;
        }
        
        // Validação de x e y antes de criar o vetor de posição
        if (typeof x !== 'number' || isNaN(x)) {
            console.warn("BacteriaBase: Posição X inválida, usando valor aleatório");
            x = random(width * 0.1, width * 0.9);
        }
        if (typeof y !== 'number' || isNaN(y)) {
            console.warn("BacteriaBase: Posição Y inválida, usando valor aleatório");
            y = random(height * 0.1, height * 0.9);
        }
        
        // Posição e tamanho
        this.pos = createVector(x, y);
        this.size = 20;

        // Verifica se o vetor de posição foi criado corretamente
        if (!this.pos || typeof this.pos.x !== 'number' || isNaN(this.pos.x) || 
            typeof this.pos.y !== 'number' || isNaN(this.pos.y)) {
            console.error("BacteriaBase: Falha ao criar vetor de posição, recriando");
            
            // Tenta recriar o vetor com valores seguros
            const safeX = width/2;
            const safeY = height/2;
            this.pos = createVector(safeX, safeY);
            
            // Verifica novamente e usa um objeto simples se necessário
            if (!this.pos || typeof this.pos.x !== 'number') {
                console.error("BacteriaBase: Segunda tentativa falhou, usando objeto simples");
                this.pos = { x: safeX, y: safeY };
            }
        }

        // Inicializa DNA primeiro para ter acesso ao tempo de vida
        this.dna = new DNA(parentDNA);

        // Atributos básicos
        this.health = energy;
        this.energy = energy;
        this.age = 0;
        this.lifespan = this.dna.baseLifespan;
        this.lastMealTime = frameCount;
        
        // Valores padrão para os atributos
        this.healthLossRate = 0.05;
        this.starvationTime = 30 * 60 * 60; // 30 minutos em frames
        
        // Tenta acessar os controles de forma segura
        this.initializeSettings();
        
        this.isFemale = random() > 0.5;
        
        // Referência à simulação para acessar sistemas
        this.simulation = null;

        // Atributos relacionados a doenças
        this.isInfected = false;              // Indica se está infectada
        this.activeDiseases = new Set();      // Conjunto de doenças ativas
        this.immuneMemory = new Set();        // Memória de doenças para as quais já tem imunidade
        this.canReproduce = true;             // Flag que pode ser alterada por doenças
        this.id = Date.now() + Math.floor(random(0, 1000000)); // ID único

        // Raio de percepção
        this.perceptionRadius = 150;
    }
    
    /**
     * Inicializa configurações da bactéria com base nos controles da simulação
     */
    initializeSettings() {
        try {
            // Tenta acessar os controles de forma segura
            if (window.simulation && 
                window.simulation.controls && 
                typeof window.simulation.controls.healthLossSlider?.value === 'function') {
                this.healthLossRate = window.simulation.controls.healthLossSlider.value();
            }
            
            if (window.simulation && 
                window.simulation.controls && 
                typeof window.simulation.controls.feedingIntervalSlider?.value === 'function') {
                this.starvationTime = window.simulation.controls.feedingIntervalSlider.value() * 60 * 60;
            }
        } catch (e) {
            console.log("Usando valores padrão para healthLossRate e starvationTime", e);
        }
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
        
        // Adiciona energia usando states se disponível
        if (this.states && typeof this.states.addEnergy === 'function') {
            this.states.addEnergy(energyGain);
        } else {
            // Fallback se states não estiver disponível
            this.energy = Math.min(100, this.energy + energyGain);
        }
        
        // Atualiza o último tempo de alimentação
        this.lastMealTime = frameCount;

        // Atualiza o Q-Learning se disponível
        if (this.qLearning && this.qLearning.lastState && this.qLearning.lastAction) {
            const reward = 2.0; // Recompensa por ter comido
            const newConditions = { // Estado atual após comer
                health: this.health,
                energy: this.states ? this.states.getEnergy() : this.energy,
                foodNearby: false, // Já comeu a comida
                mateNearby: false,
                predatorNearby: false
            };
            
            if (typeof this.updateQTable === 'function') {
                this.updateQTable(this.qLearning.lastState, this.qLearning.lastAction, reward, newConditions);
            }
        }

        return true;
    }

    /**
     * Limpa recursos quando a bactéria morre
     */
    dispose() {
        // Limpa recursos e referências
        this.movement = null;
        this.states = null;
        this.reproduction = null;
        this.visualization = null;
        this.brain = null;
        this.qLearning = null;
        this.activeDiseases.clear();
        this.immuneMemory.clear();
        this.friendships.clear();
        this.enemies.clear();
    }

    /**
     * Atualiza a bactéria a cada frame
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime = 1) {
        try {
            // Incrementa a idade
            this.age += deltaTime;
            
            // Verifica se deve morrer de velhice
            if (this.age >= this.lifespan) {
                this.die("velhice");
                return;
            }
            
            // Verifica saúde
            if (this.health <= 0) {
                this.die("saúde");
                return;
            }
            
            // Atualiza os subsistemas
            if (this.social) this.social.update();
            
            // Processa o comportamento com o novo sistema integrado de IA e movimento
            this.processBehavior(deltaTime);
            
            // Atualiza a visualização
            if (this.visualization) this.visualization.update();
        } catch (error) {
            console.error("Erro ao atualizar bactéria:", error);
        }
    }
}

// Exporta a classe para uso global
window.BacteriaBase = BacteriaBase; 