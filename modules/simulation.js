/**
 * Sistema principal de simulação
 */
class Simulation {
    /**
     * Inicializa o sistema de simulação
     */
    constructor(canvas) {
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
        this.initialEnergy = 150;
        this.foodValue = 50;
        this.foodRate = 0.8;
        this.foodSpawnInterval = 3;
        this.foodSpawnAmount = 8;
        
        // Sistema de particionamento espacial
        this.spatialGrid = new SpatialGrid(this.width, this.height, 50); // Células de 50px
        
        // Flag para indicar ciclo dia/noite
        this.dayNightEnabled = true;
        this.dayTime = true; // True = dia, False = noite
        this.dayLength = 3600; // Frames por ciclo (1min em 60fps)
        this.currentTime = 0;

        // Entidades
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];
        this.predators = [];
        this.effects = [];

        // Estatísticas
        this.initStats();

        // Configuração dos controles - Movido para depois da inicialização do p5.js
        if (typeof createDiv === 'function') {
            this.setupControls();
        } else {
            console.warn('p5.js não está pronto ainda. Os controles serão inicializados posteriormente.');
            window.addEventListener('load', () => {
                this.setupControls();
            });
        }
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
            naturalBirths: 0,     // Nascimentos por reprodução natural
            matingAttempts: 0,    // Tentativas de acasalamento
            successfulMatings: 0,  // Acasalamentos bem-sucedidos
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0,
            averageHealth: 0,
            totalChildren: 0,
            averageReward: 0,
            explorationRate: 0,
            learningProgress: 0,
            initialPopulation: 0,
            currentPopulation: 0,
            foodEaten: 0,
            successfulMates: 0,
            predatorKills: 0,
            escapes: 0
        };
    }

    /**
     * Configura os callbacks dos controles
     */
    setupControls() {
        if (!this.controls) return;

        // Cria o container de controles se ainda não existir
        if (!this.controlsContainer) {
            this.controlsContainer = createDiv();
            this.controlsContainer.id('predator-controls-container');
            this.controlsContainer.style('position', 'fixed');
            this.controlsContainer.style('top', '0');
            this.controlsContainer.style('right', '0');
            this.controlsContainer.style('width', '250px');
            this.controlsContainer.style('height', '100%');
            this.controlsContainer.style('background-color', 'rgba(35, 35, 40, 0.9)');
            this.controlsContainer.style('padding', '10px');
            this.controlsContainer.style('border-left', '1px solid rgba(60,60,70,0.8)');
            this.controlsContainer.style('box-shadow', '-2px 0 10px rgba(0,0,0,0.2)');
            this.controlsContainer.style('overflow-y', 'auto');
            this.controlsContainer.style('z-index', '1000');
            this.controlsContainer.style('display', 'flex');
            this.controlsContainer.style('flex-direction', 'column');
            this.controlsContainer.style('color', '#e0e0e0');
            document.body.appendChild(this.controlsContainer.elt);
            
            // Adiciona título
            const title = createDiv('Controles do Simulador');
            title.parent(this.controlsContainer);
            title.style('font-size', '16px');
            title.style('font-weight', 'bold');
            title.style('margin-bottom', '15px');
            title.style('text-align', 'center');
            title.style('padding-bottom', '5px');
            title.style('border-bottom', '1px solid rgba(100,100,120,0.5)');
        }

        // Inicializa os controles dos predadores
        if (!this.predatorControls) {
            this.predatorControls = new window.PredatorControls(this.controlsContainer);
            this.predatorControls.setupEventListeners({
                onChange: (state) => this.updateFromControls()
            });
        }

        this.controls.setCallbacks({
            onPauseToggle: (isPaused) => {
                this.paused = isPaused;
                console.log('Simulação ' + (isPaused ? 'pausada' : 'continuando'));
            },
            onReset: () => {
                this.reset();
                console.log('Simulação reiniciada');
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
            onSpeedChange: (value) => {
                this.speed = value;
                console.log('Velocidade alterada para:', value);
            },
            onLifespanChange: (value) => {
                // value está em segundos
                this.lifespan = value;
                console.log('Tempo de vida alterado para:', value);
            },
            onHealthLossChange: (value) => {
                this.healthLossRate = value;
                console.log('Taxa de perda de saúde alterada para:', value);
            },
            onFeedingIntervalChange: (value) => {
                // value está em segundos
                this.feedingInterval = value;
                console.log('Intervalo de alimentação alterado para:', value);
            },
            onClearFood: () => {
                this.food = [];
                console.log('Comida removida');
            },
            onClearObstacles: () => {
                console.log('Removendo obstáculos...');
                console.log('Quantidade antes:', this.obstacles.length);
                
                // Limpa completamente o array de obstáculos
                this.obstacles = [];
                
                // Garante que não há referências antigas
                this.maxObstacles = 0;
                
                // Força atualização do slider
                if (this.controls?.environmentControls?.obstacleSlider) {
                    this.controls.environmentControls.obstacleSlider.value(0);
                }
                
                console.log('Quantidade depois:', this.obstacles.length);
                console.log('Obstáculos removidos');
                
                // Força uma atualização do estado e da visualização
                this.updateFromControls();
            },
            onForceReproduction: () => {
                console.log('Forçando reprodução...');
                
                // Conta quantas bactérias foram reproduzidas
                let reproductionCount = 0;
                
                // Cria uma cópia do array para evitar modificações durante o loop
                const bacteriaCopy = [...this.bacteria];
                
                // Tenta reproduzir cada bactéria com a mais próxima compatível
                for (let i = 0; i < bacteriaCopy.length; i++) {
                    const b1 = bacteriaCopy[i];
                    
                    // Pula se já está no limite de população
                    if (this.bacteria.length >= this.populationLimit) {
                        console.log('Limite de população atingido');
                        break;
                    }
                    
                    // Encontra o parceiro mais próximo compatível
                    let closestPartner = null;
                    let minDist = Infinity;
                    
                    for (let j = 0; j < bacteriaCopy.length; j++) {
                        if (i === j) continue;
                        
                        const b2 = bacteriaCopy[j];
                        const d = dist(b1.pos.x, b1.pos.y, b2.pos.x, b2.pos.y);
                        
                        // Verifica compatibilidade (macho e fêmea)
                        if (b1.isFemale !== b2.isFemale && d < minDist) {
                            closestPartner = b2;
                            minDist = d;
                        }
                    }
                    
                    // Se encontrou parceiro, força a reprodução
                    if (closestPartner) {
                        // Restaura energia para permitir reprodução
                        b1.energy = 100;
                        closestPartner.energy = 100;
                        
                        // Tenta reproduzir
                        if (b1.mate(closestPartner)) {
                            reproductionCount++;
                            this.stats.successfulMatings++;
                            
                            // Cria o filho imediatamente
                            const mother = b1.isFemale ? b1 : closestPartner;
                            const father = b1.isFemale ? closestPartner : b1;
                            
                            // Posição média entre os pais
                            const childX = (mother.pos.x + father.pos.x) / 2;
                            const childY = (mother.pos.y + father.pos.y) / 2;
                            
                            // Cria nova bactéria com DNA combinado
                            const childDNA = mother.reproduction.giveBirth();
                            const child = this.addBacteria(childX, childY, childDNA);
                            
                            // Aplica mutação com chance de 10%
                            if (random() < 0.1) {
                                child.dna.mutate();
                                this.stats.mutations++;
                            }
                            
                            this.stats.births++;
                            this.stats.naturalBirths++;
                        }
                    }
                }
                
                console.log(`Reprodução forçada concluída. ${reproductionCount} novos filhos gerados.`);
            },
            onChange: (state) => {
                this.updateFromControls();
            }
        });
    }

    /**
     * Atualiza configurações baseado nos controles
     */
    updateFromControls() {
        if (!this.controls) return;

        const state = this.controls.getState();
        const oldSpeed = this.speed;
        const oldFoodRate = this.foodRate;
        const oldFoodValue = this.foodValue;
        const oldMaxObstacles = this.maxObstacles;
        
        // Atualiza configurações com validação
        this.speed = Math.max(0.1, Math.min(5, state.simulationSpeed || 1));
        this.populationLimit = Math.max(20, Math.min(200, state.populationLimit || 100));
        this.initialEnergy = Math.max(50, Math.min(150, state.initialEnergy || 150));
        this.foodValue = Math.max(10, Math.min(50, state.foodValue || 50));
        this.foodRate = Math.max(0, Math.min(1, state.foodRate || 0.8));
        this.maxObstacles = Math.max(0, Math.min(20, state.maxObstacles || 0));
        this.foodSpawnInterval = Math.max(1, Math.min(10, state.foodSpawnInterval || 3));
        this.foodSpawnAmount = Math.max(1, Math.min(10, state.foodSpawnAmount || 8));
        
        // Atualiza visualização
        this.showTrails = state.showTrails || false;
        this.showEnergy = state.showEnergy || true;
        this.showGender = state.showGender || true;
        this.zoom = Math.max(0.5, Math.min(2, state.zoom || 1));

        // Se o número de obstáculos mudou, atualiza
        if (oldMaxObstacles !== this.maxObstacles) {
            console.log('Atualizando obstáculos:', oldMaxObstacles, '->', this.maxObstacles);
            this.updateObstacles();
        }

        // Log das mudanças significativas
        if (oldSpeed !== this.speed) console.log('Velocidade atualizada:', this.speed);
        if (oldFoodRate !== this.foodRate) console.log('Taxa de comida atualizada:', this.foodRate);
        if (oldFoodValue !== this.foodValue) console.log('Valor nutricional atualizado:', this.foodValue);
        if (oldMaxObstacles !== this.maxObstacles) console.log('Número de obstáculos atualizado:', this.maxObstacles);

        // Atualiza os parâmetros dos predadores
        const predatorState = this.predatorControls.getState();
        
        // Atualiza os parâmetros de reprodução dos predadores
        this.predators.forEach(predator => {
            predator.canReproduce = predatorState.predatorReproductionEnabled;
            predator.reproductionEnergyCost = predatorState.predatorReproductionCost;
            predator.reproductionCooldown = predatorState.predatorReproductionCooldown;
            predator.minEnergyToReproduce = predatorState.predatorMinEnergy;
            predator.reproductionRange = predatorState.predatorReproductionRange;
            predator.mutationRate = predatorState.predatorMutationRate;
        });

        // Ajusta a quantidade de predadores com base no limite
        const predatorLimit = predatorState.predatorLimit;
        while (this.predators.length > predatorLimit) {
            this.predators.pop();
        }
        while (this.predators.length < predatorLimit) {
            const x = random(width);
            const y = random(height);
            this.predators.push(new Predator(x, y));
        }
    }

    /**
     * Atualiza obstáculos baseado no controle
     */
    updateObstacles() {
        console.log('Atualizando obstáculos...');
        console.log('Quantidade atual:', this.obstacles.length);
        console.log('Quantidade alvo:', this.maxObstacles);

        const currentCount = this.obstacles.length;
        const targetCount = this.maxObstacles;

        // Se o alvo for 0, remove todos os obstáculos
        if (targetCount === 0) {
            this.obstacles = [];
            console.log('Todos os obstáculos removidos');
            return;
        }

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
            console.log('Obstáculos adicionados:', targetCount - currentCount);
        } else if (currentCount > targetCount) {
            // Remove obstáculos
            this.obstacles.splice(targetCount);
            console.log('Obstáculos removidos:', currentCount - targetCount);
        }

        console.log('Quantidade final:', this.obstacles.length);
    }

    /**
     * Atualiza o grid espacial com todas as entidades
     */
    updateSpatialGrid() {
        this.spatialGrid.clear();
        
        // Adiciona todas as bactérias ao grid
        for (let bacteria of this.bacteria) {
            this.spatialGrid.insert(bacteria);
        }
        
        // Adiciona todos os predadores ao grid
        for (let predator of this.predators) {
            this.spatialGrid.insert(predator);
        }
        
        // Adiciona toda a comida ao grid
        for (let food of this.food) {
            this.spatialGrid.insert(food);
        }
        
        // Adiciona todos os obstáculos ao grid
        for (let obstacle of this.obstacles) {
            this.spatialGrid.insert(obstacle);
        }
    }
    
    /**
     * Atualiza ciclo dia/noite
     */
    updateDayNightCycle() {
        if (!this.dayNightEnabled) return;
        
        this.currentTime = (this.currentTime + 1) % this.dayLength;
        if (this.currentTime === 0) {
            this.dayTime = !this.dayTime;
            console.log(`Agora é ${this.dayTime ? 'dia' : 'noite'}`);
        }
    }

    /**
     * Atualiza a simulação
     */
    update() {
        if (this.paused) return;

        // Atualiza controles e obtém o estado atual
        this.updateFromControls();
        const state = this.controls.getState();
        
        // Atualiza ciclo dia/noite
        this.updateDayNightCycle();

        // Calcula o número de atualizações baseado na velocidade
        const updates = Math.ceil(this.speed); // Número de atualizações por frame

        // Atualiza o grid espacial com entidades
        this.updateSpatialGrid();

        // Executa as atualizações
        for (let u = 0; u < updates; u++) {
            // Atualiza bactérias
            for (let i = this.bacteria.length - 1; i >= 0; i--) {
                const bacteria = this.bacteria[i];
                
                // Atualiza valores baseados nos controles com valores mínimos mais favoráveis
                bacteria.healthLossRate = Math.min(state.healthLossRate || 0.05, 0.1);
                bacteria.starvationTime = Math.max((state.feedingInterval || 30) * 60, 1800);
                bacteria.maxEnergy = Math.max(state.initialEnergy || 150, 100);
                
                // Busca entidades próximas usando o grid espacial
                const perceptionRadius = bacteria.perceptionRadius || 150;
                const nearbyEntities = this.spatialGrid.queryRadius(bacteria.pos, perceptionRadius);
                
                // Separa entidades por tipo
                const nearbyFood = nearbyEntities.filter(e => e instanceof Food);
                const nearbyPredators = nearbyEntities.filter(e => e instanceof Predator);
                const nearbyBacteria = nearbyEntities.filter(e => e instanceof Bacteria && e !== bacteria);
                
                // Atualiza bactéria com as entidades próximas ao invés de todas as entidades
                const deltaTime = 1 / (60 * updates);
                const child = bacteria.update(
                    nearbyFood, 
                    nearbyPredators,
                    this.obstacles,
                    nearbyBacteria,
                    deltaTime
                );
                
                // Adiciona efeito do ciclo dia/noite ao comportamento
                if (this.dayNightEnabled) {
                    bacteria.isDaytime = this.dayTime;
                    // Durante a noite, movimento mais lento e menos energia gasta
                    if (!this.dayTime) {
                        bacteria.movement.speed *= 0.7;
                        bacteria.healthLossRate *= 0.8;
                    }
                }
                
                // Adiciona filho se houver e respeita o limite de população
                if (child && this.bacteria.length < this.populationLimit) {
                    child.energy = this.initialEnergy;
                    this.bacteria.push(child);
                    this.stats.births++;
                }
                
                // Remove se morta
                if (bacteria.isDead()) {
                    this.stats.deaths++;
                    bacteria.dispose();
                    this.bacteria.splice(i, 1);
                }
            }

            // Atualiza predadores com otimização similar
            for (let i = this.predators.length - 1; i >= 0; i--) {
                const predator = this.predators[i];
                const perceptionRadius = predator.perceptionRadius || 200;
                const nearbyEntities = this.spatialGrid.queryRadius(predator.pos, perceptionRadius);
                
                const nearbyBacteria = nearbyEntities.filter(e => e instanceof Bacteria);
                const nearbyObstacles = this.obstacles; // Obstáculos são poucos, manter todos
                const nearbyPredators = nearbyEntities.filter(e => e instanceof Predator && e !== predator);
                
                const deltaTime = 1 / (60 * updates);
                const child = predator.update(nearbyBacteria, nearbyObstacles, nearbyPredators, deltaTime);
                
                // Adiciona novo predador se houver reprodução
                if (child) {
                    this.predators.push(child);
                }
                
                if (predator.isDead()) {
                    predator.dispose();
                    this.predators.splice(i, 1);
                }
            }

            // Verifica interações com otimização de colisão
            this.checkInteractionsOptimized();

            // Gera nova comida com mais frequência
            if (frameCount % Math.max(1, Math.round(state.foodSpawnInterval * 30 / this.speed)) === 0) {
                if (random() < this.foodRate) {
                    this.generateFood(this.foodSpawnAmount);
                }
            }
            
            // Implementa recursos limitados - comida tem tempo de vida e regeneração
            if (this.food.length > 0) {
                let maxFood = state.foodLimit || 200;
                
                // Remove comida excedente (começa pelas mais antigas)
                if (this.food.length > maxFood) {
                    this.food.splice(0, this.food.length - maxFood);
                }
                
                // Comida se regenera lentamente
                for (let food of this.food) {
                    if (food.nutrition < 50) {
                        food.nutrition += 0.01;
                        food.size = map(food.nutrition, 10, 50, 5, 15);
                    }
                }
            }
        }
        
        // Atualiza estatísticas
        this.updateStats();
    }
    
    /**
     * Versão otimizada da verificação de interações
     */
    checkInteractionsOptimized() {
        // Verifica interações bactéria-comida
        for (let i = this.bacteria.length - 1; i >= 0; i--) {
            const bacteria = this.bacteria[i];
            
            // Usa o grid para verificar apenas comida próxima
            const nearbyFood = this.spatialGrid.queryRadius(bacteria.pos, bacteria.size + 10);
            const food = nearbyFood.filter(e => e instanceof Food);
            
            for (let j = food.length - 1; j >= 0; j--) {
                const f = food[j];
                const d = dist(bacteria.pos.x, bacteria.pos.y, f.position.x, f.position.y);
                
                if (d < bacteria.size / 2 + f.size / 2) {
                    // Bactéria come a comida
                    bacteria.eat(f);
                    this.stats.foodConsumed++;
                    
                    // Comida é consumida parcialmente ou totalmente
                    f.nutrition -= 10;
                    if (f.nutrition <= 0) {
                        const index = this.food.indexOf(f);
                        if (index > -1) {
                            this.food.splice(index, 1);
                        }
                    } else {
                        // Atualiza tamanho baseado na nutrição restante
                        f.size = map(f.nutrition, 10, 50, 5, 15);
                    }
                }
            }
        }
        
        // Interações bactéria-bactéria (reprodução)
        for (let i = 0; i < this.bacteria.length; i++) {
            const bacteria = this.bacteria[i];
            if (!bacteria.reproduction || !bacteria.reproduction.canMateNow()) continue;
            
            // Usa o grid para verificar apenas bactérias próximas
            const nearbyEntities = this.spatialGrid.queryRadius(bacteria.pos, 50);
            const nearbyBacteria = nearbyEntities.filter(e => 
                e instanceof Bacteria && e !== bacteria
            );
            
            for (let otherBacteria of nearbyBacteria) {
                if (!otherBacteria.reproduction) continue;
                
                const d = dist(bacteria.pos.x, bacteria.pos.y, otherBacteria.pos.x, otherBacteria.pos.y);
                if (d < bacteria.size + otherBacteria.size) {
                    this.stats.matingAttempts++;
                    
                    // Tenta acasalar
                    const success = bacteria.reproduction.mate(otherBacteria.reproduction);
                    if (success) {
                        this.stats.successfulMatings++;
                        break; // Apenas um acasalamento por frame
                    }
                }
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

        // Variáveis para médias
        let totalHealth = 0;
        let totalReward = 0;
        let totalExplorationActions = 0;
        let totalQValues = 0;
        let totalQEntries = 0;

        // Calcula médias e contadores
        for (let bacteria of this.bacteria) {
            // Contagem por gênero
            if (bacteria.isFemale) {
                this.stats.femaleBacterias++;
            } else {
                this.stats.maleBacterias++;
            }

            // Contagem por estado
            if (bacteria.reproduction.isPregnant) {
                this.stats.pregnantBacterias++;
            }
            if (bacteria.states.getCurrentState() === 'resting') {
                this.stats.restingBacterias++;
            }
            if (bacteria.states.getEnergy() < 30) {
                this.stats.hungryBacterias++;
            }

            // Soma saúde para média
            totalHealth += bacteria.health;

            // Estatísticas do Q-Learning
            const reward = bacteria.calculateReward();
            totalReward += reward;

            // Conta ações de exploração (quando random < 0.1)
            if (random() < 0.1) {
                totalExplorationActions++;
            }

            // Calcula média dos Q-values
            for (let stateKey in bacteria.qLearning.qTable) {
                const qValues = Object.values(bacteria.qLearning.qTable[stateKey]);
                totalQValues += qValues.reduce((a, b) => a + b, 0);
                totalQEntries += qValues.length;
            }
        }

        // Calcula média de saúde
        this.stats.averageHealth = this.bacteria.length > 0 ? 
            totalHealth / this.bacteria.length : 0;

        // Atualiza geração mais alta
        for (let bacteria of this.bacteria) {
            if (bacteria.dna.generation > this.stats.highestGeneration) {
                this.stats.highestGeneration = bacteria.dna.generation;
            }
        }

        // Atualiza estatísticas do Q-Learning
        this.stats.averageReward = this.bacteria.length > 0 ? 
            totalReward / this.bacteria.length : 0;
        this.stats.explorationRate = this.bacteria.length > 0 ? 
            totalExplorationActions / this.bacteria.length : 0;
        this.stats.learningProgress = totalQEntries > 0 ? 
            totalQValues / totalQEntries : 0;
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
        text(`Fêmeas: ${this.stats.femaleBacterias}`, 10, y); y += 20;
        text(`Machos: ${this.stats.maleBacterias}`, 10, y); y += 20;
        text(`Grávidas: ${this.stats.pregnantBacterias}`, 10, y); y += 20;
        text(`Acasalamentos: ${this.stats.successfulMatings}`, 10, y); y += 20;
        text(`Nascimentos: ${this.stats.naturalBirths}`, 10, y); y += 20;
        text(`Mortes: ${this.stats.deaths}`, 10, y); y += 20;
        text(`Comida: ${this.stats.foodConsumed}`, 10, y);
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
        // Limpa entidades
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];
        this.predators = [];
        this.effects = [];

        // Reinicia estatísticas
        this.initStats();

        // Reinicia configurações
        this.paused = false;
        this.updateFromControls();

        // Inicializa população inicial
        this.initializePopulation();
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
     * Inicializa a simulação
     */
    setup() {
        // Adiciona bactérias iniciais com mais energia
        for (let i = 0; i < 20; i++) {
            this.addBacteria(
                random(this.width),
                random(this.height),
                new DNA(),
                this.initialEnergy
            );
        }

        // Adiciona mais comida inicial
        for (let i = 0; i < 80; i++) { // Aumentado de 50 para 80
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

    /**
     * Inicializa a simulação
     */
    init() {
        // Inicializa arrays
        this.bacteria = [];
        this.predators = [];
        this.food = [];
        this.obstacles = [];
        this.effects = [];

        const state = this.controls.getState();

        // Cria bactérias iniciais
        for (let i = 0; i < 20; i++) {
            this.bacteria.push(new Bacteria(
                random(this.width),
                random(this.height),
                new DNA(),
                state.initialEnergy
            ));
        }

        // Cria predadores iniciais
        for (let i = 0; i < 2; i++) { // Começa com 2 predadores
            this.predators.push(new Predator(random(this.width), random(height)));
        }

        // Cria comida inicial
        this.generateFood(state.foodSpawnAmount * 3); // 3x mais comida inicial

        // Cria obstáculos
        this.generateObstacles(state.maxObstacles);

        // Inicializa estatísticas
        this.initStats();
    }

    /**
     * Gera comida na simulação
     * @param {number} amount - Quantidade de comida para gerar
     */
    generateFood(amount) {
        for (let i = 0; i < amount; i++) {
            this.addFood(
                random(this.width),
                random(this.height),
                this.foodValue
            );
        }
    }

    /**
     * Gera obstáculos na simulação
     * @param {number} amount - Quantidade de obstáculos para gerar
     */
    generateObstacles(amount) {
        for (let i = 0; i < amount; i++) {
            this.obstacles.push(new Obstacle(
                random(this.width - 100),
                random(this.height - 100),
                random(20, 100),
                random(20, 100)
            ));
        }
    }

    /**
     * Adiciona um efeito visual
     * @param {Object} effect - Efeito a ser adicionado
     */
    addEffect(effect) {
        this.effects.push(effect);
    }
}

// Tornando a classe global
window.Simulation = Simulation; 