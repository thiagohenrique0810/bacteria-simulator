/**
 * Sistema de controles para a simulação
 */

// Define a classe Controls
window.Controls = class Controls {
    constructor() {
        this.initialized = false;
        this.callbacks = {};
        this._state = {
            simulationSpeed: 1,
            foodRate: 0.5,
            foodValue: 30,
            maxObstacles: 5,
            populationLimit: 100,
            initialEnergy: 100,
            showStats: true,
            debugMode: false,
            showTrails: false,
            showEnergy: true,
            showGender: true,
            zoom: 1,
            foodSpawnInterval: 3,
            foodSpawnAmount: 3
        };
        
        // Carrega os módulos e inicializa quando estiverem prontos
        this.loadModules().then(() => {
            // Atualiza o protótipo antes de chamar os métodos
            const impl = new ControlsImpl();
            Object.setPrototypeOf(this, Object.getPrototypeOf(impl));
            Object.assign(this, impl);
            
            // Configura os controles
            this.setupControls();
            
            // Configura os callbacks padrão
            this.setCallbacks({
                onPauseToggle: (isPaused) => {
                    console.log('Simulação ' + (isPaused ? 'pausada' : 'continuando'));
                },
                onReset: () => {
                    console.log('Simulação reiniciada');
                },
                onRandomEvent: () => {
                    console.log('Evento aleatório gerado');
                },
                onSave: () => {
                    console.log('Estado salvo');
                },
                onLoad: () => {
                    console.log('Estado carregado');
                },
                onChange: (state) => {
                    this._state = { ...this._state, ...state };
                    console.log('Estado atualizado:', state);
                }
            });
            
            // Configura os event listeners após definir os callbacks
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('Controles inicializados com sucesso');
        }).catch(error => {
            console.error('Erro ao carregar módulos de controle:', error);
        });
    }

    // Configura os callbacks
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        
        // Se já estiver inicializado, atualiza os listeners
        if (this.initialized) {
            this.setupEventListeners();
        }
    }

    // Retorna o estado atual
    getState() {
        if (!this.initialized) {
            return this._state;
        }

        // Combina os estados de todos os controles
        const simulationState = this.simulationControls?.getState() || {};
        const environmentState = this.environmentControls?.getState() || {};
        const visualizationState = this.visualizationControls?.getState() || {};

        return {
            // Valores da simulação
            simulationSpeed: simulationState.simulationSpeed || this._state.simulationSpeed,
            populationLimit: simulationState.populationLimit || this._state.populationLimit,
            initialEnergy: simulationState.initialEnergy || this._state.initialEnergy,
            healthLossRate: simulationState.healthLossRate || 0.05,
            feedingInterval: simulationState.feedingInterval || 30,
            lifespan: simulationState.lifespan || 12,

            // Valores do ambiente
            foodRate: environmentState.foodRate || this._state.foodRate,
            foodValue: environmentState.foodValue || this._state.foodValue,
            foodSpawnInterval: environmentState.foodSpawnInterval || this._state.foodSpawnInterval,
            foodSpawnAmount: environmentState.foodSpawnAmount || this._state.foodSpawnAmount,
            maxObstacles: environmentState.maxObstacles || this._state.maxObstacles,

            // Valores de visualização
            showStats: visualizationState.showStats || this._state.showStats,
            debugMode: visualizationState.debugMode || this._state.debugMode,
            showTrails: visualizationState.showTrails || this._state.showTrails,
            showEnergy: visualizationState.showEnergy || this._state.showEnergy,
            showGender: visualizationState.showGender || this._state.showGender,
            zoom: visualizationState.zoom || this._state.zoom
        };
    }

    // Carrega os módulos de controle
    async loadModules() {
        const modules = [
            'controls/ControlsBase.js',
            'controls/SimulationControls.js',
            'controls/EnvironmentControls.js',
            'controls/VisualizationControls.js',
            'controls/SaveControls.js',
            'controls/Controls.js'
        ];

        for (const module of modules) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'modules/' + module;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }
}; 