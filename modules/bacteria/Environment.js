/**
 * Classe responsável pela análise do ambiente ao redor da bactéria
 */
class BacteriaEnvironment {
    /**
     * Inicializa o módulo de análise de ambiente
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        
        // Adiciona controle de tempo para detecção de parceiros
        this.lastMateDetectionTime = 0;
        this.mateDetectionCooldown = 120; // 2 segundos em 60fps
        
        // Rastreia as bactérias e obstáculos identificados recentemente
        this.recentlyIdentifiedBacteria = new Map();
        this.recentlyIdentifiedObstacles = new Map();
        
        // Propriedades para rastreamento de bactérias e obstáculos
        this.identificationRange = this.bacteria?.perceptionRadius || 150; 
        this.identificationMemoryTime = 300; // Frames que a bactéria se lembra de outra entidade
    }

    /**
     * Analisa o ambiente em volta
     * @param {Array} food - Array de comida (opcional)
     * @param {Array} predators - Array de predadores (opcional)
     * @param {Array} obstacles - Array de obstáculos (opcional)
     * @param {Array} entities - Array de todas as entidades (opcional)
     * @returns {Object} - Condições do ambiente
     */
    analyzeEnvironment(food, predators, obstacles, entities) {
        // Inicializa objeto de condições
        const conditions = {
            foodNearby: false,
            mateNearby: false,
            mateReady: false, // Nova flag para indicar se a reprodução está realmente possível
            mateTarget: null,
            predatorNearby: false,
            foodTarget: null,
            predatorTarget: null,
            obstacleNearby: false,
            obstacles: [],
            // Novas propriedades para bactérias e obstáculos identificados
            nearbyBacteria: [],
            sameSpeciesBacteria: [],
            differentSpeciesBacteria: [],
            identifiedObstacles: []
        };

        // Tenta obter os dados da simulação se não foram fornecidos
        try {
            // Verifica se window.simulationInstance está disponível
            if (!food && window.simulationInstance && window.simulationInstance.foodManager) {
                food = window.simulationInstance.foodManager.getFoodArray();
            }
            
            if (!predators && window.simulationInstance && window.simulationInstance.predatorManager) {
                predators = window.simulationInstance.predatorManager.getPredators();
            }
            
            if (!obstacles && window.simulationInstance && window.simulationInstance.obstacleManager) {
                obstacles = window.simulationInstance.obstacleManager.getObstacles();
            }
            
            if (!entities && window.simulationInstance && window.simulationInstance.entityManager) {
                entities = window.simulationInstance.entityManager.getBacteria();
            }
        } catch (error) {
            console.warn("Erro ao obter dados da simulação:", error);
        }

        // Garante que os arrays são válidos
        food = Array.isArray(food) ? food : [];
        predators = Array.isArray(predators) ? predators : [];
        obstacles = Array.isArray(obstacles) ? obstacles : [];
        entities = Array.isArray(entities) ? entities : [];
        
        // Registra para depuração
        if (this.bacteria && this.bacteria.age % 300 === 0) {
            console.log(`Ambiente da bactéria ${this.bacteria.id}: ${food.length} comidas, ${predators.length} predadores, ${obstacles.length} obstáculos, ${entities.length} entidades`);
        }

        // Verifica comida próxima
        for (const f of food) {
            if (!f || !f.position) continue;
            
            const d = dist(this.bacteria.pos.x, this.bacteria.pos.y, f.position.x, f.position.y);
            if (d < this.bacteria.perceptionRadius) {
                conditions.foodNearby = true;
                
                // Se não tiver alvo de comida ou se esta comida estiver mais perto
                if (!conditions.foodTarget || d < dist(this.bacteria.pos.x, this.bacteria.pos.y, conditions.foodTarget.position.x, conditions.foodTarget.position.y)) {
                    conditions.foodTarget = f;
                }
            }
        }

        // Armazena obstáculos para uso no sistema de movimento
        conditions.obstacles = obstacles;

        // Verifica predadores próximos
        for (const p of predators) {
            if (!p || !p.pos) continue;
            
            const d = dist(this.bacteria.pos.x, this.bacteria.pos.y, p.pos.x, p.pos.y);
            if (d < this.bacteria.perceptionRadius) {
                conditions.predatorNearby = true;
                
                // Se não tiver alvo de predador ou se este predador estiver mais perto
                if (!conditions.predatorTarget || d < dist(this.bacteria.pos.x, this.bacteria.pos.y, conditions.predatorTarget.pos.x, conditions.predatorTarget.pos.y)) {
                    conditions.predatorTarget = p;
                }
            }
        }

        // Identifica e processa outras bactérias próximas
        this.identifyNearbyBacteria(entities, conditions);
        
        // Identifica e processa obstáculos no ambiente
        this.identifyObstacles(obstacles, conditions);

        // Verifica bactérias compatíveis para reprodução (com cooldown)
        const currentTime = frameCount;
        const mateDetectionReady = currentTime - this.lastMateDetectionTime >= this.mateDetectionCooldown;
        
        // Só busca parceiros se estiver fora do período de cooldown
        if (mateDetectionReady) {
            let foundMate = false;
            
            for (const e of entities) {
                if (!e || !(e instanceof Bacteria) || e === this.bacteria) continue;
                
                // Verifica se é um parceiro em potencial (sexo oposto)
                if (e.isFemale !== this.bacteria.isFemale) {
                    const d = dist(this.bacteria.pos.x, this.bacteria.pos.y, e.pos.x, e.pos.y);
                    if (d < this.bacteria.perceptionRadius) {
                        // Obtém a energia do parceiro potencial e da própria bactéria
                        let partnerEnergy = 0;
                        let bacteriaEnergy = 0;
                        
                        // Verifica energia do parceiro
                        if (e.stateManager && e.stateManager.currentEnergy !== undefined) {
                            partnerEnergy = e.stateManager.currentEnergy;
                        } else if (e.states && typeof e.states.getEnergy === 'function') {
                            partnerEnergy = e.states.getEnergy();
                        }
                        
                        // Verifica energia da própria bactéria
                        if (this.bacteria.stateManager && this.bacteria.stateManager.currentEnergy !== undefined) {
                            bacteriaEnergy = this.bacteria.stateManager.currentEnergy;
                        } else if (this.bacteria.states && typeof this.bacteria.states.getEnergy === 'function') {
                            bacteriaEnergy = this.bacteria.states.getEnergy();
                        }
                        
                        // Requisitos mais rigorosos para reprodução:
                        // 1. Ambos devem ter energia suficiente (aumentado para 80)
                        // 2. Parceiros devem estar mais próximos (75% do raio de percepção)
                        // 3. Verificação adicional se não está em período reprodutivo de cooldown
                        if (partnerEnergy > 80 && bacteriaEnergy > 80 && d < this.bacteria.perceptionRadius * 0.75) {
                            conditions.mateNearby = true;
                            foundMate = true;
                            
                            // Verifica se o parceiro também está em estado receptivo
                            let partnerReady = false;
                            if (e.stateManager && e.stateManager.currentState) {
                                partnerReady = e.stateManager.currentState !== 'reproducing';
                            }
                            
                            conditions.mateReady = partnerReady;
                            
                            // Se não tiver alvo de parceiro ou se este parceiro estiver mais perto
                            if (!conditions.mateTarget || d < dist(this.bacteria.pos.x, this.bacteria.pos.y, conditions.mateTarget.pos.x, conditions.mateTarget.pos.y)) {
                                conditions.mateTarget = e;
                            }
                        }
                    }
                }
            }
            
            // Se encontrou um parceiro, marca o tempo da última detecção
            if (foundMate) {
                this.lastMateDetectionTime = currentTime;
            }
        }

        // Verifica obstáculos próximos
        for (const o of obstacles) {
            if (!o || !o.collidesWith) continue;
            
            // Verifica colisão com uma margem
            if (o.collidesWith(this.bacteria.pos, this.bacteria.size * 1.5)) {
                conditions.obstacleNearby = true;
                break;
            }
        }

        return conditions;
    }

    /**
     * Identifica e classifica bactérias próximas
     * @param {Array} entities - Array de todas as entidades
     * @param {Object} conditions - Condições do ambiente a serem atualizadas
     */
    identifyNearbyBacteria(entities, conditions) {
        if (!Array.isArray(entities) || !this.bacteria || !this.bacteria.pos) return;
        
        const currentFrame = frameCount;
        const nearbyBacteria = [];
        const sameSpeciesBacteria = [];
        const differentSpeciesBacteria = [];
        
        // Limpa entradas antigas do mapa de identificação
        for (const [id, data] of this.recentlyIdentifiedBacteria.entries()) {
            if (currentFrame - data.lastSeen > this.identificationMemoryTime) {
                this.recentlyIdentifiedBacteria.delete(id);
            }
        }
        
        // Filtra apenas bactérias válidas
        const validEntities = entities.filter(e => 
            e && e instanceof Bacteria && e !== this.bacteria && e.pos
        );
        
        for (const other of validEntities) {
            try {
                const d = dist(this.bacteria.pos.x, this.bacteria.pos.y, other.pos.x, other.pos.y);
                
                // Verifica se está no raio de identificação
                if (d <= this.identificationRange) {
                    // Adiciona à lista de bactérias próximas
                    nearbyBacteria.push(other);
                    
                    // Compara espécie/tipo de bactéria
                    const isSameSpecies = this.isSameSpecies(other);
                    
                    // Classifica por espécie
                    if (isSameSpecies) {
                        sameSpeciesBacteria.push(other);
                    } else {
                        differentSpeciesBacteria.push(other);
                    }
                    
                    // Atualiza o mapa de bactérias identificadas
                    this.recentlyIdentifiedBacteria.set(other.id, {
                        bacteria: other,
                        lastSeen: currentFrame,
                        isSameSpecies: isSameSpecies,
                        distance: d,
                        position: other.pos.copy()
                    });
                }
            } catch (error) {
                console.warn("Erro ao identificar bactéria:", error);
            }
        }
        
        // Atualiza as condições
        conditions.nearbyBacteria = nearbyBacteria;
        conditions.sameSpeciesBacteria = sameSpeciesBacteria;
        conditions.differentSpeciesBacteria = differentSpeciesBacteria;
        
        // Para depuração
        if (this.bacteria && this.bacteria.age % 300 === 0 && nearbyBacteria.length > 0) {
            console.log(`Bactéria ${this.bacteria.id} identificou ${nearbyBacteria.length} bactérias próximas (${sameSpeciesBacteria.length} mesma espécie, ${differentSpeciesBacteria.length} espécie diferente)`);
        }
    }
    
    /**
     * Identifica e processa obstáculos no ambiente
     * @param {Array} obstacles - Array de obstáculos
     * @param {Object} conditions - Condições do ambiente a serem atualizadas
     */
    identifyObstacles(obstacles, conditions) {
        if (!Array.isArray(obstacles) || !this.bacteria || !this.bacteria.pos) return;
        
        const currentFrame = frameCount;
        const identifiedObstacles = [];
        
        // Limpa entradas antigas do mapa de obstáculos
        for (const [id, data] of this.recentlyIdentifiedObstacles.entries()) {
            if (currentFrame - data.lastSeen > this.identificationMemoryTime) {
                this.recentlyIdentifiedObstacles.delete(id);
            }
        }
        
        // Processa cada obstáculo
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (!obstacle) continue;
            
            try {
                // Gera um ID para o obstáculo se não tiver
                const obstacleId = obstacle.id || `obstacle_${i}`;
                
                // Verifica se o obstáculo está próximo usando o método collidesWith quando disponível
                let isNearby = false;
                let distance = Infinity;
                let obstaclePosition;
                
                if (typeof obstacle.collidesWith === 'function') {
                    // Usa uma margem maior para detecção
                    const detectionMargin = this.bacteria.size * 3;
                    isNearby = obstacle.collidesWith(this.bacteria.pos, detectionMargin);
                    
                    // Tenta obter o centro do obstáculo para calcular a distância
                    if (obstacle.center) {
                        obstaclePosition = obstacle.center;
                        distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, obstacle.center.x, obstacle.center.y);
                    } else if (obstacle.position) {
                        obstaclePosition = obstacle.position;
                        distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, obstacle.position.x, obstacle.position.y);
                    } else if (obstacle.x !== undefined && obstacle.y !== undefined) {
                        obstaclePosition = createVector(obstacle.x, obstacle.y);
                        distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, obstacle.x, obstacle.y);
                    }
                } else if (obstacle.position) {
                    obstaclePosition = obstacle.position;
                    distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, obstacle.position.x, obstacle.position.y);
                    isNearby = distance < this.identificationRange;
                } else if (obstacle.x !== undefined && obstacle.y !== undefined) {
                    obstaclePosition = createVector(obstacle.x, obstacle.y);
                    distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, obstacle.x, obstacle.y);
                    isNearby = distance < this.identificationRange;
                }
                
                // Se o obstáculo estiver próximo, adiciona à lista
                if (isNearby) {
                    identifiedObstacles.push(obstacle);
                    conditions.obstacleNearby = true;
                    
                    // Atualiza o mapa de obstáculos identificados
                    this.recentlyIdentifiedObstacles.set(obstacleId, {
                        obstacle: obstacle,
                        lastSeen: currentFrame,
                        distance: distance,
                        position: obstaclePosition
                    });
                }
            } catch (error) {
                console.warn("Erro ao identificar obstáculo:", error);
            }
        }
        
        // Atualiza as condições
        conditions.identifiedObstacles = identifiedObstacles;
        
        // Para depuração
        if (this.bacteria && this.bacteria.age % 300 === 0 && identifiedObstacles.length > 0) {
            console.log(`Bactéria ${this.bacteria.id} identificou ${identifiedObstacles.length} obstáculos próximos`);
        }
    }
    
    /**
     * Verifica se outra bactéria é da mesma espécie
     * @param {Bacteria} otherBacteria - Bactéria a ser comparada
     * @returns {boolean} - Verdadeiro se for da mesma espécie
     */
    isSameSpecies(otherBacteria) {
        if (!otherBacteria) return false;
        
        try {
            // Compara propriedades que indicam espécie/tipo
            
            // Se ambas têm a propriedade species, compara diretamente
            if (this.bacteria.species !== undefined && otherBacteria.species !== undefined) {
                return this.bacteria.species === otherBacteria.species;
            }
            
            // Se ambas têm a propriedade type, compara
            if (this.bacteria.type !== undefined && otherBacteria.type !== undefined) {
                return this.bacteria.type === otherBacteria.type;
            }
            
            // Compara pelo DNA se ambas têm DNA
            if (this.bacteria.dna && otherBacteria.dna) {
                // Verifica compatibilidade genética básica
                // Se os genes têm similaridade > 80%, considera mesma espécie
                if (this.bacteria.dna.genes && otherBacteria.dna.genes) {
                    let similarity = 0;
                    let totalGenes = 0;
                    
                    // Compara genes comuns
                    for (const gene in this.bacteria.dna.genes) {
                        if (otherBacteria.dna.genes[gene] !== undefined) {
                            const diff = Math.abs(this.bacteria.dna.genes[gene] - otherBacteria.dna.genes[gene]);
                            similarity += (1 - diff);
                            totalGenes++;
                        }
                    }
                    
                    // Calcula porcentagem de similaridade
                    return totalGenes > 0 ? (similarity / totalGenes) > 0.8 : false;
                }
            }
            
            // Se nenhuma das comparações anteriores funcionou, usa a aparência visual
            // Considera mesma espécie se tem a mesma cor (ou similar)
            if (this.bacteria.color && otherBacteria.color) {
                // Compara componentes RGB
                const colorDiff = Math.abs(red(this.bacteria.color) - red(otherBacteria.color)) +
                                 Math.abs(green(this.bacteria.color) - green(otherBacteria.color)) +
                                 Math.abs(blue(this.bacteria.color) - blue(otherBacteria.color));
                                 
                // Se a diferença for pequena, considera mesma espécie
                return colorDiff < 100;
            }
            
            // Se não tem como comparar, assume que não é da mesma espécie
            return false;
            
        } catch (error) {
            console.warn("Erro ao comparar espécies:", error);
            return false;
        }
    }

    /**
     * Considera relacionamentos na análise do ambiente
     * @param {Object} conditions - Condições do ambiente
     * @param {Array} entities - Todas as entidades
     */
    considerRelationships(conditions, entities) {
        // Verifica se conditions é válido, se não, inicializa
        if (!conditions) {
            conditions = {};
        }
        
        // Filtrar apenas bactérias
        const bacteria = entities && Array.isArray(entities) 
            ? entities.filter(e => e instanceof Bacteria && e !== this.bacteria) 
            : [];
        
        // Verifica relações de amizade e inimizade
        let nearbyFriends = [];
        let nearbyEnemies = [];
        
        // Verifica se temos friendships e enemies disponíveis
        if (this.bacteria && 
            (this.bacteria.friendships instanceof Map) && 
            (this.bacteria.enemies instanceof Map)) {
            
            for (const b of bacteria) {
                const distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, b.pos.x, b.pos.y);
                
                if (distance <= this.bacteria.perceptionRadius) {
                    // Verificação segura para getBacteriaId
                    let id = 0;
                    
                    if (typeof this.bacteria.getBacteriaId === 'function') {
                        id = this.bacteria.getBacteriaId(b);
                    } else if (typeof this.bacteria.social?.getBacteriaId === 'function') {
                        id = this.bacteria.social.getBacteriaId(b);
                    } else if (b.id) {
                        id = b.id;
                    }
                    
                    if (id && this.bacteria.friendships.has(id)) {
                        nearbyFriends.push(b);
                    } else if (id && this.bacteria.enemies.has(id)) {
                        nearbyEnemies.push(b);
                    }
                }
            }
        }
        
        // Adiciona informações às condições
        conditions.friendsNearby = nearbyFriends.length > 0;
        conditions.enemiesNearby = nearbyEnemies.length > 0;
        conditions.nearbyFriends = nearbyFriends;
        conditions.nearbyEnemies = nearbyEnemies;
        
        return conditions;
    }
}

// Exporta a classe para uso global
window.BacteriaEnvironment = BacteriaEnvironment; 