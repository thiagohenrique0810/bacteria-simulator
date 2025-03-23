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
            
            // Verificações de segurança para bactéria e sistema de reprodução
            if (!bacteria || !bacteria.pos || !bacteria.reproduction) {
                continue;
            }
            
            // Verifica se pode se reproduzir
            if (!bacteria.reproduction.canMateNow()) {
                continue;
            }
            
            try {
                // Log de depuração para verificar tentativas de reprodução
                if (frameCount % 300 === 0) {
                    console.log(`Bactéria ${bacteria.id || i} está procurando parceiro para reprodução`);
                }
                
                // Usa o grid para verificar apenas bactérias próximas
                let nearbyBacteria = [];
                if (spatialGrid) {
                    const nearbyEntities = spatialGrid.queryRadius(bacteria.pos, 50);
                    nearbyBacteria = nearbyEntities.filter(e => 
                        e instanceof Bacteria && e !== bacteria && e.pos && e.reproduction
                    );
                } else {
                    // Fallback caso o grid espacial não esteja disponível
                    nearbyBacteria = entityManager.bacteria.filter(b => 
                        b !== bacteria && b.pos && b.reproduction && 
                        dist(bacteria.pos.x, bacteria.pos.y, b.pos.x, b.pos.y) < 50
                    );
                }
                
                // Log de depuração para verificar bactérias próximas
                if (nearbyBacteria.length > 0 && frameCount % 300 === 0) {
                    console.log(`Bactéria ${bacteria.id || i} encontrou ${nearbyBacteria.length} parceiros potenciais`);
                }
                
                for (let otherBacteria of nearbyBacteria) {
                    // Verificações adicionais de segurança
                    if (!otherBacteria.reproduction || !otherBacteria.reproduction.canMateNow()) {
                        continue;
                    }
                    
                    const d = dist(bacteria.pos.x, bacteria.pos.y, otherBacteria.pos.x, otherBacteria.pos.y);
                    if (d < bacteria.size + otherBacteria.size + 5) {
                        stats.matingAttempts++;
                        
                        // Tenta acasalar e registra o sucesso
                        const success = bacteria.reproduction.mate(otherBacteria.reproduction);
                        if (success) {
                            stats.successfulMatings++;
                            console.log(`Reprodução bem-sucedida entre bactérias ${bacteria.id || i} e ${otherBacteria.id || 'desconhecida'}`);
                            break; // Apenas um acasalamento por frame
                        }
                    }
                }
            } catch (error) {
                console.error(`Erro durante a verificação de reprodução para bactéria ${bacteria.id || i}:`, error);
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