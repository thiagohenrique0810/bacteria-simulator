/**
 * Sistema de controles para a simulação
 */
class Controls {
    /**
     * Inicializa o sistema de controles
     */
    constructor() {
        this.initialized = false;
        // Aguarda o próximo frame para garantir que p5.js está pronto
        window.setTimeout(() => {
            this.setupControls();
            this.setupEventListeners();
            this.initialized = true;
        }, 50);
    }

    /**
     * Configura os elementos de controle
     */
    setupControls() {
        // Container principal
        this.container = createDiv();
        this.container.position(10, 620);
        this.container.style('padding', '10px');
        this.container.style('margin-bottom', '10px');
        this.container.style('background-color', '#ffffff');
        this.container.style('border-radius', '5px');
        this.container.style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)');
        this.container.style('width', '980px');
        this.container.style('user-select', 'none');

        // Controles de simulação
        this.addSimulationControls();
        
        // Controles de ambiente
        this.addEnvironmentControls();
        
        // Controles de visualização
        this.addVisualizationControls();
        
        // Controles de salvamento
        this.addSaveControls();

        // Estiliza todos os sliders
        this.styleAllSliders();
    }

    /**
     * Adiciona controles de simulação
     */
    addSimulationControls() {
        const simDiv = this.createSection('Controles de Simulação');

        // Velocidade da simulação
        this.speedSlider = createSlider(0.1, 2, 1, 0.1);
        this.speedSlider.elt.type = 'range'; // Força o tipo range
        this.addControlRow(simDiv, 'Velocidade:', this.speedSlider);

        // Botões de controle principais
        const mainButtonsDiv = createDiv();
        mainButtonsDiv.style('margin', '15px 0');
        mainButtonsDiv.style('display', 'flex');
        mainButtonsDiv.style('gap', '10px');
        
        this.pauseButton = createButton('Pausar');
        this.resetButton = createButton('Reiniciar');
        
        [this.pauseButton, this.resetButton].forEach(button => {
            button.style('padding', '8px 15px');
            button.style('border', 'none');
            button.style('border-radius', '4px');
            button.style('background', '#4CAF50');
            button.style('color', 'white');
            button.style('cursor', 'pointer');
            button.style('transition', 'background 0.3s');
            button.mouseOver(() => button.style('background', '#45a049'));
            button.mouseOut(() => button.style('background', '#4CAF50'));
        });
        
        mainButtonsDiv.child(this.pauseButton);
        mainButtonsDiv.child(this.resetButton);
        simDiv.child(mainButtonsDiv);

        // Controles de população
        const popControlsDiv = createDiv();
        popControlsDiv.style('margin-top', '10px');

        // Slider para limite de população
        this.populationLimitSlider = createSlider(20, 200, 100, 10);
        this.populationLimitSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Limite Pop.:', this.populationLimitSlider);

        // Slider para energia inicial
        this.initialEnergySlider = createSlider(50, 150, 100, 10);
        this.initialEnergySlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Energia Inicial:', this.initialEnergySlider);

        simDiv.child(popControlsDiv);
    }

    /**
     * Adiciona controles de ambiente
     */
    addEnvironmentControls() {
        const envDiv = this.createSection('Controles de Ambiente');

        // Taxa de geração de comida
        this.foodRateSlider = createSlider(0, 1, 0.5, 0.1);
        this.foodRateSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Taxa de Comida:', this.foodRateSlider);

        // Valor nutricional da comida
        this.foodValueSlider = createSlider(10, 50, 30, 5);
        this.foodValueSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Valor Nutricional:', this.foodValueSlider);

        // Número máximo de obstáculos
        this.obstacleSlider = createSlider(0, 20, 5, 1);
        this.obstacleSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Obstáculos:', this.obstacleSlider);

        // Controles de ambiente
        const envButtonsDiv = createDiv();
        envButtonsDiv.style('margin', '15px 0');
        envButtonsDiv.style('display', 'flex');
        envButtonsDiv.style('gap', '10px');

        this.eventButton = createButton('Gerar Evento');
        this.clearFoodButton = createButton('Limpar Comida');
        this.clearObstaclesButton = createButton('Limpar Obstáculos');

        [this.eventButton, this.clearFoodButton, this.clearObstaclesButton].forEach(button => {
            button.style('padding', '8px 15px');
            button.style('border', 'none');
            button.style('border-radius', '4px');
            button.style('background', '#4CAF50');
            button.style('color', 'white');
            button.style('cursor', 'pointer');
            button.style('transition', 'background 0.3s');
            button.mouseOver(() => button.style('background', '#45a049'));
            button.mouseOut(() => button.style('background', '#4CAF50'));
        });

        envButtonsDiv.child(this.eventButton);
        envButtonsDiv.child(this.clearFoodButton);
        envButtonsDiv.child(this.clearObstaclesButton);
        envDiv.child(envButtonsDiv);
    }

    /**
     * Adiciona controles de visualização
     */
    addVisualizationControls() {
        const visDiv = this.createSection('Visualização');

        // Checkboxes
        const checkboxes = [
            { label: 'Mostrar Estatísticas', checked: true, ref: 'statsCheckbox' },
            { label: 'Modo Debug', checked: false, ref: 'debugCheckbox' },
            { label: 'Mostrar Rastros', checked: false, ref: 'showTrailsCheckbox' },
            { label: 'Mostrar Energia', checked: true, ref: 'showEnergyCheckbox' },
            { label: 'Mostrar Gênero', checked: true, ref: 'showGenderCheckbox' }
        ];

        checkboxes.forEach(({ label, checked, ref }) => {
            this[ref] = createCheckbox(label, checked);
            this[ref].style('margin', '5px 0');
            this[ref].style('cursor', 'pointer');
            visDiv.child(this[ref]);
        });

        // Controle de zoom
        this.zoomSlider = createSlider(0.5, 2, 1, 0.1);
        this.zoomSlider.elt.type = 'range';
        this.addControlRow(visDiv, 'Zoom:', this.zoomSlider);
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
        row.style('padding', '8px');
        row.style('background-color', '#f5f5f5');
        row.style('border-radius', '4px');
        row.style('border', '1px solid #ddd');
        
        const labelEl = createElement('span', label);
        labelEl.style('margin-right', '10px');
        labelEl.style('min-width', '120px');
        labelEl.style('font-weight', 'bold');
        labelEl.style('color', '#333');
        
        if (control.elt.type === 'range') {
            const valueDisplay = createElement('span', control.value());
            valueDisplay.class('value-display');
            valueDisplay.style('margin-left', '10px');
            valueDisplay.style('min-width', '40px');
            valueDisplay.style('font-weight', 'bold');
            valueDisplay.style('color', '#4CAF50');
            
            row.child(labelEl);
            row.child(control);
            row.child(valueDisplay);
            
            // Atualiza o valor quando o slider muda
            control.input(() => {
                valueDisplay.html(control.value());
            });
        } else {
            row.child(labelEl);
            row.child(control);
        }
        
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

        // Novos event listeners para ambiente
        this.clearFoodButton.mousePressed(() => {
            if (typeof this.onClearFood === 'function') {
                this.onClearFood();
            }
        });

        this.clearObstaclesButton.mousePressed(() => {
            if (typeof this.onClearObstacles === 'function') {
                this.onClearObstacles();
            }
        });

        // Event listeners para controles de visualização
        this.showTrailsCheckbox.changed(() => {
            if (typeof this.onToggleTrails === 'function') {
                this.onToggleTrails(this.showTrailsCheckbox.checked());
            }
        });

        this.showEnergyCheckbox.changed(() => {
            if (typeof this.onToggleEnergy === 'function') {
                this.onToggleEnergy(this.showEnergyCheckbox.checked());
            }
        });

        this.showGenderCheckbox.changed(() => {
            if (typeof this.onToggleGender === 'function') {
                this.onToggleGender(this.showGenderCheckbox.checked());
            }
        });

        // Event listeners para sliders com debounce
        const sliders = [
            this.speedSlider,
            this.populationLimitSlider,
            this.initialEnergySlider,
            this.foodRateSlider,
            this.foodValueSlider,
            this.obstacleSlider,
            this.zoomSlider
        ];

        sliders.forEach(slider => {
            if (slider) {
                slider.input(() => {
                    this.notifyChange();
                    this.updateValueDisplay(slider);
                });
                slider.mousePressed(() => {
                    slider.elt.focus();
                });
                slider.mouseReleased(() => {
                    this.notifyChange();
                    this.updateValueDisplay(slider);
                });
                slider.elt.addEventListener('keydown', (e) => {
                    let value = parseFloat(slider.value());
                    const step = parseFloat(slider.elt.step) || 1;
                    
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        slider.value(value + step);
                        this.notifyChange();
                        this.updateValueDisplay(slider);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        slider.value(value - step);
                        this.notifyChange();
                        this.updateValueDisplay(slider);
                    }
                });
            }
        });
    }

    /**
     * Notifica mudança nos controles
     */
    notifyChange() {
        if (!this.initialized) return;
        
        if (typeof this.onChange === 'function') {
            const state = this.getState();
            this.onChange(state);
            
            // Força atualização visual
            this.updateAllValueDisplays();
        }
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        if (!this.initialized) {
            return {
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
                zoom: 1
            };
        }

        return {
            simulationSpeed: this.speedSlider?.value() || 1,
            foodRate: this.foodRateSlider?.value() || 0.5,
            foodValue: this.foodValueSlider?.value() || 30,
            maxObstacles: this.obstacleSlider?.value() || 5,
            populationLimit: this.populationLimitSlider?.value() || 100,
            initialEnergy: this.initialEnergySlider?.value() || 100,
            showStats: this.statsCheckbox?.checked() || true,
            debugMode: this.debugCheckbox?.checked() || false,
            showTrails: this.showTrailsCheckbox?.checked() || false,
            showEnergy: this.showEnergyCheckbox?.checked() || true,
            showGender: this.showGenderCheckbox?.checked() || true,
            zoom: this.zoomSlider?.value() || 1
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
        this.onClearFood = callbacks.onClearFood;
        this.onClearObstacles = callbacks.onClearObstacles;
        this.onToggleTrails = callbacks.onToggleTrails;
        this.onToggleEnergy = callbacks.onToggleEnergy;
        this.onToggleGender = callbacks.onToggleGender;
        this.onChange = callbacks.onChange;
    }

    /**
     * Estiliza todos os sliders
     */
    styleAllSliders() {
        const sliders = [
            this.speedSlider,
            this.populationLimitSlider,
            this.initialEnergySlider,
            this.foodRateSlider,
            this.foodValueSlider,
            this.obstacleSlider,
            this.zoomSlider
        ];

        sliders.forEach(slider => {
            if (slider) {
                // Configuração básica do slider
                slider.elt.type = 'range';
                slider.style('width', '200px');
                slider.style('margin', '0 10px');
                
                // Estilo do slider
                slider.style('appearance', 'none');
                slider.style('-webkit-appearance', 'none');
                slider.style('-moz-appearance', 'none');
                slider.style('background', '#ddd');
                slider.style('height', '8px');
                slider.style('border-radius', '4px');
                slider.style('outline', 'none');
                
                // Estilo do thumb para diferentes navegadores
                const thumbStyle = `
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #4CAF50;
                    cursor: pointer;
                    border: none;
                    margin-top: -6px;
                `;
                
                slider.style('::-webkit-slider-thumb', `{
                    -webkit-appearance: none;
                    appearance: none;
                    ${thumbStyle}
                }`);
                
                slider.style('::-moz-range-thumb', `{
                    ${thumbStyle}
                }`);
                
                slider.style('::-ms-thumb', `{
                    ${thumbStyle}
                }`);
                
                // Eventos do slider
                slider.input(() => {
                    this.notifyChange();
                    this.updateValueDisplay(slider);
                });
                
                slider.mousePressed(() => {
                    slider.elt.focus();
                });
                
                slider.mouseReleased(() => {
                    this.notifyChange();
                    this.updateValueDisplay(slider);
                });
                
                // Garante que o slider responda ao teclado
                slider.elt.addEventListener('keydown', (e) => {
                    let value = parseFloat(slider.value());
                    const step = parseFloat(slider.elt.step) || 1;
                    
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        slider.value(value + step);
                        this.notifyChange();
                        this.updateValueDisplay(slider);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        slider.value(value - step);
                        this.notifyChange();
                        this.updateValueDisplay(slider);
                    }
                });
            }
        });
    }

    /**
     * Atualiza o display de valor do slider
     */
    updateValueDisplay(slider) {
        const row = slider.elt.parentElement;
        const valueDisplay = row.querySelector('.value-display');
        if (valueDisplay) {
            valueDisplay.textContent = slider.value();
        }
    }

    /**
     * Atualiza todos os displays de valor
     */
    updateAllValueDisplays() {
        const sliders = [
            this.speedSlider,
            this.populationLimitSlider,
            this.initialEnergySlider,
            this.foodRateSlider,
            this.foodValueSlider,
            this.obstacleSlider,
            this.zoomSlider
        ];

        sliders.forEach(slider => {
            if (slider) {
                this.updateValueDisplay(slider);
            }
        });
    }
}

// Tornando a classe global
window.Controls = Controls; 