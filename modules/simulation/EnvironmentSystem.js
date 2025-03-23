/**
 * Sistema de ambiente da simulação
 * Responsável pelas condições ambientais como ciclo dia/noite
 */
class EnvironmentSystem {
    /**
     * Inicializa o sistema de ambiente
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Configurações do ambiente
        this.dayNightEnabled = true;
        this.dayTime = true; // True = dia, False = noite
        this.dayLength = 3600; // Frames por ciclo (1min em 60fps)
        this.currentTime = 0;
        
        // Configurações de geração de comida
        this.foodRate = 0.8;
        this.foodSpawnInterval = 3;
        this.foodSpawnAmount = 8;
    }
    
    /**
     * Atualiza o ambiente
     */
    update() {
        // Atualiza ciclo dia/noite
        this.updateDayNightCycle();
        
        // Gera alimento periodicamente
        if (this.simulation.time % (this.foodSpawnInterval * 60 / this.simulation.speed) === 0) {
            let amount = this.foodSpawnAmount;
            if (!this.dayTime && this.dayNightEnabled) {
                amount = Math.floor(amount * 0.3); // Menos comida à noite
            }
            this.simulation.entityManager.generateFood(amount);
        }
        
        // Remove comida excedente para evitar acúmulo excessivo
        const maxFood = 300;
        const foods = this.simulation.entityManager.food;
        if (foods.length > maxFood) {
            foods.sort((a, b) => a.creationTime - b.creationTime);
            foods.splice(0, foods.length - maxFood);
        }
    }
    
    /**
     * Atualiza ciclo dia/noite
     */
    updateDayNightCycle() {
        if (!this.dayNightEnabled) return;
        
        this.currentTime = (this.currentTime + 1) % this.dayLength;
        if (this.currentTime === 0) {
            this.dayTime = !this.dayTime;
            console.log(`Agora é ${this.dayTime ? 'dia' : 'noite'}`);
        }
    }
    
    /**
     * Obtém o fator de luz atual (0-1)
     * @returns {number} - Fator de luz (0 = noite completa, 1 = dia completo)
     */
    getLightFactor() {
        if (!this.dayNightEnabled) return 1.0;
        
        // Calcula um fator de 0 a 1 com transição suave
        // Usa função seno para suavizar as transições
        const phase = this.currentTime / this.dayLength;
        
        if (this.dayTime) {
            // Durante o dia: começa em 0.7 (amanhecer), sobe até 1.0 (meio-dia) e desce para 0.7 (entardecer)
            return 0.7 + 0.3 * Math.sin(Math.PI * phase);
        } else {
            // Durante a noite: começa em 0.3 (crepúsculo), desce até 0.0 (meia-noite) e sobe para 0.3 (aurora)
            return 0.3 - 0.3 * Math.sin(Math.PI * phase);
        }
    }
}

// Torna a classe disponível globalmente
window.EnvironmentSystem = EnvironmentSystem; 