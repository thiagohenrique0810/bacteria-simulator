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
        // Extrai parâmetros com valores padrão e verificações
        const x = typeof params.x === 'number' && !isNaN(params.x) ? params.x : random(width * 0.1, width * 0.9);
        const y = typeof params.y === 'number' && !isNaN(params.y) ? params.y : random(height * 0.1, height * 0.9);
        const parentDNA = params.parentDNA || null;
        const energy = typeof params.energy === 'number' ? params.energy : 100;
        
        // Chama construtor da classe pai com parâmetros individuais
        super(x, y, parentDNA, energy);
        
        // Garante que this.pos é um vetor válido
        if (!this.pos || typeof this.pos.x !== 'number' || isNaN(this.pos.x)) {
            console.warn(`Posição inválida após construtor da classe pai para ${this.id}, recriando`);
            this.pos = createVector(x, y);
        }
        
        // Define estado inicial e energia
        this.initialState = params.initialState || 'exploring';
        this.initialEnergy = typeof params.initialEnergy === 'number' ? params.initialEnergy : energy;
        this.isFemale = params.isFemale === true;
        
        // Inicializa comportamentos
        this.initBehaviors();
        
        // Inicializa sistema de movimento (verificando se existe)
        try {
            // Verificar se a classe Movement está disponível antes de criar BacteriaMovement
            if (typeof Movement !== 'function' && typeof window.Movement !== 'function') {
                console.error(`Classe Movement não encontrada. Verificando se o arquivo foi carregado.`);
                // Tentar registrar uma classe Movement básica para fallback
                window.Movement = class Movement {
                    constructor(pos, size) {
                        this.position = pos.copy ? pos.copy() : createVector(pos.x, pos.y);
                        this.velocity = createVector(random(-1, 1), random(-1, 1));
                        this.size = size || 10;
                        this.maxSpeed = 3;
                    }
                };
            }
            
            this.movement = new BacteriaMovement(this);
            
            if (!this.movement) {
                console.error(`Falha ao criar sistema de movimento para bactéria ${this.id}`);
                // Tenta criar novamente com um construtor alternativo
                this.movement = new window.BacteriaMovement(this);
            }
            
            // Verificação adicional após criar o movimento
            if (this.movement && (!this.movement.movement || !this.movement.movement.velocity)) {
                console.warn(`Sistema de movimento criado mas incompleto para bactéria ${this.id}, inicializando propriedades básicas`);
                
                if (!this.movement.movement) {
                    this.movement.movement = {
                        position: this.pos.copy(),
                        velocity: p5.Vector.random2D().mult(2),
                        size: this.size
                    };
                }
                
                if (this.movement.movement && !this.movement.movement.velocity) {
                    this.movement.movement.velocity = p5.Vector.random2D().mult(2);
                }
            }
        } catch (error) {
            console.error(`Erro ao inicializar sistema de movimento: ${error.message}`);
            // Criar um sistema de movimento básico como fallback
            this.movement = {
                movement: {
                    position: this.pos.copy(),
                    velocity: p5.Vector.random2D().mult(2)
                },
                update: function() {
                    // Movimento simples para garantir que a bactéria se mova
                    this.movement.position.add(this.movement.velocity);
                }
            };
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
        if (this.initialState && this.stateManager && typeof this.stateManager.setCurrentState === 'function') {
            this.stateManager.setCurrentState(this.initialState);
        }

        // Configurar energia inicial se fornecida
        if (this.initialEnergy !== undefined && this.stateManager) {
            this.stateManager.currentEnergy = this.initialEnergy;
        }
        
        // Verifica posição novamente antes de finalizar construção
        this.validateAndFixPosition();
        
        console.log(`Bactéria criada: ID=${this.id}, Sexo=${this.isFemale ? 'Feminino' : 'Masculino'}, Posição=(${this.pos.x.toFixed(2)}, ${this.pos.y.toFixed(2)}), Estado=${this.stateManager ? this.stateManager.currentState : 'não definido'}`);
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
     * Analisa o ambiente da bactéria
     */
    analyzeEnvironment() {
        try {
            // Análise do ambiente atual
            this.environmentConditions = {};
            if (this.environment && typeof this.environment.analyzeEnvironment === 'function') {
                // Obtém referências globais para entidades do ambiente, se disponíveis
                const food = window.simulationInstance?.foodManager?.getFoodArray() || [];
                const predators = window.simulationInstance?.predatorManager?.getPredators() || [];
                const obstacles = window.simulationInstance?.obstacleManager?.getObstacles() || [];
                const entities = window.simulationInstance?.entityManager?.getBacteria() || [];
                
                // Analisa o ambiente com todas as entidades para identificação
                this.environmentConditions = this.environment.analyzeEnvironment(
                    food, 
                    predators, 
                    obstacles, 
                    entities
                );
                
                // Log de informações sobre entidades identificadas a cada 300 frames
                if (this.age % 300 === 0) {
                    const nearbyBacteria = this.environmentConditions.nearbyBacteria?.length || 0;
                    const sameSpecies = this.environmentConditions.sameSpeciesBacteria?.length || 0;
                    const differentSpecies = this.environmentConditions.differentSpeciesBacteria?.length || 0;
                    const identifiedObstacles = this.environmentConditions.identifiedObstacles?.length || 0;
                    
                    console.log(`Bactéria ${this.id} - Identificou: ${nearbyBacteria} bactérias (${sameSpecies} mesma espécie, ${differentSpecies} diferente), ${identifiedObstacles} obstáculos`);
                }
            } else {
                console.warn(`Sistema de ambiente não inicializado para a bactéria ${this.id}`);
                this.environmentConditions = { foodNearby: false, mateNearby: false, predatorNearby: false };
            }
        } catch (error) {
            console.error(`Erro ao analisar ambiente para bactéria ${this.id}:`, error);
            this.environmentConditions = { foodNearby: false, mateNearby: false, predatorNearby: false };
        }
    }

    /**
     * Toma decisões com base no ambiente
     */
    makeDecision() {
        try {
            // Determina a próxima ação
            let action = 'explore'; // Ação padrão
            
            // Usa aprendizado neural para decisão se disponível
            if (this.learning && typeof this.learning.decideAction === 'function') {
                const decision = this.learning.decideAction(this.environmentConditions);
                action = decision.action || 'explore';

                // Atualiza os parâmetros de movimento com base na decisão neural
                if (decision.movementParams) {
                    this.environmentConditions.movementParams = decision.movementParams;
                }
            }
            
            if (this.stateManager && typeof this.stateManager.setCurrentState === 'function') {
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
                
                // Atualiza o gerenciador de estados com as condições ambientais
                if (typeof this.stateManager.update === 'function') {
                    this.stateManager.update(this.environmentConditions);
                }
            } else {
                console.warn(`Sistema de estados não inicializado para a bactéria ${this.id}`);
            }
        } catch (error) {
            console.error(`Erro ao tomar decisão para bactéria ${this.id}:`, error);
        }
    }

    /**
     * Atualiza a bactéria
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(deltaTime = 1) {
        // Incrementar idade
        this.age += deltaTime;
        
        // Validar propriedades para evitar erros
        this.validarPropriedades("inicio update");
        
        try {
            // Atualiza a visualização da bactéria
            if (this.visualization && typeof this.visualization.update === 'function') {
                this.visualization.update();
            }
            
            // Analisa o ambiente
            this.analyzeEnvironment();
            
            // Método de depuração para verificar se o movimento está inicializado
            if (!this.movement) {
                console.error(`Bactéria ${this.id} sem sistema de movimento. Inicializando...`);
                this.movement = new BacteriaMovement(this);
                
                if (!this.movement) {
                    console.error(`Falha ao criar movimento para bactéria ${this.id}. Usando fallback.`);
                    // Cria um objeto mínimo para evitar erros
                    this.movement = {
                        moveRandom: (dt, speed) => {
                            // Movimento simples como fallback
                            const randomStep = p5.Vector.random2D().mult(speed * 2);
                            this.pos.add(randomStep);
                        }
                    };
                }
            }
            
            // Processa o comportamento baseado em IA (se disponível)
            if (this.stateManager && this.learning) {
                // Obtém as condições do ambiente
                let conditions = {};
                if (this.environment) {
                    if (typeof this.environment.analyzeEnvironment === 'function') {
                        conditions = this.environment.analyzeEnvironment();
                    } else {
                        // Fallback: cria um objeto de condições vazio para evitar erros
                        console.warn(`Bactéria ${this.id}: método analyzeEnvironment não encontrado`);
                        conditions = {
                            nearestFood: null,
                            nearestMate: null,
                            nearestPredator: null,
                            isSafe: true,
                            foundFood: false,
                            reproduced: false,
                            predatorNearby: false
                        };
                    }
                }
                
                // Utiliza IA para decidir a próxima ação
                const actionResult = this.learning.decideAction(conditions);
                
                // Atualiza o gerenciador de estados com a decisão da IA
                const stateInfo = this.stateManager.update(conditions, actionResult);
                
                // Processa o movimento com base no estado e nos parâmetros de movimento
                this.processMovement(stateInfo, conditions, deltaTime);
                
                // Verifica se consumo de energia está funcionando corretamente
                if (frameCount % 60 === 0) {
                    console.log(`Bactéria ${this.id}: Estado=${stateInfo.state}, Energia=${this.stateManager.currentEnergy.toFixed(1)}`);
                }
            } else {
                // Se não tiver IA ou gerenciador de estados, usa movimento aleatório simples
                console.log(`Bactéria ${this.id} sem IA ou gerenciador de estados, usando movimento aleatório básico`);
                this.movement.moveRandom(deltaTime, 1.0);
            }
            
            // Aplica confinamento aos limites da tela
            if (this.movement && typeof this.movement.constrainToBounds === 'function') {
                this.movement.constrainToBounds();
            } else {
                // Método de fallback para manter a bactéria dentro dos limites
                this.constrainToBounds();
            }
            
            // Garantir que a posição é válida após a atualização
            this.validarPropriedades("fim update");
            
        } catch (error) {
            console.error(`Erro crítico ao atualizar bactéria ${this.id}:`, error);
            // Em caso de erro, tenta um movimento básico para evitar congelamento
            if (this.pos) {
                const randomMove = p5.Vector.random2D().mult(2);
                this.pos.add(randomMove);
                this.constrainToBounds();
            }
        }
    }
    
    /**
     * Método de fallback para manter a bactéria dentro dos limites da tela
     */
    constrainToBounds() {
        if (!this.pos) return;
        
        try {
            const worldWidth = typeof width !== 'undefined' ? width : 800;
            const worldHeight = typeof height !== 'undefined' ? height : 600;
            const radius = this.size / 2 || 10;
            
            // Restringe às coordenadas válidas
            if (this.pos.x < radius) this.pos.x = radius;
            if (this.pos.x > worldWidth - radius) this.pos.x = worldWidth - radius;
            if (this.pos.y < radius) this.pos.y = radius;
            if (this.pos.y > worldHeight - radius) this.pos.y = worldHeight - radius;
        } catch (error) {
            console.error(`Erro ao aplicar constrainToBounds:`, error);
        }
    }
    
    /**
     * Processa o movimento da bactéria baseado nos parâmetros de movimento
     * @param {Object} stateInfo - Informações do estado atual
     * @param {Object} conditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    processMovement(stateInfo, conditions, deltaTime = 1) {
        if (!this.movement) {
            console.error(`Bactéria ${this.id} sem sistema de movimento em processMovement`);
            return;
        }
        
        console.log(`Processando movimento da bactéria ${this.id}: estado=${stateInfo.state}`);
        
        // Obtém os parâmetros de movimento atuais
        const params = stateInfo.movementParams || {
            speed: 1.0,
            targetWeight: 0.5
        };
        
        // Não move se estiver descansando
        if (stateInfo.state === 'resting') {
            // Mesmo em descanso, aplica pequenos movimentos para parecer mais natural
            this.movement.moveRandom(deltaTime, 0.1);
            return;
        }
        
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
            awayVector.mult(100); // Fuga é mais rápida
            
            const escapePosInOppositeDirection = createVector(
                this.pos.x + awayVector.x,
                this.pos.y + awayVector.y
            );
            
            // Move-se para a posição oposta
            this.movement.moveTowards(escapePosInOppositeDirection, deltaTime, params.speed * 1.5);
        }
        // Estado de exploração ou padrão
        else {
            // Movimento aleatório para exploração
            this.movement.moveRandom(deltaTime, params.speed || 1.0);
            
            if (frameCount % 120 === 0) {
                console.log(`Bactéria ${this.id} movendo-se aleatoriamente: velocidade=${params.speed}`);
            }
        }
    }
    
    /**
     * Valida e corrige a posição da bactéria se necessário
     */
    validateAndFixPosition() {
        // Verifica se a posição existe
        if (!this.pos) {
            console.warn(`Bactéria ${this.id} sem posição, criando nova`);
            this.resetPosition();
            return;
        }
        
        // Verifica se pos.x é um objeto (erro comum)
        if (typeof this.pos.x === 'object') {
            console.warn(`Erro: this.pos.x é um objeto para bactéria ${this.id}:`, this.pos.x);
            
            // Tenta extrair x.x se disponível
            if (this.pos.x && typeof this.pos.x.x === 'number') {
                this.pos = {
                    x: this.pos.x.x,
                    y: (typeof this.pos.y === 'number' && !isNaN(this.pos.y)) ? this.pos.y : height/2
                };
                console.log(`Posição corrigida para bactéria ${this.id}:`, this.pos);
            } else {
                // Não foi possível recuperar, reseta posição
                this.resetPosition();
            }
            return;
        }
        
        // Verifica se as coordenadas são números válidos
        if (isNaN(this.pos.x) || isNaN(this.pos.y) || 
            !isFinite(this.pos.x) || !isFinite(this.pos.y)) {
            console.warn(`Posição inválida para bactéria ${this.id}: (${this.pos.x}, ${this.pos.y}), corrigindo`);
            this.resetPosition();
        }
    }
    
    /**
     * Reseta a posição da bactéria para uma posição válida dentro dos limites do mundo
     */
    resetPosition() {
        try {
            console.log(`Resetando posição da bactéria ${this.id}`);
            
            // Determina dimensões do mundo
            const worldWidth = width || 800;
            const worldHeight = height || 600;
            
            // Gera coordenadas seguras
            const safeX = Math.floor(random(worldWidth * 0.1, worldWidth * 0.9));
            const safeY = Math.floor(random(worldHeight * 0.1, worldHeight * 0.9));
            
            // Usa createVector se disponível (p5.js)
            if (typeof createVector === 'function') {
                try {
                    this.pos = createVector(safeX, safeY);
                    console.log(`Nova posição criada com createVector: (${this.pos.x}, ${this.pos.y})`);
                } catch (e) {
                    // Fallback para objeto simples se createVector falhar
                    this.pos = { x: safeX, y: safeY };
                    console.log(`Fallback para objeto simples: (${this.pos.x}, ${this.pos.y})`);
                }
            } else {
                // Cria objeto simples se createVector não estiver disponível
                this.pos = { x: safeX, y: safeY };
                console.log(`Posição criada com objeto simples: (${this.pos.x}, ${this.pos.y})`);
            }
            
            // Verificação final
            if (!this.pos || isNaN(this.pos.x) || isNaN(this.pos.y)) {
                console.error(`FALHA ao resetar posição para bactéria ${this.id}, usando fallback absoluto`);
                this.pos = { x: worldWidth/2, y: worldHeight/2 };
            }
        } catch (error) {
            console.error(`Erro crítico ao resetar posição: ${error}`);
            // Último recurso absoluto
            this.pos = { x: 400, y: 300 };
        }
    }
    
    /**
     * Reseta a bactéria para um estado seguro em caso de erro grave
     */
    resetToSafeState() {
        try {
            // Reseta posição
            this.resetPosition();
            
            // Reseta velocidade
            if (!this.vel || typeof this.vel !== 'object') {
                const angle = random(TWO_PI);
                this.vel = { 
                    x: cos(angle) * 3,
                    y: sin(angle) * 3
                };
                
                // Adiciona métodos de vetor se não existirem
                if (typeof this.vel.add !== 'function') {
                    this.vel.add = function(v) { 
                        this.x += v.x; 
                        this.y += v.y; 
                        return this; 
                    };
                }
                
                if (typeof this.vel.limit !== 'function') {
                    this.vel.limit = function(max) {
                        const mSq = this.x * this.x + this.y * this.y;
                        if (mSq > max * max) {
                            const norm = max / Math.sqrt(mSq);
                            this.x *= norm;
                            this.y *= norm;
                        }
                        return this;
                    };
                }
            }
            
            // Garante que a energia não é negativa
            if (this.energy < 0) this.energy = 20;
            
            console.log(`Bactéria ${this.id} restaurada para estado seguro`);
        } catch (error) {
            console.error(`Falha ao resetar para estado seguro: ${error}`);
        }
    }
    
    /**
     * Verifica colisão com as bordas do mundo e faz ricochete
     */
    checkBoundaryCollision() {
        if (!this.world || !this.pos || !this.vel) return;
        
        // Colisão com as bordas horizontais
        if (this.pos.x < 0 || this.pos.x > this.world.width) {
            this.vel.x *= -1; // Inverte velocidade horizontal
            // Corrige posição para dentro dos limites
            this.pos.x = constrain(this.pos.x, 0, this.world.width);
        }
        
        // Colisão com as bordas verticais
        if (this.pos.y < 0 || this.pos.y > this.world.height) {
            this.vel.y *= -1; // Inverte velocidade vertical
            // Corrige posição para dentro dos limites
            this.pos.y = constrain(this.pos.y, 0, this.world.height);
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
     * Verifica se a posição é válida
     * @returns {boolean} - True se a posição for válida
     */
    isPosValid() {
        return this.pos && 
               typeof this.pos.x === 'number' && 
               typeof this.pos.y === 'number' && 
               !isNaN(this.pos.x) && 
               !isNaN(this.pos.y) &&
               isFinite(this.pos.x) &&
               isFinite(this.pos.y);
    }
    
    /**
     * Verifica se a velocidade é válida
     * @returns {boolean} - True se a velocidade for válida
     */
    isVelValid() {
        return this.vel && 
               typeof this.vel.x === 'number' && 
               typeof this.vel.y === 'number' && 
               !isNaN(this.vel.x) && 
               !isNaN(this.vel.y) &&
               isFinite(this.vel.x) &&
               isFinite(this.vel.y) &&
               typeof this.vel.add === 'function';
    }
    
    /**
     * Inicializa as propriedades físicas da bactéria
     * @param {Object} params - Parâmetros de inicialização
     * @param {number} params.x - Posição X inicial
     * @param {number} params.y - Posição Y inicial
     * @param {Object} params.world - Referência ao mundo
     */
    initPhysics(params = {}) {
        try {
            // Converte parâmetros para números e valida
            let x = params.x;
            let y = params.y;
            
            // Verifica se parâmetros são números válidos
            if (typeof x !== 'number' || isNaN(x) || !isFinite(x)) {
                console.warn(`Bactéria ${this.id}: X inicial inválido (${x}), usando valor padrão`);
                x = (width || 800) / 2;
            }
            
            if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
                console.warn(`Bactéria ${this.id}: Y inicial inválido (${y}), usando valor padrão`);
                y = (height || 600) / 2;
            }
            
            // Garante que as coordenadas estão dentro dos limites válidos
            const worldWidth = params.world?.width || width || 800;
            const worldHeight = params.world?.height || height || 600;
            
            x = constrain(x, 10, worldWidth - 10);
            y = constrain(y, 10, worldHeight - 10);
            
            // Verifica se já temos uma posição e precisamos apenas corrigir
            if (this.pos) {
                // Verifica se pos.x é um objeto (caso problemático)
                if (typeof this.pos.x === 'object') {
                    console.warn(`Bactéria ${this.id}: pos.x é um objeto, corrigindo`, this.pos.x);
                    
                    // Tenta extrair x.x se disponível
                    if (this.pos.x && typeof this.pos.x.x === 'number') {
                        x = this.pos.x.x;
                    }
                    
                    // Recria o objeto pos
                    this.pos = typeof createVector === 'function' 
                        ? createVector(x, y)
                        : { x, y };
                } else {
                    // Atualiza as coordenadas existentes se forem válidas
                    this.pos.x = x;
                    this.pos.y = y;
                }
            } else {
                // Cria um vetor p5.js para a posição se não existir
                this.pos = typeof createVector === 'function' 
                    ? createVector(x, y)
                    : { x, y };
            }
            
            // Verificação adicional para garantir que pos.x e pos.y são números
            if (typeof this.pos.x !== 'number' || typeof this.pos.y !== 'number' ||
                isNaN(this.pos.x) || isNaN(this.pos.y)) {
                console.error(`Bactéria ${this.id}: Posição ainda contém valores inválidos após correção, recriando`);
                
                // Último recurso - cria um objeto literal simples
                this.pos = { 
                    x: x,
                    y: y
                };
            }
            
            // Define mundo e tamanho
            this.world = params.world || { width: worldWidth, height: worldHeight };
            this.size = params.size || 20;
            
            // Inicializa ou corrige a velocidade
            this.initializeVelocity();
            
            // Aceleração (inicialmente zero)
            this.acc = typeof createVector === 'function' 
                ? createVector(0, 0) 
                : { x: 0, y: 0 };
            
            // Verifica novamente se todos os vetores são válidos
            const isValid = this.isPosValid() && this.isVelValid();
            
            // Logs
            if (isValid) {
                console.log(`Bactéria ${this.id} inicializada com sucesso: pos=(${this.pos.x.toFixed(2)}, ${this.pos.y.toFixed(2)}), vel=(${this.vel.x.toFixed(2)}, ${this.vel.y.toFixed(2)})`);
            } else {
                console.error(`ERRO: Bactéria ${this.id} não foi inicializada corretamente`);
                this.resetPosition();
                this.initializeVelocity();
            }
        } catch (error) {
            console.error(`Erro crítico ao inicializar física da bactéria ${this.id}:`, error);
            
            // Garante valores padrão em caso de erro
            const worldWidth = width || 800;
            const worldHeight = height || 600;
            
            this.pos = {
                x: random(worldWidth * 0.1, worldWidth * 0.9),
                y: random(worldHeight * 0.1, worldHeight * 0.9)
            };
            this.initializeVelocity();
        }
    }
    
    /**
     * Inicializa ou corrige a velocidade da bactéria
     */
    initializeVelocity() {
        const angle = random(TWO_PI);
        const initialSpeed = 3.0;
        
        // Tenta criar usando p5.Vector
        if (typeof createVector === 'function') {
            this.vel = createVector(cos(angle) * initialSpeed, sin(angle) * initialSpeed);
            
            // Verifica se p5.Vector foi criado corretamente
            if (!this.vel || typeof this.vel.add !== 'function') {
                // Fallback para objeto literal com métodos
                this.vel = this.createVectorLike(cos(angle) * initialSpeed, sin(angle) * initialSpeed);
            }
        } else {
            // Cria objeto literal com métodos vetoriais
            this.vel = this.createVectorLike(cos(angle) * initialSpeed, sin(angle) * initialSpeed);
        }
        
        // Verificação final
        if (!this.vel || typeof this.vel.x !== 'number' || typeof this.vel.y !== 'number' ||
            isNaN(this.vel.x) || isNaN(this.vel.y)) {
            console.error(`Bactéria ${this.id}: Falha ao criar velocidade, usando valores fixos`);
            this.vel = this.createVectorLike(cos(angle) * initialSpeed, sin(angle) * initialSpeed);
        }
    }
    
    /**
     * Cria um vetor semelhante ao p5.Vector quando necessário
     */
    createVectorLike(x, y) {
        return typeof createVector === 'function' ? createVector(x, y) : { x, y };
    }
}

// Exporta a classe Bacteria para o escopo global
window.Bacteria = Bacteria;
console.log('✅ Classe Bacteria exportada para o escopo global');

// Log para garantir que a classe está disponível
setTimeout(() => {
    console.log(`🔍 Verificando classe Bacteria no escopo global: ${typeof window.Bacteria}`);
    
    // Tenta criar uma instância para verificar se o construtor está funcionando
    try {
        const testBacteria = new window.Bacteria({
            x: 100,
            y: 100,
            isFemale: true
        });
        console.log(`✅ Teste de criação de Bacteria bem-sucedido: ${!!testBacteria}`);
    } catch (error) {
        console.error(`❌ ERRO ao criar instância de teste de Bacteria:`, error);
    }
}, 2000); 