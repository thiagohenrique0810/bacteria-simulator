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
        
        // Propriedades para interação do mouse
        this.selectedBacteria = null;
        this.isDragging = false;
        this.isPlacingObstacle = false;
        this.obstacleStart = null;
        this.effects = []; // Para efeitos visuais
        
        // Propriedades para visualização
        this.zoom = 1.0;
        this.showTrails = true;
        this.trailOpacity = 0.6;
        this.trailLength = 30;
        this.showGender = true;
        this.showEnergy = true;
        
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
     * @param {number} deltaTime - Tempo desde último frame
     */
    update(deltaTime = 1) {
        try {
            // Incrementa contador de frames
            this.frameCount++;
            
            // Loga status a cada 60 frames
            const shouldLog = (this.frameCount % 60) === 0;
            
            // Verifica referências para depuração
            if (!this.entityManager) {
                console.error("EntityManager não inicializado!");
                return;
            }
            
            // Alterna pausar com a tecla 'P' ou Espaço
            if (keyIsDown(80) && !this.lastPauseKeyState) {
                this.isPaused = !this.isPaused;
                console.log(`Simulação ${this.isPaused ? 'pausada' : 'retomada'}`);
            }
            this.lastPauseKeyState = keyIsDown(80);
            
            // Se a simulação estiver pausada, não atualiza
            if (this.isPaused) {
                // Atualiza apenas a visualização quando pausado
                if (this.visualization) {
                    this.visualization.update();
                }
                return;
            }
            
            // SOLUÇÃO RADICAL: Forçar movimento de todas as bactérias periodicamente
            if (this.frameCount % 10 === 0) { // A cada 10 frames
                this.forceMoveBacteria();
            }
            
            // Atualiza a contagem de tempo
            this.timePassed += deltaTime / 60; // Converte para segundos se deltaTime for em frames
            
            // Atualiza a grade espacial
            if (this.spatialGrid && typeof this.spatialGrid.update === 'function') {
                this.spatialGrid.update();
            }
            
            // Atualiza o gerenciador de entidades
            if (this.entityManager && typeof this.entityManager.update === 'function') {
                this.entityManager.update(deltaTime);
            }
            
            // Gera comida periodicamente se tiver poucos itens
            if (this.autoFoodGeneration && this.foodGenerationRate > 0) {
                this.foodTimer += deltaTime;
                if (this.foodTimer >= this.foodGenerationInterval) {
                    const currentFoodCount = this.entityManager.food ? this.entityManager.food.length : 0;
                    if (currentFoodCount < this.maxFood) {
                        const amountToGenerate = Math.min(
                            this.foodGenerationRate,
                            this.maxFood - currentFoodCount
                        );
                        this.entityManager.generateFood(amountToGenerate);
                        if (shouldLog) {
                            console.log(`Geradas ${amountToGenerate} unidades de comida. Total: ${currentFoodCount + amountToGenerate}`);
                        }
                    }
                    this.foodTimer = 0;
                }
            }
            
            // Atualiza a visualização
            if (this.visualization) {
                this.visualization.update();
            }
            
            // Atualiza as estatísticas
            if (this.statsManager) {
                this.statsManager.update();
            }
            
            // Verifica se deve registrar população a cada 5 segundos (300 frames a 60fps)
            if (this.frameCount % 300 === 0) {
                this.recordPopulation();
            }
            
            // Debug para monitorar movimento das bactérias a cada 60 frames
            if (shouldLog) {
                this.logBacteriaStatus();
            }
            
        } catch (error) {
            console.error("Erro ao atualizar simulação:", error);
        }
    }
    
    /**
     * SOLUÇÃO RADICAL: Força todas as bactérias a se moveram
     * Isso é usado para garantir que o movimento está funcionando
     */
    forceMoveBacteria() {
        if (!this.entityManager || !this.entityManager.bacteria || this.entityManager.bacteria.length === 0) {
            return;
        }
        
        let movingCount = 0;
        
        // Itera por todas as bactérias e força movimento
        this.entityManager.bacteria.forEach((bacteria, index) => {
            if (!bacteria || !bacteria.pos) return;
            
            try {
                // Se não tem componente de movimento, cria um
                if (!bacteria.movement) {
                    bacteria.movement = new BacteriaMovement(bacteria);
                }
                
                // Armazena posição anterior
                const prevX = bacteria.pos.x;
                const prevY = bacteria.pos.y;
                
                // Força movimento direto com o método que implementamos
                bacteria.movement.moveRandom(1, 1.5);
                
                // Verifica se realmente se moveu
                const dx = bacteria.pos.x - prevX;
                const dy = bacteria.pos.y - prevY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 0.5) {
                    movingCount++;
                }
            } catch (error) {
                console.error(`Erro ao forçar movimento da bactéria ${index}:`, error);
            }
        });
        
        // Loga a cada 60 frames
        if (this.frameCount % 60 === 0) {
            console.log(`Movimento forçado: ${movingCount}/${this.entityManager.bacteria.length} bactérias se movendo`);
        }
    }
    
    /**
     * Registra informações de depuração sobre as bactérias
     */
    logBacteriaStatus() {
        if (!this.entityManager || !this.entityManager.bacteria) return;
        
        const total = this.entityManager.bacteria.length;
        if (total === 0) {
            console.log("Não há bactérias na simulação.");
            return;
        }
        
        let movingCount = 0;
        let withMovementComponent = 0;
        let healthyCount = 0;
        
        // Verifica cada bactéria
        this.entityManager.bacteria.forEach(bacteria => {
            if (!bacteria) return;
            
            // Verifica se tem componente de movimento
            if (bacteria.movement) {
                withMovementComponent++;
            }
            
            // Verifica se está se movendo
            if (bacteria.lastPos) {
                const dx = bacteria.pos.x - bacteria.lastPos.x;
                const dy = bacteria.pos.y - bacteria.lastPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 0.1) {
                    movingCount++;
                }
            }
            
            // Registra posição atual para próxima verificação
            bacteria.lastPos = {x: bacteria.pos.x, y: bacteria.pos.y};
            
            // Verifica saúde
            if (bacteria.health && bacteria.health > 0) {
                healthyCount++;
            }
        });
        
        console.log(`---- STATUS DAS BACTÉRIAS ----`);
        console.log(`Total: ${total}`);
        console.log(`Com componente de movimento: ${withMovementComponent} (${Math.round(withMovementComponent/total*100)}%)`);
        console.log(`Em movimento: ${movingCount} (${Math.round(movingCount/total*100)}%)`);
        console.log(`Saudáveis: ${healthyCount} (${Math.round(healthyCount/total*100)}%)`);
        console.log(`---------------------------`);
    }
    
    /**
     * Desenha a simulação
     */
    draw() {
        // Desenha o fundo
        this.renderSystem.drawBackground();
        
        // Desenha os obstáculos
        this.renderSystem.drawObstacles();
        
        // Desenha a comida
        this.renderSystem.drawFood();
        
        // Desenha as bactérias mortas
        this.entityManager.drawDeadBacteria();
        
        // Desenha as bactérias
        this.renderSystem.drawBacteria();
        
        // Desenha os predadores
        this.renderSystem.drawPredators();
        
        // Desenha os efeitos visuais
        this.updateEffects();
        this.drawEffects();
        
        // Desenha as estatísticas
        this.statsManager.draw();
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

    /**
     * Atualiza os efeitos visuais
     */
    updateEffects() {
        // Atualiza e remove efeitos expirados
        if (this.effects) {
            for (let i = this.effects.length - 1; i >= 0; i--) {
                const effect = this.effects[i];
                const isAlive = effect.update();
                
                if (!isAlive) {
                    this.effects.splice(i, 1);
                }
            }
        }
    }

    /**
     * Desenha os efeitos visuais
     */
    drawEffects() {
        if (this.effects) {
            for (const effect of this.effects) {
                if (typeof effect.draw === 'function') {
                    effect.draw();
                }
            }
        }
    }

    /**
     * Força as bactérias a ficarem fora dos obstáculos
     * @param {Bacteria} bacteria - A bactéria a ser verificada
     */
    enforceObstacleBoundaries(bacteria) {
        if (!bacteria || !bacteria.pos) return;
        
        // Obtém os obstáculos
        const obstacles = this.obstacles || this.entityManager.obstacles;
        if (!obstacles || obstacles.length === 0) return;
        
        let wasInObstacle = false;
        
        // Verifica cada obstáculo
        for (let obstacle of obstacles) {
            if (!(obstacle instanceof window.Obstacle)) continue;
            
            // Verifica se a bactéria está no obstáculo e a força para fora se necessário
            const pushed = obstacle.pushEntityOut(bacteria, bacteria.size * 0.8);
            
            if (pushed) {
                wasInObstacle = true;
                
                // Reduz a velocidade moderadamente - antes era 0.1 (muito agressivo)
                if (bacteria.movement) {
                    if (bacteria.movement.velocity) {
                        bacteria.movement.velocity.mult(0.6);
                        
                        // Garante que a velocidade não fique abaixo de um mínimo
                        if (bacteria.movement.velocity.mag() < 0.5) {
                            // Calcula direção de fuga do obstáculo
                            const obstacleCenter = createVector(
                                obstacle.x + obstacle.w/2,
                                obstacle.y + obstacle.h/2
                            );
                            const escapeDir = p5.Vector.sub(bacteria.pos, obstacleCenter);
                            escapeDir.normalize();
                            escapeDir.mult(0.8); // Velocidade mínima
                            
                            // Adiciona essa direção à velocidade atual
                            bacteria.movement.velocity.add(escapeDir);
                        }
                    } else if (bacteria.velocity) {
                        bacteria.velocity.mult(0.6);
                        
                        // Garante velocidade mínima
                        if (bacteria.velocity.mag() < 0.5) {
                            const escapeDir = p5.Vector.random2D();
                            escapeDir.mult(0.8);
                            bacteria.velocity.add(escapeDir);
                        }
                    }
                    
                    // Força o valor de colisão no sistema de colisão da bactéria se disponível
                    if (bacteria.movement.collision) {
                        bacteria.movement.collision.isColliding = true;
                    }
                    
                    // Adiciona um componente aleatório para evitar ficar preso em situações estáticas
                    if (bacteria.movement.applyForce) {
                        const randomForce = p5.Vector.random2D();
                        randomForce.mult(0.3);
                        bacteria.movement.applyForce(randomForce);
                    }
                }
                
                // Log de depuração (reduzida frequência)
                if (frameCount % 300 === 0) {
                    console.log(`Obstáculo [${obstacle.x},${obstacle.y},${obstacle.w},${obstacle.h}] removeu bactéria ${bacteria.id || 'desconhecida'} [${bacteria.pos.x.toFixed(1)},${bacteria.pos.y.toFixed(1)}]`);
                }
            }
        }
        
        // Se a bactéria estava em um obstáculo, registra apenas ocasionalmente para evitar spam no console
        if (wasInObstacle && frameCount % 180 === 0) {
            console.log(`Bactéria ${bacteria.id || 'desconhecida'} forçada para fora de obstáculo durante atualização da simulação`);
        }
    }

    /**
     * Configura os callbacks para os controles
     */
    setupControlCallbacks() {
        if (!this.controlSystem) {
            console.error('❌ ERRO: controlSystem não está definido na simulação');
            return;
        }
        
        console.log('🔄 Configurando callbacks para controles...');
        
        const callbacks = {
            onReset: () => this.reset(),
            onPauseToggle: () => this.togglePause(),
            onSpeedChange: (value) => this.setSimulationSpeed(value),
            onAddBacteria: (count, femaleRatio) => {
                console.log(`🦠 Callback onAddBacteria chamado: ${count} bactérias, ${femaleRatio}% fêmeas`);
                console.log(`🔍 EntityManager existe? ${!!this.entityManager}`);
                console.log(`🔍 Método addMultipleBacteria existe? ${!!this.entityManager?.addMultipleBacteria}`);
                
                // Verifica se a classe Bacteria está disponível
                console.log(`🔍 Classe Bacteria existe? ${typeof Bacteria === 'function'}`);
                console.log(`🔍 Classe window.Bacteria existe? ${typeof window.Bacteria === 'function'}`);
                
                if (typeof Bacteria !== 'function' && typeof window.Bacteria === 'function') {
                    console.log('⚠️ Classe Bacteria não está disponível diretamente, mas está no objeto window. Definindo globalmente...');
                    window.Bacteria = window.Bacteria;
                }
                
                // Tenta criar uma única bactéria para teste
                try {
                    console.log('🧪 Tentando criar uma bactéria de teste...');
                    const testBacteria = new (window.Bacteria || Bacteria)({
                        x: width/2,
                        y: height/2,
                        isFemale: true
                    });
                    console.log(`✅ Bactéria de teste criada com sucesso: ${!!testBacteria}`);
                    
                    // Se a criação for bem-sucedida e o EntityManager ainda não tiver o método,
                    // tenta adicionar a bactéria diretamente
                    if (testBacteria && this.entityManager && !this.entityManager.addMultipleBacteria) {
                        console.log('🔄 EntityManager sem método addMultipleBacteria, tentando adicionar a bactéria diretamente...');
                        this.entityManager.bacteria = this.entityManager.bacteria || [];
                        this.entityManager.bacteria.push(testBacteria);
                        console.log(`✅ Bactéria adicionada diretamente ao array: ${this.entityManager.bacteria.length} bactérias total`);
                        
                        // Cria um método temporário
                        this.entityManager.addMultipleBacteria = function(count, femaleRatio) {
                            console.log(`🔄 Método temporário addMultipleBacteria chamado: ${count} bactérias`);
                            
                            for (let i = 0; i < count; i++) {
                                try {
                                    const isFemale = (i / count) < (femaleRatio / 100);
                                    const bact = new (window.Bacteria || Bacteria)({
                                        x: random(width * 0.1, width * 0.9),
                                        y: random(height * 0.1, height * 0.9),
                                        isFemale: isFemale
                                    });
                                    
                                    if (bact) {
                                        this.bacteria.push(bact);
                                        console.log(`✅ Bactéria ${i+1} adicionada com sucesso`);
                                    }
                                } catch (e) {
                                    console.error(`❌ Erro ao criar bactéria ${i+1}:`, e);
                                }
                            }
                            
                            return this.bacteria.length;
                        };
                        
                        console.log('✅ Método temporário addMultipleBacteria criado com sucesso');
                    }
                } catch (error) {
                    console.error('❌ Erro ao criar bactéria de teste:', error);
                }
                
                if (this.entityManager && this.entityManager.addMultipleBacteria) {
                    console.log('🔄 Chamando entityManager.addMultipleBacteria()...');
                    this.entityManager.addMultipleBacteria(count, femaleRatio);
                    console.log('✅ Método addMultipleBacteria executado');
                } else {
                    console.error('❌ ERRO: Não foi possível adicionar bactérias - método não disponível');
                }
            },
            onPopulationLimitChange: (value) => this.setPopulationLimit(value),
            onInitialEnergyChange: (value) => this.setInitialEnergy(value),
            onLifespanChange: (value) => this.setLifespan(value),
            onHealthLossChange: (value) => this.setHealthLossRate(value),
            onFeedingIntervalChange: (value) => this.setFeedingInterval(value),
            onMutationRateChange: (value) => this.setMutationRate(value),
            onFemaleRatioChange: (value) => this.setFemaleRatio(value),
            onFoodSpawnRateChange: (value) => this.setFoodSpawnRate(value),
            
            // Novas callbacks para controles visuais
            onShowTrailsChange: (checked) => {
                this.showTrails = checked;
                console.log(`Trilhas ${checked ? 'ativadas' : 'desativadas'}`);
            },
            onTrailOpacityChange: (value) => {
                this.trailOpacity = value;
                console.log(`Opacidade das trilhas definida para ${value}`);
            },
            onTrailLengthChange: (value) => {
                this.trailLength = value;
                console.log(`Comprimento das trilhas definido para ${value}`);
            },
            onBacteriaTypesChange: (distribution) => {
                if (window.BacteriaVisualizationComponent && 
                    typeof BacteriaVisualizationComponent.setTypeDistribution === 'function') {
                    BacteriaVisualizationComponent.setTypeDistribution(distribution);
                    console.log("Distribuição de tipos de bactérias atualizada:", distribution);
                } else {
                    console.warn("Componente de visualização de bactérias não disponível");
                }
            }
        };
        
        console.log('🔄 Passando callbacks para o controlSystem...');
        this.controlSystem.setupEventListeners(callbacks);
        console.log('✅ Callbacks configurados com sucesso');
    }
    
    /**
     * Após inicializar a simulação, configura funcionalidades adicionais
     */
    postInitialize() {
        // Configura os callbacks para os controles
        if (!this.controlSystem) {
            console.error("❌ ERRO: controlSystem não encontrado na simulação");
            
            // Tenta criar o controlSystem se não existir
            if (typeof SimulationControlSystem === 'function') {
                console.log("⚠️ Recriando controlSystem...");
                this.controlSystem = new SimulationControlSystem(this);
            } else {
                console.error("❌ ERRO CRÍTICO: SimulationControlSystem não está disponível globalmente");
                return;
            }
        }
        
        console.log("🔄 Configura callbacks e event listeners para controles");
        
        // Primeiro configura os callbacks
        this.setupControlCallbacks();
        
        // Então configura os event listeners - necessário para conectar o botão "Adicionar Bactérias"
        if (typeof this.controlSystem.setupEventListeners === 'function') {
            console.log("🔄 Configurando event listeners específicos para o sistema de controle");
            
            // Preparar callbacks básicos se não foram configurados anteriormente
            const callbacks = {
                onAddBacteria: (count, femaleRatio) => {
                    console.log(`📣 Callback onAddBacteria chamado: ${count} bactérias, ${femaleRatio}% fêmeas`);
                    if (this.entityManager && typeof this.entityManager.addMultipleBacteria === 'function') {
                        this.entityManager.addMultipleBacteria(count, femaleRatio);
                    }
                }
            };
            
            // Configurar os event listeners
            this.controlSystem.setupEventListeners(callbacks);
            console.log("✅ Event listeners configurados com sucesso");
        } else {
            console.error("❌ ERRO: Método setupEventListeners não encontrado no controlSystem");
        }
        
        // Inicializa outras configurações
        console.log("✅ Simulação inicializada completamente");
    }
    
    /**
     * Alterna entre pausar e continuar a simulação
     */
    togglePause() {
        this.isRunning = !this.isRunning;
        console.log(`Simulação ${this.isRunning ? 'continuada' : 'pausada'}`);
    }
    
    /**
     * Define a velocidade da simulação
     * @param {number} speed - Nova velocidade da simulação
     */
    setSimulationSpeed(speed) {
        this.simulationSpeed = speed;
        console.log(`Velocidade da simulação definida para ${speed}`);
    }
    
    /**
     * Define o limite de população
     * @param {number} limit - Novo limite de população
     */
    setPopulationLimit(limit) {
        if (this.entityManager) {
            this.entityManager.populationLimit = limit;
            console.log(`Limite de população definido para ${limit}`);
        }
    }
}

// Exportando a classe para uso global
window.Simulation = Simulation; 