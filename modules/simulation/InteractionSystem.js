/**
 * Sistema de interações entre entidades
 * Responsável por gerenciar colisões e outras interações
 */
class InteractionSystem {
    /**
     * Inicializa o sistema de interações
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
    }
    
    /**
     * Verifica e processa interações entre entidades
     */
    checkInteractions() {
        // Utiliza o método otimizado para processar interações
        this.checkInteractionsOptimized();
    }
    
    /**
     * Versão otimizada da verificação de interações
     */
    checkInteractionsOptimized() {
        const entityManager = this.simulation.entityManager;
        const spatialGrid = this.simulation.spatialGrid;
        const stats = this.simulation.statsManager.stats;
        
        // Verifica interações bactéria-comida
        for (let i = entityManager.bacteria.length - 1; i >= 0; i--) {
            const bacteria = entityManager.bacteria[i];
            
            // Usa o grid para verificar apenas comida próxima
            const nearbyFood = spatialGrid.queryRadius(bacteria.pos, bacteria.size + 10);
            const food = nearbyFood.filter(e => e instanceof Food);
            
            for (let j = food.length - 1; j >= 0; j--) {
                const f = food[j];
                const d = dist(bacteria.pos.x, bacteria.pos.y, f.position.x, f.position.y);
                
                if (d < bacteria.size / 2 + f.size / 2) {
                    // Bactéria come a comida
                    bacteria.eat(f);
                    stats.foodConsumed++;
                    
                    // Comida é consumida parcialmente ou totalmente
                    f.nutrition -= 10;
                    if (f.nutrition <= 0) {
                        const index = entityManager.food.indexOf(f);
                        if (index > -1) {
                            entityManager.food.splice(index, 1);
                        }
                    } else {
                        // Atualiza tamanho baseado na nutrição restante
                        f.size = map(f.nutrition, 10, 50, 5, 15);
                    }
                }
            }
        }
        
        // Interações bactéria-bactéria (reprodução)
        for (let i = 0; i < entityManager.bacteria.length; i++) {
            const bacteria = entityManager.bacteria[i];
            if (!bacteria.reproduction || !bacteria.reproduction.canMateNow()) continue;
            
            // Usa o grid para verificar apenas bactérias próximas
            const nearbyEntities = spatialGrid.queryRadius(bacteria.pos, 50);
            const nearbyBacteria = nearbyEntities.filter(e => 
                e instanceof Bacteria && e !== bacteria
            );
            
            for (let otherBacteria of nearbyBacteria) {
                if (!otherBacteria.reproduction) continue;
                
                const d = dist(bacteria.pos.x, bacteria.pos.y, otherBacteria.pos.x, otherBacteria.pos.y);
                if (d < bacteria.size + otherBacteria.size) {
                    stats.matingAttempts++;
                    
                    // Tenta acasalar
                    const success = bacteria.reproduction.mate(otherBacteria.reproduction);
                    if (success) {
                        stats.successfulMatings++;
                        break; // Apenas um acasalamento por frame
                    }
                }
            }
        }
        
        // Interações bactéria-predador (predação)
        for (let i = entityManager.predators.length - 1; i >= 0; i--) {
            const predator = entityManager.predators[i];
            
            // Usa o grid para verificar apenas bactérias próximas
            const nearbyEntities = spatialGrid.queryRadius(predator.pos, predator.attackRange);
            const nearbyBacteria = nearbyEntities.filter(e => e instanceof Bacteria);
            
            for (let bacteria of nearbyBacteria) {
                const d = dist(predator.pos.x, predator.pos.y, bacteria.pos.x, bacteria.pos.y);
                
                if (d < predator.attackRange) {
                    // Predador ataca bactéria
                    predator.attack(bacteria);
                    
                    // Se a bactéria morreu pelo ataque
                    if (bacteria.health <= 0) {
                        const index = entityManager.bacteria.indexOf(bacteria);
                        if (index > -1) {
                            entityManager.bacteria.splice(index, 1);
                            stats.deaths++;
                            stats.predatorKills++;
                        }
                    }
                }
            }
        }
    }
}

// Torna a classe disponível globalmente
window.InteractionSystem = InteractionSystem; 