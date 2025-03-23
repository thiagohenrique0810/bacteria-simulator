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
     * Verifica e corrige valores NaN nas propriedades críticas da bactéria
     * @param {string} origem - Identificação da origem da validação para logs
     * @returns {boolean} - true se alguma correção foi feita
     */
    validarPropriedades(origem = "geral") {
        let foiCorrigido = false;
        
        // Verifica posição
        if (!this.pos) {
            console.error(`Bactéria ${this.id} sem posição! Criando posição padrão...`);
            this.pos = createVector(random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9));
            foiCorrigido = true;
        } else if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.error(`Detectada posição inválida NaN para bactéria ${this.id} (origem: ${origem})`);
            this.pos.x = !isNaN(this.pos.x) ? this.pos.x : random(width * 0.1, width * 0.9);
            this.pos.y = !isNaN(this.pos.y) ? this.pos.y : random(height * 0.1, height * 0.9);
            foiCorrigido = true;
        }
        
        // Verifica movimento
        if (this.movement) {
            // Verifica movimento aninhado
            if (this.movement.movement) {
                // Verifica posição do movimento
                if (this.movement.movement.position) {
                    if (isNaN(this.movement.movement.position.x) || isNaN(this.movement.movement.position.y)) {
                        console.error(`Detectada posição de movimento inválida para bactéria ${this.id}`);
                        // Corrige com a posição da bactéria se válida, ou com valores aleatórios
                        this.movement.movement.position.x = !isNaN(this.pos.x) ? this.pos.x : random(width * 0.1, width * 0.9);
                        this.movement.movement.position.y = !isNaN(this.pos.y) ? this.pos.y : random(height * 0.1, height * 0.9);
                        foiCorrigido = true;
                    }
                }
                
                // Verifica velocidade do movimento
                if (this.movement.movement.velocity) {
                    if (isNaN(this.movement.movement.velocity.x) || isNaN(this.movement.movement.velocity.y)) {
                        console.error(`Detectada velocidade de movimento inválida para bactéria ${this.id}`);
                        this.movement.movement.velocity.x = 0;
                        this.movement.movement.velocity.y = 0;
                        // Adiciona velocidade aleatória para garantir movimento
                        const randomVel = p5.Vector.random2D().mult(1.0);
                        this.movement.movement.velocity.add(randomVel);
                        foiCorrigido = true;
                    }
                }
            }
        }
        
        return foiCorrigido;
    }
    
    /**
     * Atualiza o estado da bactéria
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime = 1) {
        try {
            // Atualiza idade
            this.age += deltaTime;

            // Verifica se está morta
            if (this.isDead()) {
                return;
            }

            // Análise do ambiente atual
            let environmentConditions = {};
            if (this.environment && typeof this.environment.analyzeEnvironment === 'function') {
                // Obtém referências globais para entidades do ambiente, se disponíveis
                const food = window.simulationInstance?.foodManager?.getFoodArray() || [];
                const predators = window.simulationInstance?.predatorManager?.getPredators() || [];
                const obstacles = window.simulationInstance?.obstacleManager?.getObstacles() || [];
                const entities = window.simulationInstance?.entityManager?.getBacteria() || [];
                
                // Analisa o ambiente com todas as entidades para identificação
                environmentConditions = this.environment.analyzeEnvironment(
                    food, 
                    predators, 
                    obstacles, 
                    entities
                );
                
                // Log de informações sobre entidades identificadas a cada 300 frames
                if (this.age % 300 === 0) {
                    const nearbyBacteria = environmentConditions.nearbyBacteria?.length || 0;
                    const sameSpecies = environmentConditions.sameSpeciesBacteria?.length || 0;
                    const differentSpecies = environmentConditions.differentSpeciesBacteria?.length || 0;
                    const identifiedObstacles = environmentConditions.identifiedObstacles?.length || 0;
                    
                    console.log(`Bactéria ${this.id} - Identificou: ${nearbyBacteria} bactérias (${sameSpecies} mesma espécie, ${differentSpecies} diferente), ${identifiedObstacles} obstáculos`);
                }
            } else {
                console.warn(`Sistema de ambiente não inicializado para a bactéria ${this.id}`);
                environmentConditions = { foodNearby: false, mateNearby: false, predatorNearby: false };
            }

            // Determina a próxima ação
            let action = 'explore'; // Ação padrão
            
            // Usa aprendizado neural para decisão se disponível
            if (this.learning && typeof this.learning.decideAction === 'function') {
                const decision = this.learning.decideAction(environmentConditions);
                action = decision.action || 'explore';
                
                // Atualiza os parâmetros de movimento com base na decisão neural
                if (decision.movementParams) {
                    environmentConditions.movementParams = decision.movementParams;
                }
            }
            
            if (this.stateManager && typeof this.stateManager.update === 'function') {
                // Usa o gerenciador de estados avançado
                
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
            
            // Atualiza o movimento usando o módulo de movimento aprimorado
            if (this.movement && typeof this.movement.update === 'function') {
                // Aplica comportamentos específicos para bactérias e obstáculos identificados
                if (environmentConditions.nearbyBacteria?.length > 0 || 
                    environmentConditions.identifiedObstacles?.length > 0) {
                    
                    // Ajusta o comportamento conforme a presença de outras entidades
                    this.adjustBehavior(stateInfo, environmentConditions);
                }
                
                // Atualiza o movimento com as condições ambientais e informações de estado
                this.movement.update(stateInfo, environmentConditions, deltaTime);
            } else {
                // Se o movimento não estiver disponível, tenta um movimento básico
                this.basicMove(deltaTime);
            }
            
            // Atualiza o sistema de reprodução, se disponível
            if (this.reproduction && typeof this.reproduction.update === 'function') {
                const childDNA = this.reproduction.update();
                
                // Se for gerado um DNA filho, informa ao sistema de simulação
                if (childDNA && this.onReproduction) {
                    this.onReproduction(childDNA);
                }
            }
            
            // Reduz gradualmente a energia
            if (this.states && typeof this.states.removeEnergy === 'function') {
                this.states.removeEnergy(0.05 * deltaTime);
            }
            
            // Válida e corrige propriedades após a atualização
            this.validarPropriedades("update");
            
            // Log de debug a cada 60 frames para verificar movimento
            if (frameCount % 60 === 0) {
                console.log(`Bactéria ${this.id}: pos=${this.pos.x.toFixed(1)},${this.pos.y.toFixed(1)}, 
                            state=${this.stateManager ? this.stateManager.currentState : 'unknown'}`);
            }
        } catch (error) {
            console.error("Erro no update da bactéria:", error, this);
        }
    }
    
    /**
     * Ajusta o comportamento da bactéria com base nas entidades identificadas
     * @param {Object} stateInfo - Informações de estado
     * @param {Object} environmentConditions - Condições ambientais
     */
    adjustBehavior(stateInfo, environmentConditions) {
        try {
            // Recupera informações do ambiente
            const sameSpecies = environmentConditions.sameSpeciesBacteria || [];
            const differentSpecies = environmentConditions.differentSpeciesBacteria || [];
            const obstacles = environmentConditions.identifiedObstacles || [];
            
            // Para bactérias da mesma espécie, ajusta comportamento
            if (sameSpecies.length > 0) {
                // Se estiver buscando comida e houver muitos da mesma espécie por perto,
                // aumenta a velocidade para competir ou procura em outro lugar
                if (stateInfo.targetType === 'food' && sameSpecies.length >= 3) {
                    stateInfo.speedMultiplier *= 1.2; // Aumenta velocidade para competir
                }
                
                // Se estiver explorando e houver outros da mesma espécie, 
                // considera seguir o grupo (já implementado via flocking no BacteriaMovement)
            }
            
            // Para bactérias de espécies diferentes
            if (differentSpecies.length > 0) {
                // Se estiver em modo de exploração e houver bactérias diferentes por perto,
                // pode ser mais cauteloso ou evitar (já implementado no BacteriaMovement)
                
                // Se estiver buscando comida e houver muitas bactérias diferentes por perto,
                // avalia se deve ser mais agressivo ou procurar em outro lugar
                if (stateInfo.targetType === 'food' && differentSpecies.length >= 2) {
                    // Analisa o tamanho médio das outras bactérias para decidir
                    const avgSize = differentSpecies.reduce((sum, b) => sum + (b.size || 10), 0) / differentSpecies.length;
                    
                    if (this.size > avgSize * 1.2) {
                        // Se for significativamente maior, age de forma mais dominante
                        stateInfo.speedMultiplier *= 1.3;
                    } else if (this.size < avgSize * 0.8) {
                        // Se for menor, tenta evitar competição
                        if (stateInfo.target && random() < 0.4) {
                            // 40% de chance de procurar outro alvo
                            stateInfo.targetType = 'random';
                            stateInfo.target = null;
                        }
                    }
                }
            }
            
            // Para obstáculos identificados
            if (obstacles.length > 0) {
                // Já implementado no BacteriaMovement.avoidObstacles
                // Aqui podemos adicionar comportamentos adicionais como:
                
                // Se estiver indo em direção a um alvo e houver obstáculos no caminho,
                // reavalia a rota ou muda de alvo
                if ((stateInfo.targetType === 'food' || stateInfo.targetType === 'mate') && 
                    stateInfo.target && obstacles.length >= 2) {
                    
                    // Verifica a posição dos obstáculos em relação ao alvo
                    let obstacleInPath = false;
                    
                    const targetPos = stateInfo.target.position || stateInfo.target.pos;
                    if (targetPos) {
                        // Vetor da bactéria ao alvo
                        const toTarget = createVector(
                            targetPos.x - this.pos.x,
                            targetPos.y - this.pos.y
                        );
                        const distToTarget = toTarget.mag();
                        toTarget.normalize();
                        
                        // Verifica se algum obstáculo está no caminho
                        for (const obstacle of obstacles) {
                            let obstaclePos;
                            
                            if (obstacle.center) {
                                obstaclePos = obstacle.center;
                            } else if (obstacle.position) {
                                obstaclePos = obstacle.position;
                            } else if (obstacle.x !== undefined && obstacle.y !== undefined) {
                                obstaclePos = createVector(obstacle.x, obstacle.y);
                            } else {
                                continue;
                            }
                            
                            // Vetor da bactéria ao obstáculo
                            const toObstacle = createVector(
                                obstaclePos.x - this.pos.x,
                                obstaclePos.y - this.pos.y
                            );
                            const distToObstacle = toObstacle.mag();
                            
                            // Se o obstáculo está mais próximo que o alvo
                            if (distToObstacle < distToTarget) {
                                // Projeta o vetor obstáculo na direção do alvo
                                const projection = p5.Vector.dot(toObstacle, toTarget);
                                
                                // Se a projeção é positiva e menor que a distância ao alvo,
                                // o obstáculo está no caminho
                                if (projection > 0 && projection < distToTarget) {
                                    // Calcula a distância perpendicular ao caminho
                                    const perpDistance = sqrt(
                                        distToObstacle * distToObstacle - projection * projection
                                    );
                                    
                                    // Se a distância perpendicular é menor que o raio do obstáculo + margem,
                                    // considera que está no caminho
                                    if (perpDistance < (obstacle.size || 20) + this.size) {
                                        obstacleInPath = true;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // Se houver obstáculo no caminho
                        if (obstacleInPath && random() < 0.25) {
                            // 25% de chance de mudar para movimento aleatório temporariamente
                            stateInfo.targetType = 'random';
                            stateInfo.target = null;
                            // Com velocidade aumentada para contornar rapidamente
                            stateInfo.speedMultiplier *= 1.2;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao ajustar comportamento da bactéria:", error);
        }
    }
    
    /**
     * Movimento básico para fallback quando o módulo avançado não está disponível
     * @param {number} deltaTime - Tempo desde o último frame
     */
    basicMove(deltaTime) {
        try {
            if (!this.pos) {
                console.warn("Bactéria sem posição definida");
                return;
            }
            
            // Gera um movimento aleatório simples
            const randomAngle = random(TWO_PI);
            const speed = 1.5; // Velocidade fixa para o movimento básico
            
            // Atualiza a posição
            this.pos.x += cos(randomAngle) * speed * deltaTime;
            this.pos.y += sin(randomAngle) * speed * deltaTime;
            
            // Garante que a bactéria permaneça dentro dos limites
            const canvasWidth = width || 800;
            const canvasHeight = height || 600;
            
            this.pos.x = constrain(this.pos.x, 10, canvasWidth - 10);
            this.pos.y = constrain(this.pos.y, 10, canvasHeight - 10);
        } catch (error) {
            console.error("Erro no movimento básico:", error);
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

    /**
     * Processa o comportamento da bactéria
     * @param {number} deltaTime - Tempo desde o último frame
     */
    processBehavior(deltaTime = 1) {
        try {
            // Se não tiver aprendizado ou movimento, não pode processar comportamento
            if (!this.learning || !this.movement) {
                console.warn("Bacteria sem módulos de aprendizado ou movimento");
                return;
            }
            
            // Obtém as condições do ambiente
            const conditions = this.environment.analyzeEnvironment();
            
            // Utiliza IA para decidir a próxima ação
            const actionResult = this.learning.decideAction(conditions);
            
            // Atualiza o gerenciador de estados com a decisão da IA
            const stateInfo = this.stateManager.update(conditions, actionResult);
            
            // Processa o movimento com base nos parâmetros contínuos
            this.processMovement(stateInfo, conditions, deltaTime);
            
            // Recompensa a bactéria com base no resultado de suas ações
            this.applyRewards(conditions);
        } catch (error) {
            console.error("Erro ao processar comportamento:", error);
        }
    }

    /**
     * Processa o movimento da bactéria baseado nos parâmetros de movimento
     * @param {Object} stateInfo - Informações do estado atual
     * @param {Object} conditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    processMovement(stateInfo, conditions, deltaTime = 1) {
        // Não move se estiver descansando
        if (stateInfo.state === 'resting') {
            // Mesmo em descanso, aplica pequenos movimentos para parecer mais natural
            this.movement.moveRandom(deltaTime, 0.1);
            return;
        }
        
        // Obtém os parâmetros de movimento atuais
        const params = stateInfo.movementParams;
        
        // Estado de busca por comida
        if ((stateInfo.state === 'seekingFood' || stateInfo.state === 'seekFood') && conditions.nearestFood) {
            const targetWeight = params.targetWeight || 0.5;
            
            // Combina movimento aleatório com movimento direcionado baseado no peso do alvo
            if (random() < targetWeight) {
                this.movement.moveTowards(conditions.nearestFood, deltaTime, params.speed || 1.0);
            } else {
                this.movement.moveRandom(deltaTime, params.speed || 1.0);
            }
        }
        // Estado de busca por parceiro
        else if ((stateInfo.state === 'seekingMate' || stateInfo.state === 'seekMate') && conditions.nearestMate) {
            const targetWeight = params.targetWeight || 0.5;
            
            // Combina movimento aleatório com movimento direcionado baseado no peso do alvo
            if (random() < targetWeight) {
                this.movement.moveTowards(conditions.nearestMate, deltaTime, params.speed || 1.0);
            } else {
                this.movement.moveRandom(deltaTime, params.speed || 1.0);
            }
        }
        // Estado de fuga
        else if (stateInfo.state === 'fleeing' && conditions.nearestPredator) {
            // Cria um vetor na direção oposta ao predador
            const awayVector = createVector(
                this.pos.x - conditions.nearestPredator.x,
                this.pos.y - conditions.nearestPredator.y
            );
            
            // Normaliza e escala pela velocidade
            awayVector.normalize();
            awayVector.mult(2.0); // Fuga é mais rápida
            
            const escapePosInOppositeDirection = createVector(
                this.pos.x + awayVector.x * 50,
                this.pos.y + awayVector.y * 50
            );
            
            // Move-se para a posição oposta
            this.movement.moveTowards(escapePosInOppositeDirection, deltaTime, params.speed * 1.5);
        }
        // Estado de exploração
        else if (stateInfo.state === 'exploring' || stateInfo.state === 'explore') {
            // Aplica os parâmetros de movimento contínuo do sistema neural
            this.movement.moveRandom(deltaTime, params.speed || 1.0);
        }
        else {
            // Para qualquer outro estado, usa movimento aleatório com velocidade média
            this.movement.moveRandom(deltaTime, 0.5);
        }
    }

    /**
     * Aplica recompensas com base nas ações da bactéria
     * @param {Object} conditions - Condições do ambiente
     */
    applyRewards(conditions) {
        if (!this.learning) return;
        
        let reward = 0;
        
        // Recompensa por encontrar comida
        if (conditions.foundFood) {
            reward += 1.0;
        }
        
        // Recompensa por se reproduzir
        if (conditions.reproduced) {
            reward += 1.5;
        }
        
        // Recompensa por fugir de predador
        if (conditions.escapedPredator) {
            reward += 1.0;
        }
        
        // Recompensa por sobreviver com saúde alta
        if (this.health > 80) {
            reward += 0.1;
        }
        
        // Penalidade por saúde baixa
        if (this.health < 30) {
            reward -= 0.2;
        }
        
        // Aplica a recompensa final ao sistema de aprendizado
        if (reward !== 0) {
            this.learning.applyReward(reward);
        }
    }
}

// Exporta a classe para uso global
window.Bacteria = Bacteria; 