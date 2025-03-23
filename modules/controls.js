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
            showDiseaseEffects: true,
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
        const diseaseState = this.diseaseControls?.getState() || {};

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
            foodLimit: environmentState.foodLimit || 200,

            // Valores de visualização
            showStats: visualizationState.showStats !== undefined ? visualizationState.showStats : this._state.showStats,
            debugMode: visualizationState.debugMode !== undefined ? visualizationState.debugMode : this._state.debugMode,
            showTrails: visualizationState.showTrails !== undefined ? visualizationState.showTrails : this._state.showTrails,
            showEnergy: visualizationState.showEnergy !== undefined ? visualizationState.showEnergy : this._state.showEnergy,
            showGender: visualizationState.showGender !== undefined ? visualizationState.showGender : this._state.showGender,
            
            // Valores do sistema de doenças
            enableDiseases: diseaseState.enableDiseases !== undefined ? diseaseState.enableDiseases : true,
            randomDiseaseChance: diseaseState.randomDiseaseChance || 0.0005,
            maxDiseases: diseaseState.maxDiseases || 5,
            infectionRange: diseaseState.infectionRange || 50,
            showDiseaseEffects: diseaseState.showDiseaseEffects !== undefined ? diseaseState.showDiseaseEffects : this._state.showDiseaseEffects,
            diseaseDuration: diseaseState.diseaseDuration || 3000,
            
            // Controle de zoom
            zoom: visualizationState.zoom || this._state.zoom
        };
    }

    // Carrega os módulos necessários
    async loadModules() {
        // Define o objeto temporário baseado para ControlsImpl se necessário
        if (!window.ControlsImpl) {
            console.log("Criando classe ControlsImpl temporária");
            window.ControlsImpl = class {
                constructor() {
                    console.log("ControlsImpl temporário inicializado");
                    this.initialized = false;
                    this.callbacks = {};
                    this.simulationControls = null;
                    this.environmentControls = null;
                    this.visualizationControls = null;
                    this.saveControls = null;
                    this.diseaseControls = null;
                }
                
                setupControls() {
                    console.log("setupControls chamado no ControlsImpl temporário");
                    this.initialized = true;
                }
                
                applyCommonStyles() {
                    console.log("applyCommonStyles chamado no ControlsImpl temporário");
                }
                
                setupEventListeners() {
                    console.log("setupEventListeners chamado no ControlsImpl temporário");
                }
                
                setCallbacks(callbacks) {
                    console.log("setCallbacks chamado no ControlsImpl temporário");
                    this.callbacks = callbacks || {};
                }
                
                getState() { 
                    console.log("getState chamado no ControlsImpl temporário");
                    return {}; 
                }
                
                reinitializeSliders() {
                    console.log("reinitializeSliders chamado no ControlsImpl temporário");
                }
                
                styleAllSliders() {
                    console.log("styleAllSliders chamado no ControlsImpl temporário");
                }
            };
        }

        // Garante que callbacks básicos estejam disponíveis
        if (window.simulation && window.simulation.controls) {
            const existingCallbacks = window.simulation.controls.callbacks || {};
            if (!existingCallbacks.onAddBacteria) {
                console.log("Registrando callback onAddBacteria");
                window.simulation.controls.callbacks = {
                    ...existingCallbacks,
                    onAddBacteria: (count, femaleRatio) => {
                        console.log("[Controls - Early Registration] Callback onAddBacteria chamado", count, femaleRatio);
                        if (window.simulation && window.simulation.addMultipleBacteria) {
                            window.simulation.addMultipleBacteria(Number(count), Number(femaleRatio));
                        }
                    }
                };
            }
        }

        // Verifica se os módulos já estão disponíveis
        if (
            window.ControlsImpl &&
            window.ControlsBase &&
            window.SimulationControls &&
            window.EnvironmentControls &&
            window.VisualizationControls &&
            window.SaveControls &&
            window.DiseaseControls
        ) {
            console.log("Todos os módulos de controle já estão carregados");
            return Promise.resolve();
        }

        // Cria uma função para carregar scripts
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                // Verifica se o script já foi carregado
                const existingScript = document.querySelector(`script[src="${src}"]`);
                if (existingScript) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        // Caminhos para os scripts com ordem correta
        const scripts = [
            'modules/controls/ControlsBase.js',
            'modules/controls/SimulationControls.js',
            'modules/controls/EnvironmentControls.js',
            'modules/controls/VisualizationControls.js',
            'modules/controls/SaveControls.js',
            'modules/controls/DiseaseControls.js',
            'modules/controls/Controls.js'
        ];

        // Carrega todos os scripts
        try {
            console.log("Iniciando carregamento de scripts de controle");
            for (const script of scripts) {
                console.log(`Carregando script: ${script}`);
                await loadScript(script);
                console.log(`Script carregado: ${script}`);
            }
            
            // Registra os callbacks novamente após o carregamento
            window.setTimeout(() => {
                if (window.simulation && window.simulation.controls) {
                    console.log("Registrando callback onAddBacteria após carregamento");
                    const existingCallbacks = window.simulation.controls.callbacks || {};
                    window.simulation.controls.callbacks = {
                        ...existingCallbacks,
                        onAddBacteria: (count, femaleRatio) => {
                            console.log("[Controls - Final Registration] Callback onAddBacteria chamado", count, femaleRatio);
                            if (window.simulation && window.simulation.addMultipleBacteria) {
                                window.simulation.addMultipleBacteria(Number(count), Number(femaleRatio));
                            }
                        }
                    };
                }
            }, 500);
            
            console.log("Todos os scripts de controle carregados com sucesso");
            return Promise.resolve();
        } catch (error) {
            console.error("Erro ao carregar scripts de controle:", error);
            return Promise.reject(error);
        }
    }
}; 