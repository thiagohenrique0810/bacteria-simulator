/**
 * Sistema de comportamento das bactérias
 */
class Behavior {
    /**
     * Inicializa o sistema de comportamento
     * @param {DNA} dna - DNA da bactéria
     */
    constructor(dna) {
        this.dna = dna;
        this.currentBehavior = 'explore';
        this.restTimer = 0;
        this.minRestTime = 60;
        this.maxRestTime = 180;
    }

    /**
     * Atualiza o comportamento
     * @param {number} health - Saúde atual
     * @param {number} timeSinceLastMeal - Tempo desde a última refeição
     * @param {number} starvationTime - Tempo até morrer de fome
     * @param {boolean} canMate - Se pode acasalar
     * @param {boolean} isInMatingRecovery - Se está em recuperação de acasalamento
     */
    update(health, timeSinceLastMeal, starvationTime, canMate, isInMatingRecovery) {
        // Se estiver descansando, verifica se pode parar
        if (this.isRestingState()) {
            this.restTimer--;
            if (this.restTimer <= 0) {
                this.currentBehavior = 'explore';
            }
            return;
        }

        // Calcula prioridades
        let priorities = {
            eat: this.calculateEatingPriority(health, timeSinceLastMeal, starvationTime),
            mate: this.calculateMatingPriority(health, canMate, isInMatingRecovery),
            rest: this.calculateRestingPriority(health),
            explore: this.calculateExplorationPriority()
        };

        // Escolhe o comportamento com maior prioridade
        let maxPriority = -1;
        let chosenBehavior = 'explore';

        for (let [behavior, priority] of Object.entries(priorities)) {
            if (priority > maxPriority) {
                maxPriority = priority;
                chosenBehavior = behavior;
            }
        }

        // Atualiza comportamento
        this.currentBehavior = chosenBehavior;

        // Se escolheu descansar, define tempo de descanso
        if (chosenBehavior === 'rest') {
            this.restTimer = random(this.minRestTime, this.maxRestTime);
        }
    }

    /**
     * Calcula prioridade de comer
     */
    calculateEatingPriority(health, timeSinceLastMeal, starvationTime) {
        let hungerFactor = timeSinceLastMeal / starvationTime;
        let healthFactor = 1 - (health / 100);
        
        return (hungerFactor * 0.7 + healthFactor * 0.3) * this.dna.genes.metabolism;
    }

    /**
     * Calcula prioridade de acasalar
     */
    calculateMatingPriority(health, canMate, isInMatingRecovery) {
        if (!canMate || isInMatingRecovery || health < 70) return 0;
        
        let healthBonus = map(health, 70, 100, 0, 0.3);
        return this.dna.genes.fertility * 0.7 + healthBonus;
    }

    /**
     * Calcula prioridade de descansar
     */
    calculateRestingPriority(health) {
        let healthFactor = 1 - (health / 100);
        return healthFactor * 0.8 * (1 - this.dna.genes.metabolism);
    }

    /**
     * Calcula prioridade de explorar
     */
    calculateExplorationPriority() {
        return this.dna.genes.curiosity * 0.3;
    }

    /**
     * Verifica se está em estado de descanso
     */
    isRestingState() {
        return this.currentBehavior === 'rest' && this.restTimer > 0;
    }

    /**
     * Processa o consumo de comida
     * @param {number} nutrition - Valor nutricional da comida
     * @returns {Object|null} - Resultado do consumo
     */
    eat(nutrition) {
        if (this.currentBehavior === 'eat') {
            return {
                healthGain: nutrition * this.dna.genes.metabolism
            };
        }
        return null;
    }
}

// Tornando a classe global
window.Behavior = Behavior; 