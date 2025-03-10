/**
 * Estados possíveis para uma bactéria
 */
const BacteriaStates = {
    EXPLORING: 'exploring',
    SEARCHING_FOOD: 'searching_food',
    SEARCHING_MATE: 'searching_mate',
    RESTING: 'resting',
    REPRODUCING: 'reproducing',
    FLEEING: 'fleeing'
};

// Exporta as constantes
window.BacteriaStates = BacteriaStates; 