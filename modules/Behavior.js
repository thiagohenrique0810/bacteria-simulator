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
        this.behaviorTimer = 0;
        this.minBehaviorTime = 60;  // 1 segundo
        this.maxBehaviorTime = 300; // 5 segundos
        this.hungerThreshold = 0.7; // 70% do tempo de fome
    }

    /**
     * Atualiza o comportamento
     * @param {number} health - Saúde atual
     * @param {number} timeSinceLastMeal - Tempo desde última refeição
     * @param {number} starvationTime - Tempo até morrer de fome
     * @param {boolean} canMate - Se pode acasalar
     * @param {boolean} isInMatingRecovery - Se está em recuperação de acasalamento
     */
    update(health, timeSinceLastMeal, starvationTime, canMate, isInMatingRecovery) {
        // Atualiza timer de comportamento
        this.behaviorTimer--;

        // Se ainda não é hora de mudar de comportamento, mantém o atual
        if (this.behaviorTimer > 0) return;

        // Define novo timer aleatório
        this.behaviorTimer = random(this.minBehaviorTime, this.maxBehaviorTime);

        // Prioridades de comportamento
        if (timeSinceLastMeal > starvationTime * this.hungerThreshold) {
            // Com fome
            this.currentBehavior = 'eat';
        } else if (health < 30) {
            // Saúde baixa
            this.currentBehavior = 'rest';
        } else if (health > 70 && canMate && !isInMatingRecovery) {
            // Saudável e pode acasalar
            this.currentBehavior = 'mate';
        } else if (random() < this.dna.genes.curiosity) {
            // Chance de explorar baseada na curiosidade
            this.currentBehavior = 'explore';
        } else {
            // Descansa
            this.currentBehavior = 'rest';
        }
    }

    /**
     * Tenta comer
     * @param {number} nutrition - Valor nutricional da comida
     * @returns {Object|null} Resultado da alimentação
     */
    eat(nutrition) {
        if (this.currentBehavior === 'eat') {
            return {
                healthGain: nutrition * this.dna.genes.metabolism
            };
        }
        return null;
    }

    /**
     * Verifica se está em estado de descanso
     * @returns {boolean} Se está descansando
     */
    isRestingState() {
        return this.currentBehavior === 'rest';
    }

    /**
     * Retorna uma descrição do comportamento atual
     * @returns {Object} Descrição do comportamento
     */
    getDescription() {
        const behaviors = {
            eat: 'Procurando comida',
            mate: 'Procurando parceiro',
            rest: 'Descansando',
            explore: 'Explorando'
        };

        return {
            current: behaviors[this.currentBehavior] || 'Desconhecido',
            timer: Math.ceil(this.behaviorTimer / 60)
        };
    }
}

// Tornando a classe global
window.Behavior = Behavior; 