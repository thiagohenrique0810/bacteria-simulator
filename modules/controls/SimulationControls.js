/**
 * Controles específicos da simulação
 */
window.SimulationControls = class SimulationControls extends ControlsBase {
    /**
     * Inicializa os controles de simulação
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles de simulação
     */
    setupControls() {
        const simDiv = this.createSection(this.container, 'Controles de Simulação');

        // Velocidade da simulação (aumentando o máximo para 5)
        this.speedSlider = createSlider(0.1, 5, 1, 0.1);
        this.speedSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Velocidade:', this.speedSlider);

        // Botões de controle principais
        const mainButtonsDiv = createDiv();
        mainButtonsDiv.style('margin', '15px 0');
        mainButtonsDiv.style('display', 'flex');
        mainButtonsDiv.style('gap', '10px');
        
        this.pauseButton = createButton('Pausar');
        this.resetButton = createButton('Reiniciar');
        
        // Estiliza os botões
        [this.pauseButton, this.resetButton].forEach(button => {
            button.style('padding', '8px 15px');
            button.style('border', 'none');
            button.style('border-radius', '4px');
            button.style('background', '#4CAF50');
            button.style('color', 'white');
            button.style('cursor', 'pointer');
            button.style('transition', 'background 0.3s');
            button.style('font-size', '14px');
            button.style('font-family', 'Arial, sans-serif');
            button.mouseOver(() => button.style('background', '#45a049'));
            button.mouseOut(() => button.style('background', '#4CAF50'));
        });
        
        mainButtonsDiv.child(this.pauseButton);
        mainButtonsDiv.child(this.resetButton);
        simDiv.child(mainButtonsDiv);

        // Controles de população
        this.populationLimitSlider = createSlider(20, 200, 100, 10);
        this.populationLimitSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Limite Pop.:', this.populationLimitSlider);

        // Energia inicial (aumentando o valor padrão)
        this.initialEnergySlider = createSlider(50, 200, 150, 10);
        this.initialEnergySlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Energia Inicial:', this.initialEnergySlider);

        // Tempo de vida (aumentando o valor padrão)
        this.lifespanSlider = createSlider(1, 48, 24, 1);
        this.lifespanSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Tempo de Vida (h):', this.lifespanSlider);

        // Perda de saúde (diminuindo o valor padrão)
        this.healthLossSlider = createSlider(0.01, 0.3, 0.05, 0.01);
        this.healthLossSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Perda de Saúde:', this.healthLossSlider);

        // Intervalo de alimentação (aumentando o valor padrão)
        this.feedingIntervalSlider = createSlider(1, 15, 8, 1);
        this.feedingIntervalSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Intervalo Alimentação (min):', this.feedingIntervalSlider);

        // Botão de reprodução forçada
        const reproductionButton = createButton('Forçar Reprodução');
        reproductionButton.style('margin', '5px');
        reproductionButton.style('padding', '5px 10px');
        reproductionButton.style('cursor', 'pointer');
        this.container.child(reproductionButton);
        this.reproductionButton = reproductionButton;
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners(callbacks) {
        if (!callbacks) return;

        // Configura os botões principais
        this.pauseButton.mousePressed(() => {
            const isPaused = this.pauseButton.html() === 'Continuar';
            this.pauseButton.html(isPaused ? 'Pausar' : 'Continuar');
            if (callbacks.onPauseToggle) {
                callbacks.onPauseToggle(!isPaused);
            }
        });

        this.resetButton.mousePressed(() => {
            if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
                if (callbacks.onReset) {
                    callbacks.onReset();
                }
            }
        });

        // Função auxiliar para notificar mudanças
        const notifyChange = () => {
            if (callbacks.onChange) {
                callbacks.onChange(this.getState());
            }
        };

        // Eventos de simulação
        this.speedSlider.input(() => {
            if (callbacks.onSpeedChange) {
                callbacks.onSpeedChange(this.speedSlider.value());
            }
            notifyChange();
        });

        this.populationLimitSlider.input(notifyChange);
        this.initialEnergySlider.input(notifyChange);
        this.lifespanSlider.input(() => {
            if (callbacks.onLifespanChange) {
                callbacks.onLifespanChange(this.lifespanSlider.value() * 3600);
            }
            notifyChange();
        });

        this.healthLossSlider.input(() => {
            if (callbacks.onHealthLossChange) {
                callbacks.onHealthLossChange(this.healthLossSlider.value());
            }
            notifyChange();
        });

        this.feedingIntervalSlider.input(() => {
            if (callbacks.onFeedingIntervalChange) {
                callbacks.onFeedingIntervalChange(this.feedingIntervalSlider.value() * 60);
            }
            notifyChange();
        });

        // Evento do botão de reprodução
        this.reproductionButton.mousePressed(() => {
            if (callbacks.onForceReproduction) {
                callbacks.onForceReproduction();
            }
        });
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            simulationSpeed: Number(this.speedSlider?.value()) || 1,
            populationLimit: Number(this.populationLimitSlider?.value()) || 100,
            initialEnergy: Number(this.initialEnergySlider?.value()) || 100,
            lifespan: Number(this.lifespanSlider?.value()) || 12,
            healthLossRate: Number(this.healthLossSlider?.value()) || 0.05,
            feedingInterval: Number(this.feedingIntervalSlider?.value()) || 4
        };
    }
}; 