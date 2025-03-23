/**
 * Gerenciador de entidades da simulação
 * Responsável por adicionar, remover e gerenciar todas as entidades
 */
class EntityManager {
    /**
     * Inicializa o gerenciador de entidades
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Entidades
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];
        this.predators = [];
        this.effects = [];
        this.deadBacteria = []; // Lista de bactérias mortas aguardando transformação em comida
        
        // Configurações
        this.populationLimit = 100;
        this.initialEnergy = 150;
        this.foodValue = 50;
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
            // Gera genes aleatórios se não for fornecido DNA
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
            
            // Cria uma nova bactéria com o novo formato de construtor
            const bacteria = new Bacteria({
                x: x,
                y: y,
                parentDNA: dna,
                energy: energy,
                initialState: "exploring",
                initialEnergy: energy,
                isFemale: random() > 0.5
            });
            
            // Verifica sistema de movimento
            if (!bacteria.movement) {
                console.error("Movimento não inicializado para a bactéria", i);
                bacteria.movement = new BacteriaMovement(bacteria);
            }
            
            // Garantir que o sistema de movimento esteja completamente inicializado
            if (!bacteria.movement.movement) {
                console.warn("Sistema de movimento aninhado não existe para a bactéria", i);
                // Tenta recriar o sistema de movimento
                bacteria.movement = new BacteriaMovement(bacteria);
            }
            
            // Inicializa a velocidade se estiver zerada ou não existir
            if (!bacteria.movement.movement || 
                !bacteria.movement.movement.velocity || 
                typeof bacteria.movement.movement.velocity.mag !== 'function' || 
                bacteria.movement.movement.velocity.mag() === 0) {
                
                console.log(`Inicializando velocidade para bactéria ${i}`);
                
                // Cria uma velocidade inicial mais forte
                const initialVelocity = p5.Vector.random2D();
                initialVelocity.mult(3); // Velocidade mais alta para garantir o movimento
                
                try {
                    if (bacteria.movement.movement) {
                        bacteria.movement.movement.velocity = initialVelocity;
                        
                        // Garante que a posição do movimento é um vetor p5 válido
                        if (!bacteria.pos) {
                            console.error(`Bactéria ${i} sem posição válida ao configurar movimento`);
                            bacteria.pos = createVector(x, y);
                        }
                        
                        // Verifica se pos.x é um objeto antes de tentar fazer copy
                        if (typeof bacteria.pos.x === 'object') {
                            console.warn(`pos.x é um objeto ao configurar movimento da bactéria ${i}, corrigindo`);
                            const tempPos = createVector(
                                bacteria.pos.x && typeof bacteria.pos.x.x === 'number' ? bacteria.pos.x.x : x,
                                bacteria.pos.y && typeof bacteria.pos.y === 'number' ? bacteria.pos.y : y
                            );
                            bacteria.pos = tempPos;
                        }
                        
                        // Verifica se o método copy existe
                        if (typeof bacteria.pos.copy === 'function') {
                            bacteria.movement.movement.position = bacteria.pos.copy();
                        } else {
                            // Cria novo vetor se copy não estiver disponível
                            bacteria.movement.movement.position = createVector(bacteria.pos.x, bacteria.pos.y);
                        }
                        
                        // Valida a posição do movimento
                        if (!bacteria.movement.movement.position || typeof bacteria.movement.movement.position.x !== 'number') {
                            console.warn(`Posição de movimento inválida para bactéria ${i}, recriando`);
                            bacteria.movement.movement.position = createVector(x, y);
                        }
                        
                        // Garante que a posição e velocidade são números válidos
                        if (isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y)) {
                            console.error(`Bactéria ${i} tem posição NaN, corrigindo`);
                            bacteria.pos.x = x;
                            bacteria.pos.y = y;
                        }
                        
                        if (isNaN(bacteria.movement.movement.velocity.x) || isNaN(bacteria.movement.movement.velocity.y)) {
                            console.error(`Bactéria ${i} tem velocidade NaN, corrigindo`);
                            bacteria.movement.movement.velocity = p5.Vector.random2D().mult(3);
                        }
                        
                        // Garantir que maxSpeed não esteja zerado
                        if (bacteria.movement.movement.maxSpeed <= 0) {
                            bacteria.movement.movement.maxSpeed = 4;
                        }
                        
                        // Aplica uma força inicial também
                        const initialForce = p5.Vector.random2D();
                        initialForce.mult(2);
                        bacteria.movement.movement.applyForce(initialForce);
                        
                        console.log(`Velocidade inicial configurada: ${initialVelocity.mag().toFixed(2)}`);
                    } else {
                        // Em caso de falha na estrutura aninhada, tenta criar um movimento direto
                        console.warn("Criando um sistema de movimento manual para a bactéria", i);
                        bacteria.movement = {
                            movement: new Movement(bacteria.pos.copy(), bacteria.size),
                            moveRandom: function(dt, speedModifier) {
                                const dir = p5.Vector.random2D();
                                dir.mult(speedModifier || 1);
                                this.movement.applyForce(dir);
                                this.movement.update(0, [], bacteria.size, false, dt);
                            }
                        };
                        
                        // Inicializa a velocidade do novo movimento
                        bacteria.movement.movement.velocity = initialVelocity;
                    }
                } catch (error) {
                    console.error("Erro ao inicializar movimento:", error);
                }
            }
            
            // Adiciona à lista de bactérias
            this.bacteria.push(bacteria);
            console.log(`Bactéria adicionada em (${x.toFixed(0)},${y.toFixed(0)}), gênero: ${bacteria.isFemale ? 'feminino' : 'masculino'}`);
            
            // Atualiza estatísticas
            if (this.simulation && this.simulation.statsManager && 
                typeof this.simulation.statsManager.incrementStat === 'function') {
                this.simulation.statsManager.incrementStat('totalBacteria');
            } else {
                console.log(`ℹ️ Estatística não registrada: statsManager ou método incrementStat não disponível`);
            }
            
            console.log(`✅ Bactéria adicionada com sucesso, ID: ${bacteria.id}, Total: ${this.bacteria.length}`);
            
            return bacteria;
        } catch (error) {
            console.error("Erro ao adicionar bactéria:", error);
            console.error(error.stack);
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
            this.simulation.stats.mutations++;
        }

        return this.addBacteria(x, y, childDNA);
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
     * @param {number} femaleRatio - Percentual de fêmeas (0-100)
     * @returns {number} - Número de bactérias adicionadas
     */
    addMultipleBacteria(count, femaleRatio) {
        console.log(`🚀 INICIANDO CRIAÇÃO DE BACTÉRIAS: ${count} bactérias, ${femaleRatio}% fêmeas`);
        
        // Depuração: Verifica se o EntityManager está sendo chamado corretamente
        console.log(`🔍 Contexto: EntityManager é válido? ${!!this}`);
        console.log(`🔍 Contexto: Classe atual: ${this.constructor.name}`);
        console.log(`🔍 Referência à simulação: ${!!this.simulation}`);
        
        // Garante valores válidos
        count = Math.max(1, Math.min(100, count));
        femaleRatio = Math.max(0, Math.min(100, femaleRatio));
        
        // Número de fêmeas a serem criadas
        const femaleCount = Math.round(count * (femaleRatio / 100));
        
        // Tamanho do array de bactérias antes
        const beforeCount = this.bacteria ? this.bacteria.length : 0;
        
        console.log(`🔍 Array de bactérias existe? ${!!this.bacteria}`);
        console.log(`🔍 Tamanho do array de bactérias: ${beforeCount}`);
        
        // Verificação do ambiente p5.js
        if (typeof width !== 'number' || typeof height !== 'number' || 
            typeof createVector !== 'function') {
            console.error(`❌ ERRO CRÍTICO: Ambiente p5.js não inicializado corretamente.`);
            console.error(`width: ${width}, height: ${height}, createVector: ${typeof createVector}`);
            return;
        }
        
        // Verificação da disponibilidade da classe Bacteria
        if (typeof Bacteria !== 'function') {
            console.error(`❌ ERRO CRÍTICO: Classe Bacteria não encontrada.`);
            console.log(`🔍 Tipo de Bacteria: ${typeof Bacteria}`);
            console.log(`🔍 window.Bacteria existe? ${!!window.Bacteria}`);
            return;
        }
        
        try {
            // Adiciona as bactérias
            for (let i = 0; i < count; i++) {
                try {
                    // Determina se esta bactéria será fêmea
                    const isFemale = i < femaleCount;
                    
                    // Gera posição aleatória dentro da área visível
                    const x = Math.floor(random(width * 0.1, width * 0.9));
                    const y = Math.floor(random(height * 0.1, height * 0.9));
                    
                    console.log(`🦠 Criando bactéria ${i+1}: ${isFemale ? 'Fêmea' : 'Macho'} em (${x}, ${y})`);
                    
                    // Criar uma instância de bactéria diretamente sem passar por outras funções
                    const bacteria = new Bacteria({
                        x: x,
                        y: y,
                        isFemale: isFemale,
                        energy: this.initialEnergy,
                        initialEnergy: this.initialEnergy,
                        initialState: "exploring"
                    });
                    
                    // Verificações críticas antes de adicionar à lista
                    if (!bacteria) {
                        console.error(`❌ Falha ao criar bactéria ${i+1}: Instância não foi criada`);
                        continue;
                    }
                    
                    if (!bacteria.pos || typeof bacteria.pos.x !== 'number' || isNaN(bacteria.pos.x)) {
                        console.warn(`⚠️ Bactéria ${i+1} tem posição inválida, corrigindo...`);
                        bacteria.pos = createVector(x, y);
                    }
                    
                    // Define a simulação na bactéria
                    bacteria.simulation = this.simulation;
                    
                    // SOLUÇÃO RADICAL: Verifica e inicializa explicitamente o componente de movimento
                    if (!bacteria.movement) {
                        console.log(`🔧 Inicializando movimento para bactéria ${i+1} (ID: ${bacteria.id || 'N/A'})`);
                        bacteria.movement = new BacteriaMovement(bacteria);
                    }
                    
                    // SOLUÇÃO RADICAL: Força movimento inicial para garantir que comecem a se mover imediatamente
                    try {
                        // Aplica movimento diretamente na posição
                        const randomAngle = random(TWO_PI);
                        const moveX = cos(randomAngle) * 5;
                        const moveY = sin(randomAngle) * 5;
                        
                        // Armazena ângulo inicial para movimento contínuo
                        bacteria._movementAngle = randomAngle;
                        
                        // Guarda uma referência para esse ângulo no componente de movimento
                        if (bacteria.movement) {
                            bacteria.movement._movementAngle = randomAngle;
                        }
                        
                        // Aplica movimento inicial para garantir que as bactérias comecem em posições diferentes
                        bacteria.pos.x += moveX;
                        bacteria.pos.y += moveY;
                        
                        console.log(`🔄 Movimento inicial aplicado à bactéria ${i+1}: ângulo=${(randomAngle * 180 / Math.PI).toFixed(0)}°`);
                    } catch (moveError) {
                        console.error(`⚠️ Não foi possível aplicar movimento inicial à bactéria ${i+1}:`, moveError);
                    }
                    
                    // Adiciona à lista de bactérias diretamente
                    this.bacteria.push(bacteria);
                    
                    // RADICAL: Força uma atualização inicial
                    try {
                        bacteria.update(1);
                        console.log(`✓ Atualização inicial da bactéria ${i+1} concluída`);
                    } catch (updateError) {
                        console.error(`⚠️ Falha na atualização inicial da bactéria ${i+1}:`, updateError);
                    }
                    
                    // Atualiza estatísticas
                    if (this.simulation && this.simulation.statsManager && 
                        typeof this.simulation.statsManager.incrementStat === 'function') {
                        this.simulation.statsManager.incrementStat('totalBacteria');
                    } else {
                        console.log(`ℹ️ Estatística não registrada: statsManager ou método incrementStat não disponível`);
                    }
                    
                    console.log(`✅ Bactéria ${i+1} adicionada com sucesso! ID: ${bacteria.id}`);
                    
                } catch (error) {
                    console.error(`❌ Erro ao criar bactéria ${i+1}:`, error);
                    console.error(error.stack);
                }
            }
            
        } catch (error) {
            console.error("❌ Erro global na criação de bactérias:", error);
            console.error(error.stack);
        }
        
        // Verifica quantas bactérias foram adicionadas
        const afterCount = this.bacteria ? this.bacteria.length : 0;
        const addedCount = afterCount - beforeCount;
        
        console.log(`📊 RESUMO: Adicionadas ${addedCount}/${count} bactérias. Total atual: ${afterCount}`);
        
        // RADICAL: Faz uma atualização de todas as bactérias para garantir que estão se movendo
        console.log(`🔄 Iniciando atualização forçada de todas as bactérias...`);
        try {
            if (this.bacteria && this.bacteria.length > 0) {
                this.bacteria.forEach((bacteria, index) => {
                    if (bacteria && bacteria.movement) {
                        // Aplica um movimento aleatório forçado
                        bacteria.movement.moveRandom(1, 2.0);
                        console.log(`🔄 Movimento forçado aplicado à bactéria ${index + 1}`);
                    }
                });
            }
        } catch (massUpdateError) {
            console.error(`⚠️ Erro na atualização forçada das bactérias:`, massUpdateError);
        }
        
        // Notificação ao usuário
        if (addedCount > 0) {
            if (typeof createDiv === 'function') {
                const notification = createDiv(`${addedCount} bactérias adicionadas com sucesso!`);
                notification.position(10, 10);
                notification.style('background-color', 'rgba(50, 205, 50, 0.8)');
                notification.style('color', 'white');
                notification.style('padding', '10px');
                notification.style('border-radius', '5px');
                notification.style('font-weight', 'bold');
                
                // Remove após 3 segundos
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        } else {
            console.error("❌ FALHA: Nenhuma bactéria foi adicionada!");
            
            if (typeof createDiv === 'function') {
                const errorNotification = createDiv("Falha ao adicionar bactérias. Verifique o console.");
                errorNotification.position(10, 10);
                errorNotification.style('background-color', 'rgba(220, 50, 50, 0.8)');
                errorNotification.style('color', 'white');
                errorNotification.style('padding', '10px');
                errorNotification.style('border-radius', '5px');
                errorNotification.style('font-weight', 'bold');
                
                // Remove após 5 segundos
                setTimeout(() => {
                    errorNotification.remove();
                }, 5000);
            }
        }
        
        return addedCount;
    }
    
    /**
     * Gera comida na simulação
     * @param {number} amount - Quantidade de comida para gerar
     */
    generateFood(amount) {
        for (let i = 0; i < amount; i++) {
            this.addFood(
                random(this.simulation.width),
                random(this.simulation.height),
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
                random(this.simulation.width - 100),
                random(this.simulation.height - 100),
                random(20, 100),
                random(20, 100)
            ));
        }
    }
    
    /**
     * Atualiza obstáculos baseado no controle
     */
    updateObstacles() {
        console.log('Atualizando obstáculos...');
        console.log('Quantidade atual:', this.obstacles.length);
        console.log('Quantidade alvo:', this.simulation.maxObstacles);

        const currentCount = this.obstacles.length;
        const targetCount = this.simulation.maxObstacles;

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
                    random(this.simulation.width - 100),
                    random(this.simulation.height - 100),
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
     * Limpa todas as entidades
     */
    clear() {
        this.bacteria = [];
        this.food = [];
        this.obstacles = [];
        this.predators = [];
        this.effects = [];
    }
    
    /**
     * Atualiza os efeitos visuais
     */
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update();
            
            if (this.effects[i].isDone) {
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Adiciona uma bactéria à lista de bactérias mortas
     * @param {Bacteria} bacteria - A bactéria que morreu
     */
    addDeadBacteria(bacteria) {
        try {
            // Verifica se a bactéria é válida
            if (!bacteria || !bacteria.pos) {
                console.warn("Tentativa de adicionar bactéria morta inválida");
                return;
            }
            
            // Adiciona a bactéria à lista de mortas com um temporizador
            this.deadBacteria.push({
                pos: bacteria.pos.copy(), // Copia a posição para evitar referências
                size: bacteria.size || 10,
                timer: 180, // 3 segundos a 60 FPS
                nutrition: Math.max(10, Math.round(bacteria.size * 3)) // Comida proporcional ao tamanho
            });
            
            console.log(`Bactéria adicionada à lista de mortas. Total: ${this.deadBacteria.length}`);
        } catch (error) {
            console.error("Erro ao adicionar bactéria morta:", error);
        }
    }
    
    /**
     * Processa as bactérias mortas, transformando-as em comida após o tempo definido
     */
    processDeadBacteria() {
        // Se não há bactérias mortas, retorna
        if (this.deadBacteria.length === 0) return;
        
        try {
            // Percorre a lista de trás para frente para remover com segurança
            for (let i = this.deadBacteria.length - 1; i >= 0; i--) {
                // Diminui o temporizador
                this.deadBacteria[i].timer--;
                
                // Se o temporizador acabou, transforma em comida
                if (this.deadBacteria[i].timer <= 0) {
                    const deadBac = this.deadBacteria[i];
                    
                    // Cria nova comida na posição da bactéria morta
                    this.addFood(
                        deadBac.pos.x, 
                        deadBac.pos.y, 
                        deadBac.nutrition
                    );
                    
                    // Adiciona um efeito visual para indicar a transformação
                    if (this.simulation.effects) {
                        const effect = new PopEffect(
                            deadBac.pos.x, 
                            deadBac.pos.y, 
                            "🌱", // Símbolo para indicar transformação em comida
                            20
                        );
                        this.simulation.effects.push(effect);
                    }
                    
                    // Remove da lista de bactérias mortas
                    this.deadBacteria.splice(i, 1);
                }
            }
        } catch (error) {
            console.error("Erro ao processar bactérias mortas:", error);
        }
    }

    /**
     * Desenha as bactérias mortas na tela
     */
    drawDeadBacteria() {
        // Se não há bactérias mortas, retorna
        if (this.deadBacteria.length === 0) return;
        
        try {
            // Configura o estilo de desenho
            push();
            noStroke();
            
            // Desenha cada bactéria morta
            for (const deadBac of this.deadBacteria) {
                // Calcula a transparência baseada no tempo restante
                // Quanto mais próximo de se transformar em comida, mais transparente fica
                const alpha = map(deadBac.timer, 0, 180, 50, 200);
                
                // Cor cinza esverdeada para indicar decomposição
                fill(100, 130, 100, alpha);
                
                // Desenha o corpo em decomposição
                circle(deadBac.pos.x, deadBac.pos.y, deadBac.size);
                
                // Adiciona um indicador visual do tempo restante (opcional)
                if (deadBac.timer < 60) { // Mostra apenas no último segundo
                    // Desenha pequenos pontos verdes ao redor da bactéria
                    const numDots = map(deadBac.timer, 0, 60, 8, 1);
                    const radius = deadBac.size * 0.7;
                    
                    fill(50, 220, 50, alpha);
                    for (let i = 0; i < numDots; i++) {
                        const angle = map(i, 0, numDots, 0, TWO_PI);
                        const dotX = deadBac.pos.x + cos(angle) * radius;
                        const dotY = deadBac.pos.y + sin(angle) * radius;
                        circle(dotX, dotY, 3);
                    }
                }
            }
            
            pop();
        } catch (error) {
            console.error("Erro ao desenhar bactérias mortas:", error);
        }
    }

    /**
     * Adiciona uma instância de bactéria já criada à simulação
     * @param {Bacteria} bacteria - A instância de bactéria a ser adicionada
     */
    addBacteriaInstance(bacteria) {
        if (!bacteria) {
            console.warn("⚠️ Tentativa de adicionar uma bactéria indefinida");
            return;
        }
        
        // Garante que a bactéria tem uma posição válida
        if (!bacteria.pos || typeof bacteria.pos.x !== 'number' || typeof bacteria.pos.y !== 'number' || 
            isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y)) {
            console.warn("⚠️ Tentativa de adicionar bactéria com posição inválida, corrigindo...");
            
            // Criar posição válida
            const safeX = random(width * 0.1, width * 0.9);
            const safeY = random(height * 0.1, height * 0.9);
            
            // Usa createVector se disponível
            if (typeof createVector === 'function') {
                bacteria.pos = createVector(safeX, safeY);
            } else {
                bacteria.pos = { x: safeX, y: safeY };
            }
        }
        
        // Garante que a bactéria tem um sistema de movimento
        if (!bacteria.movement) {
            console.warn("⚠️ Bactéria sem sistema de movimento, tentando criar...");
            try {
                bacteria.movement = new BacteriaMovement(bacteria);
            } catch (error) {
                console.error("❌ Erro ao criar sistema de movimento:", error);
            }
        }
        
        // Garante que a bactéria tem uma referência à simulação
        if (!bacteria.simulation) {
            console.log("🔄 Definindo referência à simulação para a bactéria");
            bacteria.simulation = this.simulation;
        }
        
        // Indica na simulação que esta bactéria é válida
        bacteria._validInSimulation = true;
        
        // Adiciona à lista de bactérias
        this.bacteria.push(bacteria);
        
        // Atualiza estatísticas, se disponível
        if (this.simulation && this.simulation.statsManager) {
            this.simulation.statsManager.incrementStat('totalBacteria');
        }
        
        console.log(`✅ Bactéria adicionada com sucesso, ID: ${bacteria.id}, Total: ${this.bacteria.length}`);
    }

    /**
     * Inicializa a simulação e configura as propriedades
     * @param {Simulation} simulation - Referência para a simulação
     */
    initializeSimulation(simulation) {
        this.simulation = simulation;
        
        if (this.simulation) {
            console.log('🚀 EntityManager: Inicializando configurações da simulação');
            
            // Configura a grade espacial
            if (this.simulation.spatialGrid) {
                this.spatialGrid = this.simulation.spatialGrid;
                console.log('✅ EntityManager: Grade espacial configurada');
            }
            
            // Define o callback de gerenciamento de recursos
            this.handleResourceInteraction = (bacteria, foodItem) => {
                this.simulation.handleFoodConsumption(bacteria, foodItem);
            };
            
            // Define o callback para remoção de entidades
            this.entityRemovalCallback = (entity) => {
                this.simulation.handleEntityRemoval(entity);
            };
            
            // Configura o sistema de energia e estatísticas
            this.setupLifecycle();
            
            // Configura o sistema de doenças, se disponível
            if (this.simulation.diseaseSystem) {
                this.diseaseSystem = this.simulation.diseaseSystem;
                console.log('✅ EntityManager: Sistema de doenças configurado');
            }
            
            // Inicializa os callbacks adicionais da simulação
            if (typeof this.simulation.postInitialize === 'function') {
                this.simulation.postInitialize();
                console.log('✅ EntityManager: Métodos adicionais da simulação inicializados');
            }
            
            console.log('✅ EntityManager: Simulação inicializada com sucesso');
        } else {
            console.error('❌ EntityManager: Falha ao inicializar simulação - referência inválida');
        }
    }

    /**
     * Atualiza todas as entidades na simulação
     * @param {number} deltaTime - Tempo desde último frame
     */
    update(deltaTime = 1) {
        this.debugUpdateCycles = (this.debugUpdateCycles || 0) + 1;
        
        // Log a cada 60 frames para não sobrecarregar o console
        const shouldLog = this.debugUpdateCycles % 60 === 0;
        
        if (shouldLog) {
            console.log(`[EntityManager] Atualizando entidades - Frame: ${this.debugUpdateCycles}`);
            console.log(`[EntityManager] Bactérias: ${this.bacteria ? this.bacteria.length : 0}`);
        }
        
        try {
            // Atualiza bactérias
            if (this.bacteria && this.bacteria.length > 0) {
                const bacteriaMoving = [];
                
                // Itera bactérias para atualização
                for (let i = 0; i < this.bacteria.length; i++) {
                    const bacteria = this.bacteria[i];
                    
                    if (!bacteria) {
                        if (shouldLog) console.warn(`[EntityManager] Bactéria nula no índice ${i}, removendo...`);
                        continue;
                    }
                    
                    try {
                        // Salva posição antes do update
                        const prevPos = bacteria.pos ? { x: bacteria.pos.x, y: bacteria.pos.y } : null;
                        
                        // Atualiza a bactéria
                        bacteria.update(deltaTime);
                        
                        // Verifica se a bactéria se moveu
                        if (prevPos && bacteria.pos) {
                            const dx = bacteria.pos.x - prevPos.x;
                            const dy = bacteria.pos.y - prevPos.y;
                            const distMoved = Math.sqrt(dx*dx + dy*dy);
                            
                            // Se a bactéria se moveu mais de 0.1 pixels, considera que houve movimento
                            if (distMoved > 0.1) {
                                bacteriaMoving.push({ id: bacteria.id, dist: distMoved });
                            }
                        }
                    } catch (error) {
                        console.error(`[EntityManager] Erro ao atualizar bactéria ${i}:`, error);
                    }
                }
                
                // Registra quantas bactérias estão se movendo
                if (shouldLog && bacteriaMoving.length > 0) {
                    console.log(`[EntityManager] ${bacteriaMoving.length}/${this.bacteria.length} bactérias se movendo.`);
                    // Mostra as primeiras 3 bactérias com movimento
                    bacteriaMoving.slice(0, 3).forEach(b => {
                        console.log(`[EntityManager] Bactéria ${b.id} moveu ${b.dist.toFixed(2)} pixels.`);
                    });
                }
            } else if (shouldLog) {
                console.warn("[EntityManager] Array de bactérias vazio ou indefinido");
            }
            
            // Atualiza comida
            if (this.food && this.food.length > 0) {
                for (let i = 0; i < this.food.length; i++) {
                    try {
                        const food = this.food[i];
                        if (food && typeof food.update === 'function') {
                            food.update(deltaTime);
                        }
                    } catch (error) {
                        console.error(`[EntityManager] Erro ao atualizar comida ${i}:`, error);
                    }
                }
            }
            
            // Atualiza obstáculos
            if (this.obstacles && this.obstacles.length > 0) {
                for (let i = 0; i < this.obstacles.length; i++) {
                    try {
                        const obstacle = this.obstacles[i];
                        if (obstacle && typeof obstacle.update === 'function') {
                            obstacle.update(deltaTime);
                        }
                    } catch (error) {
                        console.error(`[EntityManager] Erro ao atualizar obstáculo ${i}:`, error);
                    }
                }
            }
            
            // Atualiza efeitos visuais
            if (this.effects && this.effects.length > 0) {
                // Filtra efeitos expirados
                this.effects = this.effects.filter(effect => {
                    try {
                        if (!effect) return false;
                        effect.update(deltaTime);
                        return !effect.isExpired();
                    } catch (error) {
                        console.error(`[EntityManager] Erro ao atualizar efeito:`, error);
                        return false;
                    }
                });
            }
            
            // Processa colisões entre entidades
            if (typeof this.processCollisions === 'function') {
                this.processCollisions();
            } else {
                console.error("[EntityManager] Método processCollisions não encontrado!");
                // Implementação de emergência para evitar erros
                this.processCollisionsEmergency();
            }
            
        } catch (error) {
            console.error("[EntityManager] Erro crítico no update:", error);
        }
    }

    /**
     * Implementação de emergência para processar colisões
     * Usado como fallback se o método original não for encontrado
     */
    processCollisionsEmergency() {
        try {
            console.log("[EntityManager] Usando processador de colisões de emergência");
            // Implementação simplificada para evitar crashes
            if (!this.bacteria || this.bacteria.length < 2) return;
            
            // Filtrar bactérias válidas
            const validBacteria = this.bacteria.filter(b => 
                b && b.pos && typeof b.pos.x === 'number' && typeof b.pos.y === 'number'
            );
            
            // Processar apenas uma amostra para não sobrecarregar
            const sampleSize = Math.min(validBacteria.length, 20);
            for (let i = 0; i < sampleSize; i++) {
                for (let j = i + 1; j < sampleSize; j++) {
                    const b1 = validBacteria[i];
                    const b2 = validBacteria[j];
                    
                    // Calcular distância
                    const d = dist(b1.pos.x, b1.pos.y, b2.pos.x, b2.pos.y);
                    const minDist = (b1.size + b2.size) / 2;
                    
                    // Se estiver colidindo, separe-os
                    if (d < minDist) {
                        // Separação simples
                        const angle = Math.atan2(b2.pos.y - b1.pos.y, b2.pos.x - b1.pos.x);
                        const moveAmount = (minDist - d) / 2;
                        
                        b1.pos.x -= Math.cos(angle) * moveAmount;
                        b1.pos.y -= Math.sin(angle) * moveAmount;
                        b2.pos.x += Math.cos(angle) * moveAmount;
                        b2.pos.y += Math.sin(angle) * moveAmount;
                    }
                }
            }
        } catch (error) {
            console.error("[EntityManager] Erro no processador de colisões de emergência:", error);
        }
    }
    
    /**
     * Processa colisões entre entidades no simulador
     * Método principal para detecção e resposta a colisões
     */
    processCollisions() {
        try {
            // Verificação rápida se há entidades suficientes para processamento
            if (!this.bacteria || this.bacteria.length < 2) {
                return;
            }
            
            // Filtra apenas bactérias válidas para processamento
            const validBacteria = this.bacteria.filter(b => 
                b && b.pos && typeof b.pos.x === 'number' && typeof b.pos.y === 'number' && 
                !isNaN(b.pos.x) && !isNaN(b.pos.y)
            );
            
            // Processa colisões entre pares de bactérias
            for (let i = 0; i < validBacteria.length; i++) {
                const b1 = validBacteria[i];
                
                for (let j = i + 1; j < validBacteria.length; j++) {
                    const b2 = validBacteria[j];
                    
                    // Calcula a distância entre as bactérias
                    const dx = b2.pos.x - b1.pos.x;
                    const dy = b2.pos.y - b1.pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Determina se há colisão
                    const minDist = (b1.size + b2.size) / 2;
                    
                    if (distance < minDist) {
                        // Há colisão, resolve a separação física
                        
                        // Normaliza o vetor direção
                        const nx = dx / distance;
                        const ny = dy / distance;
                        
                        // Calcula o quanto precisa separar
                        const moveAmount = (minDist - distance) / 2;
                        
                        // Move as bactérias para longe uma da outra
                        b1.pos.x -= nx * moveAmount;
                        b1.pos.y -= ny * moveAmount;
                        b2.pos.x += nx * moveAmount;
                        b2.pos.y += ny * moveAmount;
                        
                        // Simula um "rebote" nos sistemas de movimento
                        if (b1.movement && b1.movement.movement && 
                            b2.movement && b2.movement.movement) {
                            
                            // Troca as velocidades entre as bactérias (simplificado)
                            const t1x = b1.movement.movement.velocity.x;
                            const t1y = b1.movement.movement.velocity.y;
                            const t2x = b2.movement.movement.velocity.x;
                            const t2y = b2.movement.movement.velocity.y;
                            
                            // Aplica um fator de amortecimento (0.8)
                            b1.movement.movement.velocity.x = t2x * 0.8;
                            b1.movement.movement.velocity.y = t2y * 0.8;
                            b2.movement.movement.velocity.x = t1x * 0.8;
                            b2.movement.movement.velocity.y = t1y * 0.8;
                        }
                        
                        // Verifica possibilidade de reprodução se forem sexos opostos
                        if (b1.isFemale !== b2.isFemale && Math.random() < 0.3) {
                            // Identifica fêmea e macho
                            const female = b1.isFemale ? b1 : b2;
                            const male = b1.isFemale ? b2 : b1;
                            
                            // Verifica energia para reprodução
                            if (female.stateManager && male.stateManager && 
                                female.stateManager.currentEnergy > 70 && 
                                male.stateManager.currentEnergy > 70) {
                                
                                // Tenta reproduzir se o método existir
                                if (typeof female.reproduce === 'function') {
                                    const child = female.reproduce(male);
                                    if (child) {
                                        this.bacteria.push(child);
                                        console.log(`Nova bactéria nasceu! ID: ${child.id}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Log a cada 300 frames
            if (frameCount % 300 === 0) {
                console.log(`Processamento de colisões: ${validBacteria.length} bactérias válidas`);
            }
            
        } catch (error) {
            console.error("[EntityManager] Erro ao processar colisões:", error);
            // Em caso de erro, tenta o método de emergência
            this.processCollisionsEmergency();
        }
    }
}

// Torna a classe disponível globalmente
window.EntityManager = EntityManager; 