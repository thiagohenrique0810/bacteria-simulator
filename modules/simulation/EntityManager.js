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
                        
                        // Também define a posição do movimento para corresponder à bactéria
                        bacteria.movement.movement.position = bacteria.pos.copy();
                        
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
                    
                    // Cria uma instância real de Bacteria com o novo formato
                    const bacteria = new Bacteria({
                        x: x,
                        y: y,
                        parentDNA: null,
                        energy: this.initialEnergy,
                        initialState: "exploring",
                        initialEnergy: this.initialEnergy,
                        isFemale: isFemale
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
                                
                                // Também define a posição do movimento para corresponder à bactéria
                                bacteria.movement.movement.position = bacteria.pos.copy();
                                
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
                    
                    // Verifica sistema de estados
                    if (!bacteria.stateManager) {
                        console.error("Sistema de estados não inicializado para a bactéria", i);
                        bacteria.stateManager = new BacteriaStateManager(bacteria);
                        bacteria.stateManager.setCurrentState("exploring");
                    }
                    
                    // Adiciona à simulação
                    this.bacteria.push(bacteria);
                    
                    console.log(`Bactéria ${i+1}/${count} criada (${isFemale ? 'fêmea' : 'macho'})`);
                } catch (error) {
                    console.error(`Erro ao criar bactéria ${i+1}/${count}:`, error);
                    console.error(error.stack);
                }
            }
            
            // Atualiza estatísticas
            console.log(`Adicionadas ${this.bacteria.length - beforeCount} bactérias. Total: ${this.bacteria.length}`);
            
            // Atualiza o contador de bactérias
            if (this.simulation.stats) {
                this.simulation.stats.totalBacteria = this.bacteria.length;
            }
        } catch (error) {
            console.error("Erro geral ao adicionar bactérias:", error);
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