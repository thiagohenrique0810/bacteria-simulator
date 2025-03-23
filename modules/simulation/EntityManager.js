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
                simulation: this.simulation,
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
            
            bacteria.simulation = this.simulation; // Define referência à simulação
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
                    bacteria.simulation = this.simulation;
                    
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
                    
                    // Verifica sistemas essenciais
                    // Verifica se o movimento foi inicializado corretamente
                    if (!bacteria.movement) {
                        console.error("Movimento não inicializado para a bactéria", i);
                        bacteria.movement = new Movement(bacteria.pos.copy(), bacteria.size);
                    }
                    
                    // Inicializa a velocidade se estiver zerada
                    if (!bacteria.movement.velocity || 
                        typeof bacteria.movement.velocity.mag !== 'function' || 
                        bacteria.movement.velocity.mag() === 0) {
                        bacteria.movement.velocity = createVector(random(-1, 1), random(-1, 1));
                    }
                    
                    // Verifica sistema de estados
                    if (!bacteria.states) {
                        console.error("Sistema de estados não inicializado para a bactéria", i);
                        bacteria.states = new BacteriaStateManager();
                    }
                    
                    // Verifica sistema de reprodução
                    if (!bacteria.reproduction) {
                        console.error("Sistema de reprodução não inicializado para a bactéria", i);
                        bacteria.reproduction = new Reproduction(bacteria.isFemale);
                        bacteria.reproduction.setDNA(bacteria.dna);
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
}

// Torna a classe disponível globalmente
window.EntityManager = EntityManager; 