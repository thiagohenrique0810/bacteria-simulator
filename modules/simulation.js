/**
 * Sistema principal de simulação
 */
class Simulation {
    /**
     * Inicializa o sistema de simulação
     */
    constructor() {
        // Sistemas
        this.saveSystem = new SaveSystem();
        this.randomEvents = new RandomEvents();
        this.controls = new Controls();

        // Configurações
        this.width = 800;
        this.height = 600;
        this.paused = false;
        this.speed = 1;
        this.zoom = 1;
        this.showTrails = false;
        this.showEnergy = true;
        this.showGender = true;
        this.populationLimit = 100;
        this.initialEnergy = 100;
        this.foodValue = 30;
        this.foodRate = 0.5;

        // Entidades
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];

        // Estatísticas
        this.initStats();

        // Configuração dos controles
        this.setupControls();
    }

    /**
     * Inicializa as estatísticas
     */
    initStats() {
        this.stats = {
            generation: 1,
            totalBacteria: 0,
            totalBacterias: 0,
            femaleBacterias: 0,
            maleBacterias: 0,
            pregnantBacterias: 0,
            restingBacterias: 0,
            hungryBacterias: 0,
            starvationDeaths: 0,
            highestGeneration: 1,
            births: 0,
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0,
            averageHealth: 0,
            totalChildren: 0
        };
    }

    /**
     * Atualiza configurações baseado nos controles
     */
    updateFromControls() {
        if (!this.controls) return;

        const state = this.controls.getState();
        
        // Atualiza configurações com validação
        this.speed = Math.max(0.1, Math.min(2, state.simulationSpeed));
        this.populationLimit = Math.max(20, Math.min(200, state.populationLimit));
        this.initialEnergy = Math.max(50, Math.min(150, state.initialEnergy));
        this.foodValue = Math.max(10, Math.min(50, state.foodValue));
        this.foodRate = Math.max(0, Math.min(1, state.foodRate));
        this.maxObstacles = Math.max(0, Math.min(20, state.maxObstacles));
        
        // Atualiza visualização
        this.showTrails = state.showTrails;
        this.showEnergy = state.showEnergy;
        this.showGender = state.showGender;
        this.zoom = Math.max(0.5, Math.min(2, state.zoom));

        // Atualiza número de obstáculos
        this.updateObstacles();

        console.log('Configurações iniciais carregadas:', {
            speed: this.speed,
            populationLimit: this.populationLimit,
            initialEnergy: this.initialEnergy,
            foodValue: this.foodValue,
            foodRate: this.foodRate,
            maxObstacles: this.maxObstacles
        });
    }

    /**
     * Atualiza obstáculos baseado no controle
     */
    updateObstacles() {
        const currentCount = this.obstacles.length;
        const targetCount = this.maxObstacles;

        if (currentCount < targetCount) {
            // Adiciona obstáculos
            for (let i = 0; i < targetCount - currentCount; i++) {
                this.obstacles.push(new Obstacle(
                    random(this.width - 100),
                    random(this.height - 100),
                    random(20, 100),
                    random(20, 100)
                ));
            }
        } else if (currentCount > targetCount) {
            // Remove obstáculos
            this.obstacles.splice(targetCount);
        }
    }

    /**
     * Atualiza a simulação
     */
    update() {
        if (this.paused) return;

        // Atualiza múltiplas vezes por frame baseado na velocidade
        for (let i = 0; i < this.speed; i++) {
            this.updateEntities();
            this.checkInteractions();
            this.managePopulation();
            this.randomEvents.update();
        }

        // Atualiza estatísticas
        this.updateStats();
    }

    /**
     * Atualiza todas as entidades
     */
    updateEntities() {
        // Atualiza bactérias
        for (let bacteria of this.bacteria) {
            bacteria.update(this.food, this.obstacles, this.bacteria);
        }

        // Remove bactérias mortas
        const initialCount = this.bacteria.length;
        this.bacteria = this.bacteria.filter(bacteria => bacteria.health > 0);
        this.stats.deaths += initialCount - this.bacteria.length;

        // Adiciona nova comida baseado na taxa
        if (random() < this.foodRate * 0.02 && this.food.length < 100) {
            this.addFood(
                random(this.width),
                random(this.height),
                this.foodValue
            );
        }
    }

    /**
     * Verifica interações entre entidades
     */
    checkInteractions() {
        // Verifica colisões entre bactérias e comida
        for (let bacteria of this.bacteria) {
            for (let i = this.food.length - 1; i >= 0; i--) {
                const food = this.food[i];
                const d = dist(bacteria.pos.x, bacteria.pos.y, food.position.x, food.position.y);
                
                if (d < bacteria.size/2 + 5) {
                    bacteria.eat(food.nutrition);
                    this.food.splice(i, 1);
                    this.stats.foodConsumed++;
                }
            }
        }

        // Verifica reprodução entre bactérias
        for (let i = 0; i < this.bacteria.length; i++) {
            for (let j = i + 1; j < this.bacteria.length; j++) {
                const b1 = this.bacteria[i];
                const b2 = this.bacteria[j];
                
                // Verifica se podem acasalar (sexos opostos e saudáveis)
                if (b1.isFemale !== b2.isFemale && 
                    b1.health >= 70 && b2.health >= 70 &&
                    b1.reproduction.canMateNow() && b2.reproduction.canMateNow()) {
                    
                    // Tenta acasalar
                    if (b1.mate(b2)) {
                        const child = this.createChild(b1, b2);
                        if (child) {
                            this.bacteria.push(child);
                            this.stats.births++;
                        }
                    }
                }
            }
        }
    }

    /**
     * Gerencia a população de bactérias
     */
    managePopulation() {
        // Limita o número máximo de bactérias
        while (this.bacteria.length > this.populationLimit) {
            const weakest = this.bacteria.reduce((prev, curr) => 
                prev.health < curr.health ? prev : curr
            );
            const index = this.bacteria.indexOf(weakest);
            if (index > -1) {
                this.bacteria.splice(index, 1);
                this.stats.deaths++;
            }
        }

        // Adiciona novas bactérias se a população estiver muito baixa
        if (this.bacteria.length < 10) {
            for (let i = 0; i < 5; i++) {
                this.addBacteria(
                    random(width),
                    random(height),
                    new DNA(),
                    this.initialEnergy
                );
            }
        }
    }

    /**
     * Atualiza as estatísticas
     */
    updateStats() {
        // População total
        this.stats.totalBacteria = this.bacteria.length;
        this.stats.totalBacterias = this.bacteria.length;

        // Contadores
        this.stats.femaleBacterias = 0;
        this.stats.maleBacterias = 0;
        this.stats.pregnantBacterias = 0;
        this.stats.restingBacterias = 0;
        this.stats.hungryBacterias = 0;
        
        // Saúde média
        let totalHealth = 0;

        // Atualiza contadores
        for (let bacteria of this.bacteria) {
            // Gênero
            if (bacteria.isFemale) {
                this.stats.femaleBacterias++;
            } else {
                this.stats.maleBacterias++;
            }

            // Estado reprodutivo
            if (bacteria.reproduction.isPregnant) {
                this.stats.pregnantBacterias++;
            }

            // Estado comportamental
            if (bacteria.behavior.isRestingState()) {
                this.stats.restingBacterias++;
            }

            // Estado de fome
            if (frameCount - bacteria.lastMealTime > bacteria.starvationTime * 0.7) {
                this.stats.hungryBacterias++;
            }

            // Soma saúde
            totalHealth += bacteria.health;
        }

        // Calcula saúde média
        this.stats.averageHealth = this.bacteria.length > 0 ? 
            totalHealth / this.bacteria.length : 0;
        
        // Atualiza geração mais alta
        const maxGen = this.bacteria.reduce((max, b) => 
            Math.max(max, b.dna.generation), 0
        );
        if (maxGen > this.stats.highestGeneration) {
            this.stats.highestGeneration = maxGen;
            this.stats.generation = maxGen;
        }
    }

    /**
     * Desenha a simulação
     */
    draw() {
        background(51);

        // Desenha obstáculos
        for (let obstacle of this.obstacles) {
            fill(100);
            noStroke();
            rect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
        }

        // Desenha comida
        for (let food of this.food) {
            fill(0, 255, 0);
            noStroke();
            circle(food.position.x, food.position.y, 10);
        }

        // Desenha bactérias
        for (let bacteria of this.bacteria) {
            bacteria.draw();
        }

        // Desenha estatísticas
        this.drawStats();
    }

    /**
     * Desenha as estatísticas
     */
    drawStats() {
        fill(255);
        noStroke();
        textSize(14);
        textAlign(LEFT);

        let y = 20;
        text(`Geração: ${this.stats.generation}`, 10, y); y += 20;
        text(`Bactérias: ${this.stats.totalBacteria}`, 10, y); y += 20;
        text(`Nascimentos: ${this.stats.births}`, 10, y); y += 20;
        text(`Mortes: ${this.stats.deaths}`, 10, y); y += 20;
        text(`Comida Consumida: ${this.stats.foodConsumed}`, 10, y); y += 20;
        text(`Mutações: ${this.stats.mutations}`, 10, y); y += 20;
        text(`Eventos: ${this.stats.eventsTriggered}`, 10, y);
    }

    /**
     * Adiciona uma nova bactéria
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {DNA} dna - DNA da bactéria
     */
    addBacteria(x, y, dna, energy = this.initialEnergy) {
        const bacteria = new Bacteria(x, y, dna);
        bacteria.health = energy;
        this.bacteria.push(bacteria);
        return bacteria;
    }

    /**
     * Adiciona nova comida
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} nutrition - Valor nutricional
     */
    addFood(x, y, nutrition = this.foodValue) {
        const food = new Food(x, y, nutrition);
        this.food.push(food);
        return food;
    }

    /**
     * Cria uma nova bactéria filho
     * @param {Bacteria} parent1 - Primeiro pai
     * @param {Bacteria} parent2 - Segundo pai
     * @returns {Bacteria|null} - Nova bactéria ou null se falhar
     */
    createChild(parent1, parent2) {
        // Posição média entre os pais
        const x = (parent1.pos.x + parent2.pos.x) / 2;
        const y = (parent1.pos.y + parent2.pos.y) / 2;

        // Determina qual é a mãe
        const mother = parent1.reproduction.isFemale ? parent1.reproduction : parent2.reproduction;

        // Obtém o DNA do filho
        const childDNA = mother.giveBirth();

        // Chance de mutação
        if (random() < 0.1) {
            childDNA.mutate(0.1);
            this.stats.mutations++;
        }

        return this.addBacteria(x, y, childDNA);
    }

    /**
     * Reseta a simulação
     */
    reset() {
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];
        this.stats = {
            generation: 1,
            totalBacteria: 0,
            totalBacterias: 0,
            femaleBacterias: 0,
            maleBacterias: 0,
            pregnantBacterias: 0,
            restingBacterias: 0,
            hungryBacterias: 0,
            starvationDeaths: 0,
            highestGeneration: 1,
            births: 0,
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0,
            averageHealth: 0,
            totalChildren: 0
        };
        this.setup();
    }

    /**
     * Carrega um estado salvo
     * @param {Object} state - Estado a ser carregado
     */
    loadState(state) {
        this.bacteria = state.bacteria.map(b => 
            new Bacteria(b.position.x, b.position.y, b.dna)
        );
        
        this.food = state.food.map(f =>
            new Food(f.position.x, f.position.y, f.nutrition)
        );
        
        this.obstacles = state.obstacles.map(o =>
            new Obstacle(o.x, o.y, o.w, o.h)
        );
        
        this.stats = state.stats;
    }

    /**
     * Configura os callbacks dos controles
     */
    setupControls() {
        if (!this.controls) return;

        this.controls.setCallbacks({
            onPauseToggle: (isPaused) => {
                this.paused = isPaused;
                console.log('Simulação ' + (isPaused ? 'pausada' : 'continuando'));
            },
            onReset: () => {
                if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
                    this.reset();
                    console.log('Simulação reiniciada');
                }
            },
            onRandomEvent: () => {
                const event = this.randomEvents.triggerRandomEvent(this);
                if (event) {
                    this.stats.eventsTriggered++;
                    console.log(`Evento: ${event.name} - ${event.description}`);
                }
            },
            onSave: () => {
                if (this.saveSystem.saveState(this.bacteria, this.food, this.obstacles, this.stats)) {
                    console.log('Estado salvo com sucesso!');
                }
            },
            onLoad: () => {
                const saves = this.saveSystem.getSavesList();
                if (saves.length > 0) {
                    const state = this.saveSystem.loadState(saves[0].id);
                    if (state) {
                        this.loadState(state);
                        console.log('Estado carregado com sucesso!');
                    }
                }
            },
            onClearFood: () => {
                this.food = [];
                console.log('Comida removida');
            },
            onClearObstacles: () => {
                this.obstacles = [];
                console.log('Obstáculos removidos');
            },
            onToggleTrails: (show) => {
                this.showTrails = show;
                console.log('Rastros ' + (show ? 'ativados' : 'desativados'));
            },
            onToggleEnergy: (show) => {
                this.showEnergy = show;
                console.log('Exibição de energia ' + (show ? 'ativada' : 'desativada'));
            },
            onToggleGender: (show) => {
                this.showGender = show;
                console.log('Exibição de gênero ' + (show ? 'ativada' : 'desativada'));
            },
            onChange: (state) => {
                // Atualiza configurações com validação
                const oldSpeed = this.speed;
                const oldFoodRate = this.foodRate;
                const oldFoodValue = this.foodValue;
                const oldMaxObstacles = this.maxObstacles;

                this.speed = Math.max(0.1, Math.min(2, state.simulationSpeed));
                this.populationLimit = Math.max(20, Math.min(200, state.populationLimit));
                this.initialEnergy = Math.max(50, Math.min(150, state.initialEnergy));
                this.foodValue = Math.max(10, Math.min(50, state.foodValue));
                this.foodRate = Math.max(0, Math.min(1, state.foodRate));
                this.maxObstacles = Math.max(0, Math.min(20, state.maxObstacles));
                
                // Atualiza visualização
                this.showTrails = state.showTrails;
                this.showEnergy = state.showEnergy;
                this.showGender = state.showGender;
                this.zoom = Math.max(0.5, Math.min(2, state.zoom));

                // Atualiza obstáculos apenas se o valor mudou
                if (oldMaxObstacles !== this.maxObstacles) {
                    this.updateObstacles();
                }

                // Log das mudanças significativas
                if (oldSpeed !== this.speed) console.log('Velocidade atualizada:', this.speed);
                if (oldFoodRate !== this.foodRate) console.log('Taxa de comida atualizada:', this.foodRate);
                if (oldFoodValue !== this.foodValue) console.log('Valor nutricional atualizado:', this.foodValue);
                if (oldMaxObstacles !== this.maxObstacles) console.log('Número de obstáculos atualizado:', this.maxObstacles);
            }
        });

        // Força uma atualização inicial
        this.updateFromControls();
    }

    /**
     * Inicializa a simulação
     */
    setup() {
        // Adiciona bactérias iniciais
        for (let i = 0; i < 20; i++) {
            this.addBacteria(
                random(this.width),
                random(this.height),
                new DNA(),
                this.initialEnergy
            );
        }

        // Adiciona comida inicial
        for (let i = 0; i < 50; i++) {
            this.addFood(
                random(this.width),
                random(this.height),
                this.foodValue
            );
        }

        // Adiciona obstáculos iniciais
        const initialObstacles = this.maxObstacles || 5;
        for (let i = 0; i < initialObstacles; i++) {
            this.obstacles.push(new Obstacle(
                random(this.width - 100),
                random(this.height - 100),
                random(20, 100),
                random(20, 100)
            ));
        }
    }
}

// Tornando a classe global
window.Simulation = Simulation; 