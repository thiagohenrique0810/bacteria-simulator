/**
 * Sistema de renderização da simulação
 * Responsável por desenhar todas as entidades e elementos visuais
 */
class RenderSystem {
    /**
     * Inicializa o sistema de renderização
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Configurações de visualização
        this.showTrails = false;
        this.showEnergy = true;
        this.showGender = true;
        this.showDiseaseEffects = true;
        this.zoom = 1;
    }
    
    /**
     * Desenha todas as entidades da simulação
     */
    draw() {
        const entityManager = this.simulation.entityManager;
        const environmentSystem = this.simulation.environmentSystem;
        
        // Aplica iluminação conforme ciclo dia/noite
        this.applyLighting(environmentSystem.getLightFactor());
        
        // Desenha os rastros das bactérias (se ativado)
        if (this.showTrails) {
            for (let b of entityManager.bacteria) {
                b.drawTrail && b.drawTrail();
            }
        }
        
        // Desenha comida
        for (let f of entityManager.food) {
            f.draw();
        }
        
        // Desenha obstáculos
        for (let o of entityManager.obstacles) {
            o.draw();
        }
        
        // Desenha bactérias
        for (let b of entityManager.bacteria) {
            b.draw();
        }
        
        // Desenha predadores
        for (let p of entityManager.predators) {
            p.draw();
        }
        
        // Desenha efeitos visuais
        for (let e of entityManager.effects) {
            e.draw();
        }
        
        // Desenha efeitos das doenças
        if (this.showDiseaseEffects) {
            this.simulation.diseaseSystem.draw();
        }
        
        // Desenha estatísticas
        if (this.simulation.controls && !this.simulation.controls.visualizationSettings.hideStats) {
            this.simulation.statsManager.drawStats();
        }
        
        // Restaura iluminação normal
        this.resetLighting();
    }
    
    /**
     * Aplica efeito de iluminação conforme ciclo dia/noite
     * @param {number} lightFactor - Fator de luz (0-1)
     */
    applyLighting(lightFactor) {
        // Implementação básica: overlay semitransparente
        if (lightFactor < 1.0) {
            push();
            noStroke();
            // Sobreposição escura com opacidade inversamente proporcional à luz
            fill(0, 0, 30, map(lightFactor, 0, 1, 180, 0));
            rect(0, 0, width, height);
            pop();
        }
    }
    
    /**
     * Restaura iluminação normal
     */
    resetLighting() {
        // Não é necessário restaurar nada no método atual de iluminação
        // Mantido para compatibilidade futura
    }
    
    /**
     * Atualiza configurações de visualização
     * @param {Object} settings - Configurações de visualização
     */
    updateSettings(settings) {
        if (!settings) return;
        
        this.showTrails = settings.showTrails || false;
        this.showEnergy = settings.showEnergy || true;
        this.showGender = settings.showGender || true;
        this.showDiseaseEffects = settings.showDiseaseEffects || true;
        this.zoom = Math.max(0.5, Math.min(2, settings.zoom || 1));
    }
}

// Torna a classe disponível globalmente
window.RenderSystem = RenderSystem; 