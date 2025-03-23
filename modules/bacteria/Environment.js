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
    }

    /**
     * Analisa o ambiente em volta
     * @param {Array} food - Array de comida
     * @param {Array} predators - Array de predadores
     * @param {Array} obstacles - Array de obstáculos
     * @param {Array} entities - Array de todas as entidades
     * @returns {Object} - Condições do ambiente
     */
    analyzeEnvironment(food, predators, obstacles, entities) {
        // Inicializa objeto de condições
        const conditions = {
            foodNearby: false,
            mateNearby: false,
            predatorNearby: false,
            foodTarget: null,
            mateTarget: null,
            predatorTarget: null,
            obstacleNearby: false
        };

        // Garante que os arrays são válidos
        food = Array.isArray(food) ? food : [];
        predators = Array.isArray(predators) ? predators : [];
        obstacles = Array.isArray(obstacles) ? obstacles : [];
        entities = Array.isArray(entities) ? entities : [];

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

        // Verifica bactérias compatíveis para reprodução
        for (const e of entities) {
            if (!e || !(e instanceof Bacteria) || e === this.bacteria) continue;
            
            // Verifica se é um parceiro em potencial (sexo oposto)
            if (e.isFemale !== this.bacteria.isFemale) {
                const d = dist(this.bacteria.pos.x, this.bacteria.pos.y, e.pos.x, e.pos.y);
                if (d < this.bacteria.perceptionRadius) {
                    // Verifica se tem energia suficiente para reprodução
                    if (e.states && e.states.getEnergy() > 60 && this.bacteria.states.getEnergy() > 60) {
                        conditions.mateNearby = true;
                        
                        // Se não tiver alvo de parceiro ou se este parceiro estiver mais perto
                        if (!conditions.mateTarget || d < dist(this.bacteria.pos.x, this.bacteria.pos.y, conditions.mateTarget.pos.x, conditions.mateTarget.pos.y)) {
                            conditions.mateTarget = e;
                        }
                    }
                }
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