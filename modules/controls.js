/**
 * Sistema de controles para a simulação
 */
class Controls {
    /**
     * Inicializa o sistema de controles
     */
    constructor() {
        this.initialized = false;
        // Aumenta o tempo de espera para garantir que o p5.js esteja pronto
        window.setTimeout(() => {
            this.setupControls();
            this.setupEventListeners();
            this.initialized = true;
            console.log('Controles inicializados');
        }, 500);
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
        this.container.style('z-index', '1000');
        this.container.style('pointer-events', 'auto'); // Garante que os eventos do mouse sejam capturados
        this.container.id('controls-container');

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

        // Previne propagação de eventos do mouse para o canvas
        this.container.elt.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
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

        // Slider para tempo de vida base (em horas)
        this.lifespanSlider = createSlider(1, 24, 12, 1);
        this.lifespanSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Tempo de Vida (h):', this.lifespanSlider);

        // Slider para taxa de perda de saúde
        this.healthLossSlider = createSlider(0.01, 0.2, 0.05, 0.01);
        this.healthLossSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Perda de Saúde:', this.healthLossSlider);

        // Slider para intervalo de alimentação (em minutos)
        this.feedingIntervalSlider = createSlider(1, 60, 30, 1);
        this.feedingIntervalSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Intervalo Alimentação (min):', this.feedingIntervalSlider);

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
        row.style('position', 'relative');
        row.style('z-index', '1001');

        // Label
        const labelEl = createDiv(label);
        labelEl.style('width', '150px');
        labelEl.style('margin-right', '10px');
        labelEl.style('font-size', '14px');
        row.child(labelEl);

        // Control
        const controlWrapper = createDiv();
        controlWrapper.style('flex', '1');
        controlWrapper.child(control);
        row.child(controlWrapper);

        // Valor atual
        const valueDisplay = createDiv('0');
        valueDisplay.style('width', '50px');
        valueDisplay.style('margin-left', '10px');
        valueDisplay.style('text-align', 'right');
        valueDisplay.style('font-family', 'monospace');
        row.child(valueDisplay);

        // Atualiza o valor inicial
        const updateValue = () => {
            const value = control.value();
            valueDisplay.html(typeof value === 'number' ? value.toFixed(2) : value);
        };

        // Adiciona listener para atualização
        control.input(updateValue);
        updateValue(); // Atualiza valor inicial

        parent.child(row);
        return row;
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Simulação
        this.pauseButton.mousePressed(() => {
            const isPaused = this.pauseButton.html() === 'Continuar';
            this.pauseButton.html(isPaused ? 'Pausar' : 'Continuar');
            if (this.onPauseToggle) {
                this.onPauseToggle(!isPaused);
            }
        });

        this.resetButton.mousePressed(() => {
            if (this.onReset) {
                this.onReset();
            }
        });

        // Ambiente
        this.eventButton.mousePressed(() => {
            if (this.onRandomEvent) {
                this.onRandomEvent();
            }
        });

        // Salvamento
        this.saveButton.mousePressed(() => {
            if (this.onSave) {
                this.onSave();
            }
        });

        this.loadButton.mousePressed(() => {
            if (this.onLoad) {
                this.onLoad();
            }
        });

        // Novos event listeners para ambiente
        this.clearFoodButton.mousePressed(() => {
            if (this.onClearFood) {
                this.onClearFood();
            }
        });

        this.clearObstaclesButton.mousePressed(() => {
            if (this.onClearObstacles) {
                this.onClearObstacles();
            }
        });

        // Event listeners para controles de visualização
        this.showTrailsCheckbox.changed(() => {
            if (this.onToggleTrails) {
                this.onToggleTrails(this.showTrailsCheckbox.checked());
            }
        });

        this.showEnergyCheckbox.changed(() => {
            if (this.onToggleEnergy) {
                this.onToggleEnergy(this.showEnergyCheckbox.checked());
            }
        });

        this.showGenderCheckbox.changed(() => {
            if (this.onToggleGender) {
                this.onToggleGender(this.showGenderCheckbox.checked());
            }
        });

        // Eventos de simulação
        this.speedSlider.input(() => {
            if (this.callbacks.onSpeedChange) {
                this.callbacks.onSpeedChange(this.speedSlider.value());
            }
        });

        this.lifespanSlider.input(() => {
            if (this.callbacks.onLifespanChange) {
                // Converte horas para frames (1 hora = 3600 segundos * 60 frames)
                this.callbacks.onLifespanChange(this.lifespanSlider.value() * 3600 * 60);
            }
        });

        this.healthLossSlider.input(() => {
            if (this.callbacks.onHealthLossChange) {
                this.callbacks.onHealthLossChange(this.healthLossSlider.value());
            }
        });

        this.feedingIntervalSlider.input(() => {
            if (this.callbacks.onFeedingIntervalChange) {
                // Converte minutos para frames (1 minuto = 60 segundos * 60 frames)
                this.callbacks.onFeedingIntervalChange(this.feedingIntervalSlider.value() * 60 * 60);
            }
        });
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

        // Garante que todos os valores são números
        return {
            simulationSpeed: Number(this.speedSlider?.value()) || 1,
            foodRate: Number(this.foodRateSlider?.value()) || 0.5,
            foodValue: Number(this.foodValueSlider?.value()) || 30,
            maxObstacles: Number(this.obstacleSlider?.value()) || 5,
            populationLimit: Number(this.populationLimitSlider?.value()) || 100,
            initialEnergy: Number(this.initialEnergySlider?.value()) || 100,
            showStats: this.statsCheckbox?.checked() || true,
            debugMode: this.debugCheckbox?.checked() || false,
            showTrails: this.showTrailsCheckbox?.checked() || false,
            showEnergy: this.showEnergyCheckbox?.checked() || true,
            showGender: this.showGenderCheckbox?.checked() || true,
            zoom: Number(this.zoomSlider?.value()) || 1
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
        this.callbacks = callbacks;
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
                
                // Remove estilos padrão
                slider.style('appearance', 'none');
                slider.style('-webkit-appearance', 'none');
                slider.style('-moz-appearance', 'none');
                
                // Estilo base do slider
                slider.style('width', '200px');
                slider.style('height', '8px');
                slider.style('background', '#ddd');
                slider.style('outline', 'none');
                slider.style('opacity', '1');
                slider.style('transition', 'opacity .2s');
                slider.style('border-radius', '4px');
                slider.style('cursor', 'pointer');
                slider.style('z-index', '1002');
                
                // Estilo do track
                const trackStyle = `
                    height: 8px;
                    background: #ddd;
                    border-radius: 4px;
                    border: none;
                `;
                
                slider.style('::-webkit-slider-runnable-track', `{${trackStyle}}`);
                slider.style('::-moz-range-track', `{${trackStyle}}`);
                slider.style('::-ms-track', `{${trackStyle}}`);
                
                // Estilo do thumb
                const thumbStyle = `
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #4CAF50;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    margin-top: -6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    transition: background .2s, box-shadow .2s;
                `;
                
                slider.style('::-webkit-slider-thumb', `{${thumbStyle}}`);
                slider.style('::-moz-range-thumb', `{${thumbStyle}}`);
                slider.style('::-ms-thumb', `{${thumbStyle}}`);
                
                // Hover e focus states
                slider.style(':hover', '{opacity: 0.9;}');
                slider.style(':focus', '{outline: none;}');
                slider.style(':active::-webkit-slider-thumb', '{background: #45a049; box-shadow: 0 2px 5px rgba(0,0,0,0.5);}');
                slider.style(':active::-moz-range-thumb', '{background: #45a049; box-shadow: 0 2px 5px rgba(0,0,0,0.5);}');
                
                // Força atualização inicial
                slider.elt.value = slider.value();
                this.updateValueDisplay(slider);
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