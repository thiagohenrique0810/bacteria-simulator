/**
 * Sistema de controle da simulação
 * Responsável por gerenciar os controles e configurações
 */
class SimulationControlSystem {
    /**
     * Inicializa o sistema de controle
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Configurações
        this.paused = false;
        this.speed = 1;
        
        // Callbacks para os controles
        this.callbacks = {};
    }
    
    /**
     * Configura os callbacks para os controles
     */
    setupControls() {
        if (!this.simulation.controls) return;

        this.simulation.controls.setCallbacks({
            onPauseToggle: (isPaused) => {
                this.paused = isPaused;
            },
            onReset: () => {
                this.simulation.reset();
                console.log('Simulação reiniciada');
            },
            onRandomEvent: () => {
                const event = this.simulation.randomEvents.triggerRandomEvent(this.simulation);
                if (event) {
                    this.simulation.statsManager.stats.eventsTriggered++;
                    console.log(`Evento: ${event.name} - ${event.description}`);
                }
            },
            onSave: () => {
                if (this.simulation.saveSystem.saveState(
                    this.simulation.entityManager.bacteria, 
                    this.simulation.entityManager.food, 
                    this.simulation.entityManager.obstacles, 
                    this.simulation.statsManager.stats)) {
                    console.log('Estado salvo com sucesso!');
                }
            },
            onLoad: () => {
                const saves = this.simulation.saveSystem.getSavesList();
                if (saves.length > 0) {
                    const state = this.simulation.saveSystem.loadState(saves[0].id);
                    if (state) {
                        this.simulation.loadState(state);
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
                this.simulation.lifespan = value;
                console.log('Tempo de vida alterado para:', value);
            },
            onHealthLossChange: (value) => {
                this.simulation.healthLossRate = value;
                console.log('Taxa de perda de saúde alterada para:', value);
            },
            onFeedingIntervalChange: (value) => {
                // value está em segundos
                this.simulation.feedingInterval = value;
                console.log('Intervalo de alimentação alterado para:', value);
            },
            onClearFood: () => {
                this.simulation.entityManager.food = [];
                console.log('Comida removida');
            },
            onClearObstacles: () => {
                console.log('Removendo obstáculos...');
                console.log('Quantidade antes:', this.simulation.entityManager.obstacles.length);
                
                // Limpa completamente o array de obstáculos
                this.simulation.entityManager.obstacles = [];
                
                // Garante que não há referências antigas
                this.simulation.maxObstacles = 0;
                
                // Força atualização do slider
                if (this.simulation.controls?.environmentControls?.obstacleSlider) {
                    this.simulation.controls.environmentControls.obstacleSlider.value(0);
                }
                
                console.log('Quantidade depois:', this.simulation.entityManager.obstacles.length);
                console.log('Obstáculos removidos');
                
                // Força uma atualização do estado e da visualização
                this.updateFromControls();
            },
            onForceReproduction: () => {
                console.log('Forçando reprodução...');
                
                // Conta quantas bactérias foram reproduzidas
                let reproductionCount = 0;
                
                // Cria uma cópia do array para evitar modificações durante o loop
                const bacteria = this.simulation.entityManager.bacteria;
                const bacteriaCopy = [...bacteria];
                
                // Tenta reproduzir cada bactéria com a mais próxima compatível
                for (let i = 0; i < bacteriaCopy.length; i++) {
                    const b1 = bacteriaCopy[i];
                    
                    // Pula se já está no limite de população
                    if (bacteria.length >= this.simulation.entityManager.populationLimit) {
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
                        if (b1.mate && b1.mate(closestPartner)) {
                            reproductionCount++;
                            this.simulation.statsManager.stats.successfulMatings++;
                            
                            // Cria o filho imediatamente
                            const mother = b1.isFemale ? b1 : closestPartner;
                            const father = b1.isFemale ? closestPartner : b1;
                            
                            // Posição média entre os pais
                            const childX = (mother.pos.x + father.pos.x) / 2;
                            const childY = (mother.pos.y + father.pos.y) / 2;
                            
                            // Cria nova bactéria com DNA combinado
                            const childDNA = mother.reproduction.giveBirth();
                            const child = this.simulation.entityManager.addBacteria(childX, childY, childDNA);
                            
                            // Aplica mutação com chance de 10%
                            if (random() < 0.1) {
                                child.dna.mutate();
                                this.simulation.statsManager.stats.mutations++;
                            }
                            
                            this.simulation.statsManager.stats.births++;
                            this.simulation.statsManager.stats.naturalBirths++;
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
                const bacteria = this.simulation.entityManager.bacteria;
                const populationLimit = this.simulation.entityManager.populationLimit;
                
                const newTotal = bacteria.length + Number(count);
                if (newTotal > populationLimit) {
                    // Mostra um alerta se exceder
                    alert(`Não é possível adicionar ${count} bactérias. Isso excederia o limite de população (${populationLimit}).`);
                    return;
                }
                
                // Primeira vez que bactérias são adicionadas?
                const firstTime = bacteria.length === 0;
                
                // Adiciona as bactérias com a proporção de fêmeas especificada
                this.simulation.entityManager.addMultipleBacteria(Number(count), Number(femaleRatio));
                
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
        if (!this.simulation.controls) return;

        const state = this.simulation.controls.getState();
        const oldSpeed = this.speed;
        const oldFoodRate = this.simulation.environmentSystem.foodRate;
        const oldFoodValue = this.simulation.entityManager.foodValue;
        const oldMaxObstacles = this.simulation.maxObstacles;
        
        // Atualiza configurações com validação
        this.speed = Math.max(0.1, Math.min(5, state.simulationSpeed || 1));
        this.simulation.entityManager.populationLimit = Math.max(20, Math.min(500, state.populationLimit || 100));
        this.simulation.entityManager.initialEnergy = Math.max(50, Math.min(150, state.initialEnergy || 150));
        this.simulation.entityManager.foodValue = Math.max(10, Math.min(50, state.foodValue || 50));
        this.simulation.environmentSystem.foodRate = Math.max(0, Math.min(1, state.foodRate || 0.8));
        this.simulation.maxObstacles = Math.max(0, Math.min(20, state.maxObstacles || 0));
        this.simulation.environmentSystem.foodSpawnInterval = Math.max(1, Math.min(10, state.foodSpawnInterval || 3));
        this.simulation.environmentSystem.foodSpawnAmount = Math.max(1, Math.min(10, state.foodSpawnAmount || 8));
        
        // Atualiza visualização
        this.simulation.renderSystem.updateSettings({
            showTrails: state.showTrails || false,
            showEnergy: state.showEnergy || true,
            showGender: state.showGender || true,
            showDiseaseEffects: state.showDiseaseEffects || true,
            zoom: Math.max(0.5, Math.min(2, state.zoom || 1))
        });

        // Se o número de obstáculos mudou, atualiza
        if (oldMaxObstacles !== this.simulation.maxObstacles) {
            console.log('Atualizando obstáculos:', oldMaxObstacles, '->', this.simulation.maxObstacles);
            this.simulation.entityManager.updateObstacles();
        }

        // Log das mudanças significativas
        if (oldSpeed !== this.speed) console.log('Velocidade atualizada:', this.speed);
        if (oldFoodRate !== this.simulation.environmentSystem.foodRate) console.log('Taxa de comida atualizada:', this.simulation.environmentSystem.foodRate);
        if (oldFoodValue !== this.simulation.entityManager.foodValue) console.log('Valor nutricional atualizado:', this.simulation.entityManager.foodValue);
        if (oldMaxObstacles !== this.simulation.maxObstacles) console.log('Número de obstáculos atualizado:', this.simulation.maxObstacles);

        // Atualiza os parâmetros dos predadores
        if (this.simulation.controls && this.simulation.controls.predatorControls && typeof this.simulation.controls.predatorControls.getState === 'function') {
            try {
                const predatorState = this.simulation.controls.predatorControls.getState();
                
                // Atualiza os parâmetros de reprodução dos predadores
                this.simulation.entityManager.predators.forEach(predator => {
                    predator.canReproduce = predatorState.predatorReproductionEnabled;
                    predator.reproductionEnergyCost = predatorState.predatorReproductionCost;
                    predator.reproductionCooldown = predatorState.predatorReproductionCooldown;
                    predator.minEnergyToReproduce = predatorState.predatorMinEnergy;
                    predator.reproductionRange = predatorState.predatorReproductionRange;
                    predator.mutationRate = predatorState.predatorMutationRate;
                });

                // Ajusta a quantidade de predadores com base no limite
                const predatorLimit = predatorState.predatorLimit;
                while (this.simulation.entityManager.predators.length > predatorLimit) {
                    this.simulation.entityManager.predators.pop();
                }
                while (this.simulation.entityManager.predators.length < predatorLimit) {
                    const x = random(width);
                    const y = random(height);
                    this.simulation.entityManager.predators.push(new Predator(x, y));
                }
            } catch (error) {
                console.warn("Erro ao atualizar parâmetros dos predadores:", error);
            }
        }
    }
    
    /**
     * Verifica se a simulação está pausada
     * @returns {boolean} - Se a simulação está pausada
     */
    isPaused() {
        return this.paused;
    }
    
    /**
     * Obtém a velocidade atual da simulação
     * @returns {number} - Velocidade da simulação
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Manipula o clique no botão de adicionar bactérias
     */
    handleButtonAddBacteria() {
        try {
            console.log("🖱️ Botão Adicionar Bactérias clicado");
            
            // Obter os valores dos controles
            const count = parseInt(document.getElementById('add-bacteria-amount-slider')?.value || 10);
            const femaleRatio = parseFloat(document.getElementById('add-bacteria-female-ratio-slider')?.value || 50);
            
            console.log(`📊 Valores obtidos: ${count} bactérias, ${femaleRatio}% fêmeas`);
            
            // Validação básica
            if (isNaN(count) || isNaN(femaleRatio)) {
                console.error("❌ Valores inválidos para adicionar bactérias");
                return;
            }
            
            // Verificar se a simulação existe
            if (!this.simulation) {
                console.error("❌ Simulação não disponível");
                return;
            }
            
            // Verificar se o EntityManager existe
            if (!this.simulation.entityManager) {
                console.error("❌ EntityManager não disponível");
                return;
            }
            
            // Verificar se o método existe
            if (typeof this.simulation.entityManager.addMultipleBacteria !== 'function') {
                console.error("❌ Método addMultipleBacteria não disponível");
                
                // Tentar solução alternativa
                if (Array.isArray(this.simulation.entityManager.bacteria)) {
                    console.log("⚠️ Usando método alternativo para adicionar bactérias");
                    this.addBacteriasFallback(count, femaleRatio);
                }
                return;
            }
            
            // Chamar o método
            console.log(`🚀 Chamando entityManager.addMultipleBacteria(${count}, ${femaleRatio})`);
            this.simulation.entityManager.addMultipleBacteria(Number(count), Number(femaleRatio));
        } catch (error) {
            console.error("❌ Erro ao adicionar bactérias:", error);
        }
    }
    
    /**
     * Método alternativo para adicionar bactérias caso o método original não esteja disponível
     * @param {number} count - Número de bactérias para adicionar
     * @param {number} femaleRatio - Porcentagem de fêmeas (0-100)
     */
    addBacteriasFallback(count, femaleRatio) {
        try {
            console.log("🔄 Usando método fallback para adicionar bactérias");
            const femaleCount = Math.round(count * (femaleRatio / 100));
            
            // Verificar se a classe Bacteria está disponível
            if (typeof window.Bacteria !== 'function') {
                console.error("❌ Classe Bacteria não está disponível");
                return;
            }
            
            // Adicionar bactérias
            for (let i = 0; i < count; i++) {
                const isFemale = i < femaleCount;
                const x = random(this.simulation.width * 0.1, this.simulation.width * 0.9);
                const y = random(this.simulation.height * 0.1, this.simulation.height * 0.9);
                
                try {
                    const bacteria = new window.Bacteria({
                        x: x,
                        y: y,
                        isFemale: isFemale,
                        energy: this.simulation.entityManager.initialEnergy || 150,
                        initialEnergy: this.simulation.entityManager.initialEnergy || 150,
                        initialState: "exploring"
                    });
                    
                    if (bacteria) {
                        bacteria.simulation = this.simulation;
                        this.simulation.entityManager.bacteria.push(bacteria);
                        console.log(`✅ Bactéria ${i+1} adicionada com sucesso via fallback`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao criar bactéria ${i+1}:`, error);
                }
            }
            
            console.log(`✅ Total: ${this.simulation.entityManager.bacteria.length} bactérias`);
        } catch (error) {
            console.error("❌ Erro no método fallback:", error);
        }
    }

    /**
     * Configura os event listeners para os controles
     * @param {Object} callbacks - Objeto com as funções de callback para cada controle
     */
    setupEventListeners(callbacks) {
        try {
            console.log("🔧 Configurando event listeners para os controles");
            this.callbacks = callbacks || {};
            
            // Procura o botão pelo texto em vez de pelo ID
            console.log("🔍 Procurando botão 'Adicionar Bactérias' pelo texto...");
            
            let addBacteriaButton = null;
            const allButtons = document.querySelectorAll('button');
            console.log(`🔍 Encontrados ${allButtons.length} botões no DOM`);
            
            allButtons.forEach((btn, index) => {
                const text = btn.innerText || btn.textContent;
                if (text && text.includes("Adicionar Bactérias")) {
                    console.log(`✅ Botão encontrado: "${text}" (index: ${index})`);
                    addBacteriaButton = btn;
                }
            });
            
            if (addBacteriaButton) {
                console.log("✅ Botão Adicionar Bactérias encontrado, conectando...");
                
                // Remover listeners antigos para evitar duplicação
                const newButton = addBacteriaButton.cloneNode(true);
                addBacteriaButton.parentNode.replaceChild(newButton, addBacteriaButton);
                
                // Adicionar novo event listener
                newButton.addEventListener('click', () => {
                    console.log("🖱️ Botão Adicionar Bactérias clicado via listener direto");
                    this.handleButtonAddBacteria();
                });
                
                console.log("✅ Event listener configurado com sucesso");
            } else {
                console.error("❌ Botão 'Adicionar Bactérias' não encontrado pelo texto");
                
                // Tentar encontrar através de classes ou outros seletores
                console.log("🔍 Tentando encontrar botão por seletores alternativos...");
                
                // Tenta encontrar no DOM qualquer botão dentro da div de controles
                document.querySelectorAll('div div div button').forEach((btn, index) => {
                    console.log(`Botão ${index}: "${btn.innerText || btn.textContent}"`);
                });
                
                // Requer uma solução alternativa - precisamos criar nosso próprio botão
                this.createEmergencyButton();
            }
            
            // Os demais listeners podem continuar usando os callbacks
            // Apenas para garantir que o onAddBacteria seja chamado
            if (typeof this.callbacks.onAddBacteria === 'function') {
                const originalCallback = this.callbacks.onAddBacteria;
                this.callbacks.onAddBacteria = (count, femaleRatio) => {
                    console.log("📣 Callback original onAddBacteria interceptado");
                    this.handleButtonAddBacteria();
                    originalCallback(count, femaleRatio);
                };
                console.log("✅ Callback onAddBacteria interceptado e configurado");
            }
        } catch (error) {
            console.error("❌ Erro ao configurar event listeners:", error);
            // Requer uma solução alternativa - criamos nosso próprio botão
            this.createEmergencyButton();
        }
    }
    
    /**
     * Cria um botão de emergência para adicionar bactérias caso o original não funcione
     */
    createEmergencyButton() {
        try {
            console.log("🚨 Criando botão de emergência para adicionar bactérias");
            
            // Verifica se a biblioteca p5.js está disponível
            if (typeof createButton !== 'function') {
                console.error("❌ Função createButton não disponível, não é possível criar botão de emergência");
                return;
            }
            
            // Cria o botão usando p5.js
            const emergencyButton = createButton('⚠️ Adicionar Bactérias (Emergência)');
            
            // Posiciona o botão no centro da tela
            emergencyButton.position(20, 100);
            emergencyButton.size(250, 40);
            
            // Estiliza o botão
            emergencyButton.style('background-color', '#ff5722');
            emergencyButton.style('color', 'white');
            emergencyButton.style('border', 'none');
            emergencyButton.style('border-radius', '4px');
            emergencyButton.style('cursor', 'pointer');
            emergencyButton.style('font-weight', 'bold');
            emergencyButton.style('font-size', '14px');
            emergencyButton.style('z-index', '9999');
            emergencyButton.style('box-shadow', '0 4px 8px rgba(0,0,0,0.3)');
            
            // Adiciona evento de clique
            emergencyButton.mousePressed(() => {
                console.log("🖱️ Botão de emergência clicado");
                this.handleButtonAddBacteria();
            });
            
            console.log("✅ Botão de emergência criado com sucesso");
        } catch (error) {
            console.error("❌ Erro ao criar botão de emergência:", error);
        }
    }
}

// Torna a classe disponível globalmente
window.SimulationControlSystem = SimulationControlSystem; 