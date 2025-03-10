/**
 * Sistema principal de controles para a simulação
 */

// Atualiza a classe Controls existente
window.ControlsImpl = class extends ControlsBase {
    /**
     * Inicializa o sistema de controles
     */
    constructor() {
        super();
        this.initialized = false;
        this.callbacks = {};
    }

    /**
     * Configura os controles
     */
    setupControls() {
        // Cria o container principal
        this.container = createDiv();
        this.container.id('controls-container');
        this.container.style('position', 'fixed');
        this.container.style('top', '20px');
        this.container.style('right', '20px');
        this.container.style('width', '300px');
        this.container.style('background', '#f8f9fa');
        this.container.style('padding', '20px');
        this.container.style('border-radius', '8px');
        this.container.style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');
        this.container.style('z-index', '1000');
        this.container.style('max-height', 'calc(100vh - 40px)');
        this.container.style('overflow-y', 'auto');
        this.container.style('scrollbar-width', 'thin');
        this.container.style('scrollbar-color', '#4CAF50 #f8f9fa');

        // Previne que eventos do mouse se propaguem para o canvas
        this.container.elt.addEventListener('mousedown', e => e.stopPropagation());
        this.container.elt.addEventListener('mouseup', e => e.stopPropagation());
        this.container.elt.addEventListener('mousemove', e => e.stopPropagation());
        this.container.elt.addEventListener('wheel', e => e.stopPropagation());

        // Inicializa os sub-controles
        this.simulationControls = new SimulationControls(this.container);
        this.environmentControls = new EnvironmentControls(this.container);
        this.visualizationControls = new VisualizationControls(this.container);
        this.saveControls = new SaveControls(this.container);

        // Marca como inicializado
        this.initialized = true;

        // Reinicializa os sliders após a inicialização completa
        window.setTimeout(() => {
            this.reinitializeSliders();
        }, 100);
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        if (!this.initialized || !this.callbacks) return;

        // Configura callbacks para cada módulo
        this.simulationControls?.setupEventListeners(this.callbacks);
        this.environmentControls?.setupEventListeners(this.callbacks);
        this.visualizationControls?.setupEventListeners(this.callbacks);
        this.saveControls?.setupEventListeners(this.callbacks);
    }

    /**
     * Configura os callbacks
     * @param {Object} callbacks - Objeto com os callbacks
     */
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
        if (this.initialized) {
            this.setupEventListeners();
        }
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        if (!this.initialized) {
            return {};
        }

        return {
            ...this.simulationControls?.getState(),
            ...this.environmentControls?.getState(),
            ...this.visualizationControls?.getState(),
            ...this.saveControls?.getState()
        };
    }

    /**
     * Reinicializa os sliders
     */
    reinitializeSliders() {
        if (!this.initialized) return;

        this.simulationControls?.styleAllSliders();
        this.environmentControls?.styleAllSliders();
        this.visualizationControls?.styleAllSliders();
    }
}; 