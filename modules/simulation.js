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

        // Entidades
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];

        // Estatísticas
        this.stats = {
            generation: 1,
            totalBacteria: 0,
            highestGeneration: 1,
            births: 0,
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0
        };

        // Configuração dos controles
        this.setupControls();
    }

    /**
     * Configura os callbacks dos controles
     */
    setupControls() {
        this.controls.setCallbacks({
            onPauseToggle: (isPaused) => {
                this.paused = isPaused;
            },
            onReset: () => {
                this.reset();
            },
            onRandomEvent: () => {
                const event = this.randomEvents.triggerRandomEvent(this);
                if (event) {
                    this.stats.eventsTriggered++;
                    console.log(`${event.name}: ${event.description}`);
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
            }
        });
    }

    /**
     * Inicializa a simulação
     */
    setup() {
        // Cria canvas
        createCanvas(this.width, this.height);
        
        // Adiciona bactérias iniciais
        for (let i = 0; i < 20; i++) {
            this.addBacteria(
                random(width),
                random(height),
                new DNA()
            );
        }

        // Adiciona comida inicial
        for (let i = 0; i < 50; i++) {
            this.addFood(
                random(width),
                random(height),
                random(20, 40)
            );
        }

        // Adiciona obstáculos
        this.addRandomObstacles(5);
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

        // Adiciona nova comida periodicamente
        if (random() < 0.02 && this.food.length < 100) {
            this.addFood(
                random(width),
                random(height),
                random(20, 40)
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
                
                if (b1.canMateWith(b2)) {
                    const child = this.createChild(b1, b2);
                    if (child) {
                        this.bacteria.push(child);
                        this.stats.births++;
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
        while (this.bacteria.length > 100) {
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
                    new DNA()
                );
            }
        }
    }

    /**
     * Atualiza as estatísticas
     */
    updateStats() {
        this.stats.totalBacteria = this.bacteria.length;
        
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
    addBacteria(x, y, dna) {
        const bacteria = new Bacteria(x, y, dna);
        this.bacteria.push(bacteria);
        return bacteria;
    }

    /**
     * Adiciona nova comida
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} nutrition - Valor nutricional
     */
    addFood(x, y, nutrition) {
        this.food.push(new Food(x, y, nutrition));
    }

    /**
     * Adiciona obstáculos aleatórios
     * @param {number} count - Quantidade de obstáculos
     */
    addRandomObstacles(count) {
        for (let i = 0; i < count; i++) {
            this.obstacles.push(new Obstacle(
                random(width - 100),
                random(height - 100),
                random(20, 100),
                random(20, 100)
            ));
        }
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

        // Combina DNA dos pais
        const childDNA = parent1.reproduction.createChildDNA(parent2.reproduction);

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
            highestGeneration: 1,
            births: 0,
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0
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
}

// Tornando a classe global
window.Simulation = Simulation; 