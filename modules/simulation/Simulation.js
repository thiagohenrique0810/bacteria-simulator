/**
 * Classe principal de simulação
 * Integra todos os sistemas e gerencia o fluxo da simulação
 */
class Simulation {
    /**
     * Inicializa a simulação
     */
    constructor(canvas) {
        // Propriedades básicas
        this.width = 800;
        this.height = 600;
        this.time = 0;
        this.maxObstacles = 5; // Valor inicial de obstáculos
        
        // Sistemas
        this.initSystems();
        
        // Sistemas externos
        this.saveSystem = new SaveSystem();
        this.randomEvents = new RandomEvents();
        this.controls = new Controls();
        this.diseaseSystem = new DiseaseSystem(this);
        
        // Sistema de particionamento espacial
        this.spatialGrid = new SpatialGrid(this.width, this.height, 50); // Células de 50px
        
        // Configuração de controles
        if (typeof createDiv === 'function') {
            this.controlSystem.setupControls();
        } else {
            console.warn('p5.js não está pronto ainda. Os controles serão inicializados posteriormente.');
            window.addEventListener('load', () => {
                this.controlSystem.setupControls();
            });
        }
    }
    
    /**
     * Inicializa todos os subsistemas da simulação
     */
    initSystems() {
        // Cria os subsistemas
        this.entityManager = new EntityManager(this);
        this.statsManager = new StatsManager(this);
        this.interactionSystem = new InteractionSystem(this);
        this.environmentSystem = new EnvironmentSystem(this);
        this.renderSystem = new RenderSystem(this);
        this.controlSystem = new SimulationControlSystem(this);
    }
    
    /**
     * Atualiza o grid espacial com todas as entidades
     */
    updateSpatialGrid() {
        this.spatialGrid.clear();
        
        // Adiciona todas as bactérias ao grid
        for (let bacteria of this.entityManager.bacteria) {
            this.spatialGrid.insert(bacteria);
        }
        
        // Adiciona todos os predadores ao grid
        for (let predator of this.entityManager.predators) {
            this.spatialGrid.insert(predator);
        }
        
        // Adiciona toda a comida ao grid
        for (let food of this.entityManager.food) {
            this.spatialGrid.insert(food);
        }
        
        // Adiciona todos os obstáculos ao grid
        for (let obstacle of this.entityManager.obstacles) {
            this.spatialGrid.insert(obstacle);
        }
    }
    
    /**
     * Atualiza a simulação
     */
    update() {
        // Não atualiza se estiver pausado
        if (this.controlSystem.isPaused()) return;

        // Atualiza o tempo interno da simulação
        this.time += 1 * this.controlSystem.getSpeed();
        
        // Atualiza o sistema de ambiente
        this.environmentSystem.update();
        
        // Atualiza o sistema de doenças
        this.diseaseSystem.update();
        
        // Atualiza o grid espacial
        this.updateSpatialGrid();
        
        // Atualiza as bactérias
        const speed = this.controlSystem.getSpeed();
        for (let i = this.entityManager.bacteria.length - 1; i >= 0; i--) {
            // Se a bactéria morreu, remove da lista
            if (this.entityManager.bacteria[i].isDead()) {
                // Verifica se a morte foi por doença
                if (this.entityManager.bacteria[i].isInfected) {
                    this.statsManager.stats.diseaseDeaths++;
                }
                this.entityManager.bacteria.splice(i, 1);
                this.statsManager.stats.deaths++;
                continue;
            }
            
            // Atualiza a bactéria baseado na velocidade da simulação
            for (let s = 0; s < speed; s++) {
                // Passa os parâmetros necessários para as bactérias se moverem
                this.entityManager.bacteria[i].update(
                    this.entityManager.food, 
                    this.entityManager.predators, 
                    this.entityManager.obstacles, 
                    this.entityManager.bacteria, 
                    1
                );
            }
        }
        
        // Atualiza os predadores
        for (let i = this.entityManager.predators.length - 1; i >= 0; i--) {
            if (this.entityManager.predators[i].isDead()) {
                this.entityManager.predators.splice(i, 1);
                continue;
            }
            
            // Atualiza o predador baseado na velocidade da simulação
            for (let s = 0; s < speed; s++) {
                this.entityManager.predators[i].update(
                    this.entityManager.bacteria, 
                    this.entityManager.obstacles, 
                    this.entityManager.predators
                );
            }
        }
        
        // Verifica interações (colisões otimizadas)
        this.interactionSystem.checkInteractions();
        
        // Atualiza os efeitos visuais
        this.entityManager.updateEffects();
        
        // Atualiza as estatísticas
        this.statsManager.updateStats();
    }
    
    /**
     * Desenha a simulação
     */
    draw() {
        this.renderSystem.draw();
    }
    
    /**
     * Reseta a simulação
     */
    reset() {
        // Limpa entidades
        this.entityManager.clear();

        // Reinicia estatísticas
        this.statsManager.initStats();

        // Reinicia configurações
        this.controlSystem.updateFromControls();

        // Inicializa ambiente
        this.setup();
    }
    
    /**
     * Carrega um estado salvo
     * @param {Object} state - Estado a ser carregado
     */
    loadState(state) {
        this.entityManager.bacteria = state.bacteria.map(b => 
            new Bacteria(b.position.x, b.position.y, b.dna)
        );
        
        this.entityManager.food = state.food.map(f =>
            new Food(f.position.x, f.position.y, f.nutrition)
        );
        
        this.entityManager.obstacles = state.obstacles.map(o =>
            new Obstacle(o.x, o.y, o.w, o.h)
        );
        
        this.statsManager.stats = state.stats;
    }
    
    /**
     * Configura o estado inicial da simulação
     */
    setup() {
        // Adiciona mais comida inicial
        for (let i = 0; i < 80; i++) {
            this.entityManager.addFood(
                random(this.width),
                random(this.height),
                this.entityManager.foodValue
            );
        }

        // Adiciona obstáculos iniciais
        this.entityManager.generateObstacles(this.maxObstacles);
    }
    
    /**
     * Inicializa a simulação
     */
    init() {
        // Inicializa arrays através do entityManager
        this.entityManager.clear();
        
        // Cria predadores iniciais
        for (let i = 0; i < 2; i++) {
            const predator = new Predator(random(this.width), random(this.height));
            predator.simulation = this;
            this.entityManager.predators.push(predator);
        }

        // Cria comida inicial
        const state = this.controls.getState();
        this.entityManager.generateFood(state.foodSpawnAmount * 3); // 3x mais comida inicial

        // Cria obstáculos
        this.entityManager.generateObstacles(state.maxObstacles);

        // Inicializa estatísticas
        this.statsManager.initStats();
    }
}

// Exportando a classe para uso global
window.Simulation = Simulation; 