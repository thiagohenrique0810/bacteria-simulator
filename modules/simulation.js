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
        this.diseaseSystem = new DiseaseSystem(this); // Sistema de doenças

        // Configurações
        this.width = 800;
        this.height = 600;
        this.paused = false;
        this.speed = 1;
        this.zoom = 1;
        this.showTrails = false;
        this.showEnergy = true;
        this.showGender = true;
        this.showDiseaseEffects = true; // Nova opção para mostrar efeitos visuais de doenças
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
            escapes: 0,
            diseaseCases: 0,       // Total de casos de doenças
            diseaseDeaths: 0,      // Mortes por doenças
            immunityAcquired: 0,   // Imunidade adquirida
            diseaseSpreads: 0      // Total de contágios
        };
    }

    /**
     * Configura os callbacks dos controles
     */
    setupControls() {
        if (!this.controls) return;

        // Não criar mais o container de controles aqui, deixar para a classe Controls fazer isso
        
        this.controls.setCallbacks({
            onPauseToggle: (isPaused) => {
                this.paused = isPaused;
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
            },
            onAddBacteria: (count, femaleRatio) => {
                // Verifica se adicionar essas bactérias excederia o limite
                const newTotal = this.bacteria.length + Number(count);
                if (newTotal > this.populationLimit) {
                    // Mostra um alerta se exceder
                    alert(`Não é possível adicionar ${count} bactérias. Isso excederia o limite de população (${this.populationLimit}).`);
                    return;
                }
                
                // Primeira vez que bactérias são adicionadas?
                const firstTime = this.bacteria.length === 0;
                
                // Adiciona as bactérias com a proporção de fêmeas especificada
                this.addMultipleBacteria(Number(count), Number(femaleRatio));
                
                // Notificação de sucesso
                console.log(`Adicionadas ${count} bactérias (${femaleRatio}% fêmeas)`);
                
                // Exibe uma mensagem quando as primeiras bactérias são adicionadas
                if (firstTime) {
                    // Cria um elemento de notificação temporário
                    const notification = createDiv(`Simulação iniciada com ${count} bactérias!`);
                    notification.position(width/2 - 150, 100);
                    notification.style('background-color', 'rgba(65, 105, 225, 0.8)');
                    notification.style('color', 'white');
                    notification.style('padding', '15px 20px');
                    notification.style('border-radius', '8px');
                    notification.style('font-weight', 'bold');
                    notification.style('z-index', '1000');
                    notification.style('text-align', 'center');
                    notification.style('width', '300px');
                    notification.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.3)');
                    
                    // Remove a notificação após 5 segundos
                    setTimeout(() => {
                        notification.remove();
                    }, 5000);
                }
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
        this.populationLimit = Math.max(20, Math.min(500, state.populationLimit || 100));
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
        this.showDiseaseEffects = state.showDiseaseEffects || true;
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
        if (this.controls && this.controls.predatorControls && typeof this.controls.predatorControls.getState === 'function') {
            try {
                const predatorState = this.controls.predatorControls.getState();
                
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
            } catch (error) {
                console.warn("Erro ao atualizar parâmetros dos predadores:", error);
            }
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

        // Atualiza o tempo interno da simulação
        this.time += 1 * this.speed;
        
        // Atualiza o ciclo de dia e noite
        if (this.dayNightEnabled) {
            this.updateDayNightCycle();
        }

        // Atualiza o sistema de doenças
        this.diseaseSystem.update();
        
        // Atualiza o grid espacial
        this.updateSpatialGrid();
        
        // Gera alimento periodicamente
        if (this.time % (this.foodSpawnInterval * 60 / this.speed) === 0) {
            let amount = this.foodSpawnAmount;
            if (!this.dayTime && this.dayNightEnabled) {
                amount = Math.floor(amount * 0.3); // Menos comida à noite
            }
            this.generateFood(amount);
        }
        
        // Remove comida excedente para evitar acúmulo excessivo
        const maxFood = 300;
        if (this.food.length > maxFood) {
            this.food.sort((a, b) => a.creationTime - b.creationTime);
            this.food.splice(0, this.food.length - maxFood);
        }

        // Atualiza as bactérias
        for (let i = this.bacteria.length - 1; i >= 0; i--) {
            // Se a bactéria morreu, remove da lista
            if (this.bacteria[i].isDead()) {
                // Verifica se a morte foi por doença
                if (this.bacteria[i].isInfected) {
                    this.stats.diseaseDeaths++;
                }
                this.bacteria.splice(i, 1);
                this.stats.deaths++;
                continue;
            }
            
            // Atualiza a bactéria baseado na velocidade da simulação
            for (let s = 0; s < this.speed; s++) {
                this.bacteria[i].update();
            }
        }
        
        // Atualiza os predadores
        for (let i = this.predators.length - 1; i >= 0; i--) {
            if (this.predators[i].isDead()) {
                this.predators.splice(i, 1);
                continue;
            }
            
            // Atualiza o predador baseado na velocidade da simulação
            for (let s = 0; s < this.speed; s++) {
                this.predators[i].update();
            }
        }
        
        // Verifica interações (colisões otimizadas)
        this.checkInteractionsOptimized();
        
        // Atualiza os efeitos visuais
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update();
            
            if (this.effects[i].isDone) {
                this.effects.splice(i, 1);
            }
        }
        
        // Atualiza as estatísticas
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
        const state = this.controls ? this.controls.getState() : {};
        
        // Desenha os rastros das bactérias (se ativado)
        if (this.showTrails) {
            for (let b of this.bacteria) {
                b.drawTrail();
            }
        }
        
        // Desenha comida
        for (let f of this.food) {
            f.draw();
        }
        
        // Desenha obstáculos
        for (let o of this.obstacles) {
            o.draw();
        }
        
        // Desenha bactérias
        for (let b of this.bacteria) {
            b.draw();
        }
        
        // Desenha predadores
        for (let p of this.predators) {
            p.draw();
        }
        
        // Desenha efeitos visuais
        for (let e of this.effects) {
            e.draw();
        }
        
        // Desenha efeitos das doenças
        if (this.showDiseaseEffects) {
            this.diseaseSystem.draw();
        }
        
        // Desenha estatísticas
        if (this.controls && !this.controls.visualizationSettings.hideStats) {
            this.drawStats();
        }
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
        
        // Mostra população atual / limite
        let populationText = `Bactérias: ${this.stats.totalBacteria}/${this.populationLimit}`;
        
        // Altera a cor para vermelho se estiver próximo do limite
        if (this.stats.totalBacteria > this.populationLimit * 0.9) {
            fill(255, 100, 100);
            populationText += " (próximo do limite)";
        }
        
        text(populationText, 10, y); y += 20;
        fill(255); // Restaura a cor original
        
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
     * @param {number} energy - Energia inicial
     * @returns {Bacteria} - A bactéria criada
     */
    addBacteria(x, y, dna = null, energy = this.initialEnergy) {
        try {
            // Se não for fornecido DNA, cria um simplificado
            if (!dna) {
                dna = {
                    generation: 1,
                    baseLifespan: 12 * 3600 * 60,
                    fitness: 1.0,
                    genes: {
                        metabolism: random(0.5, 1.5),
                        immunity: random(0.5, 1.5),
                        regeneration: random(0.5, 1.5),
                        aggressiveness: random(0.5, 1.5),
                        sociability: random(0.5, 1.5),
                        curiosity: random(0.5, 1.5),
                        speed: random(0.5, 1.5),
                        agility: random(0.5, 1.5),
                        perception: random(0.5, 1.5),
                        fertility: random(0.5, 1.5),
                        mutationRate: random(0.01, 0.1),
                        adaptability: random(0.5, 1.5),
                        size: random(0.5, 1.5),
                        colorR: random(0, 1),
                        colorG: random(0, 1),
                        colorB: random(0, 1)
                    }
                };
            }
            
            // Cria uma bactéria diretamente sem usar o construtor da classe Bacteria
            const bacteria = {
                id: Date.now() + Math.floor(random(0, 1000)),
                pos: createVector(x, y),
                size: 20,
                dna: dna,
                health: energy,
                energy: energy,
                age: 0,
                lifespan: dna.baseLifespan,
                lastMealTime: frameCount,
                healthLossRate: 0.05,
                starvationTime: 30 * 60 * 60,
                isFemale: random() > 0.5,
                simulation: this,
                isInfected: false,
                activeDiseases: new Set(),
                immuneMemory: new Set(),
                canReproduce: true,
                state: window.BacteriaStates.EXPLORING,
                movement: {
                    pos: createVector(x, y),
                    velocity: createVector(random(-1, 1), random(-1, 1)),
                    acceleration: createVector(0, 0),
                    maxSpeed: 2 * dna.genes.speed,
                    baseMaxSpeed: 2 * dna.genes.speed,
                    maxForce: 0.1,
                    avoidRadius: 25,
                    update: function() {
                        // Comportamento básico de movimento
                        this.velocity.add(this.acceleration);
                        this.velocity.limit(this.maxSpeed);
                        this.pos.add(this.velocity);
                        this.acceleration.mult(0);
                    }
                },
                isDead: function() { 
                    // Lógica simplificada para verificar morte
                    return this.health <= 0 || this.age >= this.lifespan; 
                },
                draw: function() {
                    // Renderização simplificada
                    push();
                    fill(this.isFemale ? color(255, 150, 200) : color(150, 200, 255));
                    noStroke();
                    ellipse(this.pos.x, this.pos.y, this.size, this.size);
                    pop();
                },
                update: function() {
                    // Atualização simplificada
                    this.age++;
                    this.health -= this.healthLossRate;
                    this.movement.update();
                    // Manter dentro dos limites da tela
                    this.pos.x = constrain(this.pos.x, 0, width);
                    this.pos.y = constrain(this.pos.y, 0, height);
                }
            };
            
            bacteria.pos = bacteria.movement.pos; // Sincronizar referências
            
            bacteria.simulation = this; // Define referência à simulação
            this.bacteria.push(bacteria);
            return bacteria;
        } catch (error) {
            console.error("Erro ao adicionar bactéria:", error);
            return null;
        }
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
        const state = this.controls ? this.controls.getState() : {};
        
        // Inicializa sem bactérias - o usuário as adicionará depois
        // this.addMultipleBacteria(initialBacteriaCount, femaleRatio);

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
        
        // Não cria bactérias iniciais - o usuário as adicionará depois
        // const initialBacteriaCount = state.initialBacteria || 20;
        // const femaleRatio = state.femaleRatio !== undefined ? state.femaleRatio : 50;
        // this.addMultipleBacteria(initialBacteriaCount, femaleRatio);

        // Cria predadores iniciais
        for (let i = 0; i < 2; i++) { // Começa com 2 predadores
            const predator = new Predator(random(this.width), random(height));
            predator.simulation = this;
            this.predators.push(predator);
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

    /**
     * Adiciona múltiplas bactérias à simulação
     * @param {number} count - Número de bactérias para adicionar
     * @param {number} femaleRatio - Porcentagem de fêmeas (0-100)
     */
    addMultipleBacteria(count, femaleRatio) {
        console.log("Método addMultipleBacteria chamado:", {count, femaleRatio});
        
        // Garante valores válidos
        count = Math.max(1, Math.min(100, count));
        femaleRatio = Math.max(0, Math.min(100, femaleRatio));
        
        console.log("Valores ajustados:", {count, femaleRatio});
        
        // Número de fêmeas a serem criadas
        const femaleCount = Math.round(count * (femaleRatio / 100));
        console.log("Número de fêmeas a criar:", femaleCount);
        
        // Tamanho do array de bactérias antes
        const beforeCount = this.bacteria.length;
        console.log("Bactérias antes:", beforeCount);
        
        try {
            // Adiciona as bactérias
            for (let i = 0; i < count; i++) {
                // Determina se esta bactéria será fêmea
                const isFemale = i < femaleCount;
                
                try {
                    // Posição aleatória na tela
                    const x = random(width * 0.8) + width * 0.1; // Evita bordas
                    const y = random(height * 0.8) + height * 0.1; // Evita bordas
                    
                    // Cria uma instância real de Bacteria
                    const bacteria = new Bacteria(x, y, null, this.initialEnergy);
                    
                    // Define o gênero
                    bacteria.isFemale = isFemale;
                    
                    // IMPORTANTE: Define a referência à simulação
                    bacteria.simulation = this;
                    
                    // Configura valores iniciais críticos para evitar morte prematura
                    bacteria.health = this.initialEnergy;
                    bacteria.energy = this.initialEnergy;
                    bacteria.age = 0;
                    bacteria.lastMealTime = frameCount;
                    
                    // Define a cor com base no gênero (propriedade necessária para visualização)
                    bacteria.color = isFemale ? color(255, 150, 200) : color(150, 200, 255);
                    
                    // Verifica se o tamanho está definido
                    if (!bacteria.size) {
                        bacteria.size = 20;
                    }
                    
                    // Adiciona à simulação
                    this.bacteria.push(bacteria);
                    
                    console.log(`Bactéria ${i+1}/${count} criada (${isFemale ? 'fêmea' : 'macho'})`);
                } catch (error) {
                    console.error(`Erro ao criar bactéria ${i+1}/${count}:`, error);
                    console.error(error.stack);
                }
            }
            
            // Tamanho do array de bactérias depois
            const afterCount = this.bacteria.length;
            console.log("Bactérias depois:", afterCount);
            console.log("Bactérias adicionadas:", afterCount - beforeCount);
        } catch (error) {
            console.error("Erro ao adicionar bactérias:", error);
            console.error(error.stack);
        }
    }
}

// Tornando a classe global
window.Simulation = Simulation; 