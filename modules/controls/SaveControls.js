/**
 * Controles de salvamento da simulação
 */
window.SaveControls = class SaveControls extends ControlsBase {
    /**
     * Inicializa os controles de salvamento
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles de salvamento
     */
    setupControls() {
        const saveDiv = this.createSection(this.container, 'Salvamento');

        // Botões de salvamento
        const buttonDiv = createDiv();
        buttonDiv.style('display', 'flex');
        buttonDiv.style('gap', '10px');
        buttonDiv.style('margin-top', '10px');

        this.saveButton = createButton('Salvar Estado');
        this.loadButton = createButton('Carregar Estado');
        
        [this.saveButton, this.loadButton].forEach(button => {
            button.style('padding', '8px 15px');
            button.style('border', 'none');
            button.style('border-radius', '4px');
            button.style('background', '#4CAF50');
            button.style('color', 'white');
            button.style('cursor', 'pointer');
            button.style('transition', 'background 0.3s');
            button.style('flex', '1');
            button.mouseOver(() => button.style('background', '#45a049'));
            button.mouseOut(() => button.style('background', '#4CAF50'));
        });

        buttonDiv.child(this.saveButton);
        buttonDiv.child(this.loadButton);
        saveDiv.child(buttonDiv);
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners(callbacks) {
        this.saveButton.mousePressed(() => {
            if (callbacks.onSave) {
                callbacks.onSave();
            }
        });

        this.loadButton.mousePressed(() => {
            if (callbacks.onLoad) {
                callbacks.onLoad();
            }
        });
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {}; // Não há estado para salvar neste módulo
    }
} 