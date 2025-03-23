/**
 * Sistema principal de controles para a simulação
 */

// Atualiza a classe Controls existente
window.ControlsImpl = class extends ControlsBase {
    /**
     * Inicializa o sistema de controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles
     */
    setupControls() {
        // Verifica se já existe um container e remove-o caso exista
        const existingContainer = select('#controls-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Sempre cria um novo container para garantir que tenhamos apenas um
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
        document.body.appendChild(this.container.elt);
        
        // Adiciona título
        const title = createDiv('Controles do Simulador');
        title.parent(this.container);
        title.style('font-size', '16px');
        title.style('font-weight', 'bold');
        title.style('margin-bottom', '15px');
        title.style('text-align', 'center');
        title.style('padding-bottom', '5px');
        title.style('border-bottom', '1px solid rgba(100,100,120,0.5)');

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
        this.predatorControls = new PredatorControls(this.container);
        this.diseaseControls = new DiseaseControls(this.container);

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

        // Configura callbacks para cada módulo, verificando se cada módulo existe e tem o método
        if (this.simulationControls && typeof this.simulationControls.setupEventListeners === 'function') {
            this.simulationControls.setupEventListeners(this.callbacks);
        }
        
        if (this.environmentControls && typeof this.environmentControls.setupEventListeners === 'function') {
            this.environmentControls.setupEventListeners(this.callbacks);
        }
        
        if (this.visualizationControls && typeof this.visualizationControls.setupEventListeners === 'function') {
            this.visualizationControls.setupEventListeners(this.callbacks);
        }
        
        if (this.saveControls && typeof this.saveControls.setupEventListeners === 'function') {
            this.saveControls.setupEventListeners(this.callbacks);
        }
        
        // Verificação para predatorControls
        if (this.predatorControls && typeof this.predatorControls.setupEventListeners === 'function') {
            try {
                this.predatorControls.setupEventListeners(this.callbacks);
            } catch (error) {
                console.warn("Não foi possível configurar event listeners para PredatorControls:", error);
            }
        }
        
        // Verificação extra para diseaseControls que está causando o problema
        if (this.diseaseControls && typeof this.diseaseControls.setupEventListeners === 'function') {
            try {
                this.diseaseControls.setupEventListeners(this.callbacks);
            } catch (error) {
                console.warn("Não foi possível configurar event listeners para DiseaseControls:", error);
            }
        } else if (this.diseaseControls) {
            console.warn("DiseaseControls existe mas não tem o método setupEventListeners");
        } else {
            console.warn("DiseaseControls não existe");
        }
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

        let state = {};
        
        // Coleta estado de cada controle se existir e tiver o método getState
        if (this.simulationControls && typeof this.simulationControls.getState === 'function') {
            state = {...state, ...this.simulationControls.getState()};
        }
        
        if (this.environmentControls && typeof this.environmentControls.getState === 'function') {
            state = {...state, ...this.environmentControls.getState()};
        }
        
        if (this.visualizationControls && typeof this.visualizationControls.getState === 'function') {
            state = {...state, ...this.visualizationControls.getState()};
        }
        
        if (this.saveControls && typeof this.saveControls.getState === 'function') {
            state = {...state, ...this.saveControls.getState()};
        }
        
        if (this.diseaseControls && typeof this.diseaseControls.getState === 'function') {
            state = {...state, ...this.diseaseControls.getState()};
        }
        
        if (this.predatorControls && typeof this.predatorControls.getState === 'function') {
            state = {...state, ...this.predatorControls.getState()};
        }
        
        return state;
    }

    /**
     * Reinicializa os sliders
     */
    reinitializeSliders() {
        if (!this.initialized) return;
        
        // Verifica se cada controle existe e tem o método styleAllSliders
        if (this.simulationControls && typeof this.simulationControls.styleAllSliders === 'function') {
            this.simulationControls.styleAllSliders();
        }
        
        if (this.environmentControls && typeof this.environmentControls.styleAllSliders === 'function') {
            this.environmentControls.styleAllSliders();
        }
        
        if (this.visualizationControls && typeof this.visualizationControls.styleAllSliders === 'function') {
            this.visualizationControls.styleAllSliders();
        }
        
        if (this.saveControls && typeof this.saveControls.styleAllSliders === 'function') {
            this.saveControls.styleAllSliders();
        }
        
        if (this.diseaseControls && typeof this.diseaseControls.styleAllSliders === 'function') {
            this.diseaseControls.styleAllSliders();
        }
        
        // Verifica se predatorControls existe e tem o método styleAllSliders
        if (this.predatorControls && typeof this.predatorControls.styleAllSliders === 'function') {
            this.predatorControls.styleAllSliders();
        }
        
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

// Define a classe Controls global para usar em Simulation
window.Controls = window.ControlsImpl; 