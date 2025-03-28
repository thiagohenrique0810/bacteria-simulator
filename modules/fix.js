/**
 * Este arquivo resolve problemas de dependências circulares e referências globais
 * necessárias durante a inicialização do sistema.
 */

console.log("[Fix.js] Inicializando correções para dependências circulares");

// Função auxiliar que retorna um valor quando chamada
const valueFunction = (defaultValue) => () => defaultValue;

// Stubs para sliders
const slidersStub = {
    lifespanSlider: { value: valueFunction(12) },
    healthLossSlider: { value: valueFunction(0.05) },
    feedingIntervalSlider: { value: valueFunction(30) },
    initialEnergySlider: { value: valueFunction(150) },
    populationLimitSlider: { value: valueFunction(100) }
};

// Stub para callbacks
const callbacksStub = {
    onAddBacteria: (count, femaleRatio) => {
        console.log("[Fix.js] Stub de callback onAddBacteria chamado:", count, femaleRatio);
    },
    onChange: () => {},
    onPauseToggle: () => {},
    onSpeedChange: () => {}
};

// Garantir que window.simulation exista para evitar erros durante a inicialização
window.simulation = window.simulation || { 
    controls: {
        // Stubs para todos os sliders necessários
        ...slidersStub,
        
        // Outros controles necessários
        callbacks: callbacksStub,
        getState: () => ({
            initialEnergy: 150,
            lifespan: 12,
            healthLossRate: 0.05,
            feedingInterval: 30,
            populationLimit: 100,
            enableDiseases: true
        }),
        initialized: true
    },
    // Métodos frequentemente usados
    width: 800,
    height: 600,
    initialEnergy: 150,
    populationLimit: 100,
    addBacteria: () => null,
    bacteria: [],
    
    // Sistemas
    diseaseSystem: {
        diseases: [],
        randomDiseaseChance: 0.0005,
        maxDiseases: 5,
        infectionRange: 50,
        getStatistics: () => ({ 
            activeDiseases: 0, 
            totalInfected: 0, 
            diseaseNames: [],
            infectionRate: 0
        })
    }
};

// Stub para o BacteriaStates que é usado em várias classes
window.BacteriaStates = window.BacteriaStates || {
    EXPLORING: 'exploring',
    SEARCHING_FOOD: 'searching_food',
    SEARCHING_MATE: 'searching_mate',
    FLEEING: 'fleeing',
    RESTING: 'resting'
};

// Garante que o objeto ControlsBase esteja disponível
window.ControlsBase = window.ControlsBase || class {
    constructor(name, config) {
        this.name = name || 'Base';
        this.config = config || {};
        this.state = {};
    }
    
    setupControls() {}
    getState() { return this.state; }
    setState(newState) { this.state = {...this.state, ...newState}; }
    setupEventListeners() {}
};

console.log("[Fix.js] Referências globais inicializadas com todos os stubs necessários");
