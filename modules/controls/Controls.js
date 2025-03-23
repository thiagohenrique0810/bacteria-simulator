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
        // Procura o container de predadores para reutilizá-lo
        this.container = select('#predator-controls-container');
        
        // Se não encontrar (improvável), cria um novo
        if (!this.container) {
            this.container = createDiv();
            this.container.id('controls-container');
            this.container.style('position', 'fixed');
            this.container.style('top', '0');
            this.container.style('right', '0');
            this.container.style('width', '250px');
            this.container.style('height', '100%');
            this.container.style('background-color', 'rgba(35, 35, 40, 0.9)');
            this.container.style('padding', '10px');
            this.container.style('border-left', '1px solid rgba(60,60,70,0.8)');
            this.container.style('box-shadow', '-2px 0 10px rgba(0,0,0,0.2)');
            this.container.style('overflow-y', 'auto');
            this.container.style('z-index', '1000');
            this.container.style('display', 'flex');
            this.container.style('flex-direction', 'column');
            this.container.style('color', '#e0e0e0');
            
            // Adiciona título
            const title = createDiv('Controles do Simulador');
            title.parent(this.container);
            title.style('font-size', '16px');
            title.style('font-weight', 'bold');
            title.style('margin-bottom', '15px');
            title.style('text-align', 'center');
            title.style('padding-bottom', '5px');
            title.style('border-bottom', '1px solid rgba(100,100,120,0.5)');
        }

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

        // Adiciona estilos comuns a todos os controles
        this.applyCommonStyles();

        // Marca como inicializado
        this.initialized = true;

        // Reinicializa os sliders após a inicialização completa
        window.setTimeout(() => {
            this.reinitializeSliders();
        }, 100);
    }
    
    /**
     * Aplica estilos comuns a todos os elementos de controle
     */
    applyCommonStyles() {
        // Estiliza todos os elementos h3 (títulos de seção)
        selectAll('h3', this.container).forEach(el => {
            el.style('font-size', '14px');
            el.style('font-weight', 'bold');
            el.style('margin-top', '15px');
            el.style('margin-bottom', '8px');
            el.style('padding-bottom', '5px');
            el.style('color', '#80c9ff');
            el.style('border-bottom', '1px solid rgba(100,150,200,0.3)');
        });
        
        // Estiliza todos os elementos h4 (subtítulos)
        selectAll('h4', this.container).forEach(el => {
            el.style('font-size', '13px');
            el.style('font-weight', 'bold');
            el.style('margin-top', '12px');
            el.style('margin-bottom', '6px');
            el.style('color', '#b8e0ff');
        });
        
        // Estiliza checkboxes
        selectAll('input[type="checkbox"]', this.container).forEach(el => {
            el.style('margin-right', '8px');
            el.style('cursor', 'pointer');
        });
        
        // Estiliza labels
        selectAll('label', this.container).forEach(el => {
            el.style('display', 'flex');
            el.style('align-items', 'center');
            el.style('margin-bottom', '6px');
            el.style('font-size', '12px');
            el.style('cursor', 'pointer');
        });
        
        // Estiliza botões
        selectAll('button', this.container).forEach(el => {
            el.style('background-color', '#2a4d69');
            el.style('color', 'white');
            el.style('border', 'none');
            el.style('border-radius', '4px');
            el.style('padding', '6px 12px');
            el.style('margin', '5px 0');
            el.style('cursor', 'pointer');
            el.style('transition', 'background-color 0.3s');
            el.mouseOver(() => el.style('background-color', '#3a6d99'));
            el.mouseOut(() => el.style('background-color', '#2a4d69'));
        });
        
        // Estiliza sliders
        this.styleAllSliders();
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
        this.saveControls?.styleAllSliders();
        
        console.log('Sliders reinicializados');
    }
    
    /**
     * Estiliza todos os sliders
     */
    styleAllSliders() {
        // Seleciona todos os sliders
        selectAll('input[type="range"]', this.container).forEach(slider => {
            // Aplica estilos
            slider.style('width', '100%');
            slider.style('height', '8px');
            slider.style('outline', 'none');
            slider.style('border-radius', '4px');
            slider.style('background', '#1a2a3a');
            slider.style('appearance', 'none');
            slider.style('-webkit-appearance', 'none');
            slider.style('margin', '10px 0');
            
            // Estilos específicos para diferentes navegadores
            slider.style('::-webkit-slider-thumb', '{appearance: none; -webkit-appearance: none; width: 16px; height: 16px; background: #4d94ff; border-radius: 50%; cursor: pointer;}');
            slider.style('::-moz-range-thumb', '{width: 16px; height: 16px; background: #4d94ff; border-radius: 50%; cursor: pointer; border: none;}');
            slider.style('::-ms-thumb', '{width: 16px; height: 16px; background: #4d94ff; border-radius: 50%; cursor: pointer;}');
        });
    }
}; 