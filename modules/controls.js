/**
 * Sistema de controles para a simulação
 */
class Controls {
    /**
     * Inicializa o sistema de controles
     */
    constructor() {
        this.setupControls();
        this.setupEventListeners();
    }

    /**
     * Configura os elementos de controle
     */
    setupControls() {
        // Container principal
        this.container = createDiv();
        this.container.style('padding', '10px');
        this.container.style('margin-bottom', '10px');
        this.container.style('background-color', '#ffffff');
        this.container.style('border-radius', '5px');
        this.container.style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)');

        // Controles de simulação
        this.addSimulationControls();
        
        // Controles de ambiente
        this.addEnvironmentControls();
        
        // Controles de visualização
        this.addVisualizationControls();
        
        // Controles de salvamento
        this.addSaveControls();
    }

    /**
     * Adiciona controles de simulação
     */
    addSimulationControls() {
        const simDiv = this.createSection('Controles de Simulação');

        // Velocidade da simulação
        this.speedSlider = createSlider(0.1, 2, 1, 0.1);
        this.addControlRow(simDiv, 'Velocidade:', this.speedSlider);

        // Botões de controle
        this.pauseButton = createButton('Pausar');
        this.resetButton = createButton('Reiniciar');
        
        const buttonDiv = createDiv();
        buttonDiv.child(this.pauseButton);
        buttonDiv.child(this.resetButton);
        simDiv.child(buttonDiv);
    }

    /**
     * Adiciona controles de ambiente
     */
    addEnvironmentControls() {
        const envDiv = this.createSection('Controles de Ambiente');

        // Taxa de geração de comida
        this.foodRateSlider = createSlider(0, 1, 0.5, 0.1);
        this.addControlRow(envDiv, 'Taxa de Comida:', this.foodRateSlider);

        // Número máximo de obstáculos
        this.obstacleSlider = createSlider(0, 20, 5, 1);
        this.addControlRow(envDiv, 'Obstáculos:', this.obstacleSlider);

        // Botão de evento aleatório
        this.eventButton = createButton('Gerar Evento');
        envDiv.child(this.eventButton);
    }

    /**
     * Adiciona controles de visualização
     */
    addVisualizationControls() {
        const visDiv = this.createSection('Visualização');

        // Mostrar estatísticas
        this.statsCheckbox = createCheckbox('Mostrar Estatísticas', true);
        visDiv.child(this.statsCheckbox);

        // Mostrar debug
        this.debugCheckbox = createCheckbox('Modo Debug', false);
        visDiv.child(this.debugCheckbox);
    }

    /**
     * Adiciona controles de salvamento
     */
    addSaveControls() {
        const saveDiv = this.createSection('Salvamento');

        // Botões de salvamento
        this.saveButton = createButton('Salvar Estado');
        this.loadButton = createButton('Carregar Estado');
        
        const buttonDiv = createDiv();
        buttonDiv.child(this.saveButton);
        buttonDiv.child(this.loadButton);
        saveDiv.child(buttonDiv);
    }

    /**
     * Cria uma seção de controles
     * @param {string} title - Título da seção
     * @returns {p5.Element} - Elemento div da seção
     */
    createSection(title) {
        const div = createDiv();
        div.style('margin-bottom', '15px');
        
        const titleEl = createElement('h3', title);
        titleEl.style('margin', '0 0 10px 0');
        titleEl.style('font-size', '16px');
        div.child(titleEl);
        
        this.container.child(div);
        return div;
    }

    /**
     * Adiciona uma linha de controle com label
     * @param {p5.Element} parent - Elemento pai
     * @param {string} label - Label do controle
     * @param {p5.Element} control - Elemento de controle
     */
    addControlRow(parent, label, control) {
        const row = createDiv();
        row.style('display', 'flex');
        row.style('align-items', 'center');
        row.style('margin-bottom', '10px');
        
        const labelEl = createElement('span', label);
        labelEl.style('margin-right', '10px');
        labelEl.style('min-width', '100px');
        
        row.child(labelEl);
        row.child(control);
        parent.child(row);
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Simulação
        this.pauseButton.mousePressed(() => {
            const isPaused = this.pauseButton.html() === 'Continuar';
            this.pauseButton.html(isPaused ? 'Pausar' : 'Continuar');
            if (typeof this.onPauseToggle === 'function') {
                this.onPauseToggle(!isPaused);
            }
        });

        this.resetButton.mousePressed(() => {
            if (typeof this.onReset === 'function') {
                this.onReset();
            }
        });

        // Ambiente
        this.eventButton.mousePressed(() => {
            if (typeof this.onRandomEvent === 'function') {
                this.onRandomEvent();
            }
        });

        // Salvamento
        this.saveButton.mousePressed(() => {
            if (typeof this.onSave === 'function') {
                this.onSave();
            }
        });

        this.loadButton.mousePressed(() => {
            if (typeof this.onLoad === 'function') {
                this.onLoad();
            }
        });
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            simulationSpeed: this.speedSlider.value(),
            foodRate: this.foodRateSlider.value(),
            maxObstacles: this.obstacleSlider.value(),
            showStats: this.statsCheckbox.checked(),
            debugMode: this.debugCheckbox.checked()
        };
    }

    /**
     * Define callbacks para eventos
     * @param {Object} callbacks - Objeto com callbacks
     */
    setCallbacks(callbacks) {
        this.onPauseToggle = callbacks.onPauseToggle;
        this.onReset = callbacks.onReset;
        this.onRandomEvent = callbacks.onRandomEvent;
        this.onSave = callbacks.onSave;
        this.onLoad = callbacks.onLoad;
    }
}

// Tornando a classe global
window.Controls = Controls; 