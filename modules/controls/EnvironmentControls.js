/**
 * Controles do ambiente da simulação
 */
window.EnvironmentControls = class EnvironmentControls extends ControlsBase {
    /**
     * Inicializa os controles do ambiente
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles do ambiente
     */
    setupControls() {
        const envDiv = this.createSection(this.container, 'Controles de Ambiente');

        // Taxa de geração de comida
        this.foodRateSlider = createSlider(0, 1, 0.5, 0.1);
        this.foodRateSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Taxa de Comida:', this.foodRateSlider);

        // Valor nutricional da comida
        this.foodValueSlider = createSlider(10, 50, 30, 5);
        this.foodValueSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Valor Nutricional:', this.foodValueSlider);

        // Intervalo de spawn de comida
        this.foodSpawnIntervalSlider = createSlider(1, 10, 3, 1);
        this.foodSpawnIntervalSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Intervalo Spawn (s):', this.foodSpawnIntervalSlider);

        // Quantidade de comida por spawn
        this.foodSpawnAmountSlider = createSlider(1, 10, 3, 1);
        this.foodSpawnAmountSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Qtd. por Spawn:', this.foodSpawnAmountSlider);

        // Número máximo de obstáculos
        this.obstacleSlider = createSlider(0, 20, 5, 1);
        this.obstacleSlider.elt.type = 'range';
        this.addControlRow(envDiv, 'Obstáculos:', this.obstacleSlider);

        // Botões de ambiente
        const envButtonsDiv = createDiv();
        envButtonsDiv.style('margin', '15px 0');
        envButtonsDiv.style('display', 'flex');
        envButtonsDiv.style('gap', '10px');
        envButtonsDiv.style('flex-wrap', 'wrap');

        this.eventButton = createButton('Gerar Evento');
        this.clearFoodButton = createButton('Limpar Comida');
        this.clearObstaclesButton = createButton('Limpar Obstáculos');

        // Estiliza os botões
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
            button.style('flex', '1');
            button.style('min-width', '120px');
            button.style('font-size', '14px');
            button.style('font-family', 'Arial, sans-serif');
        });

        // Adiciona os botões ao container
        envButtonsDiv.child(this.eventButton);
        envButtonsDiv.child(this.clearFoodButton);
        envButtonsDiv.child(this.clearObstaclesButton);
        envDiv.child(envButtonsDiv);
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners(callbacks) {
        if (!callbacks) return;

        // Função auxiliar para notificar mudanças
        const notifyChange = () => {
            if (callbacks.onChange) {
                callbacks.onChange(this.getState());
            }
        };

        // Eventos de ambiente
        this.foodRateSlider.input(notifyChange);
        this.foodValueSlider.input(notifyChange);
        this.obstacleSlider.input(notifyChange);
        this.foodSpawnIntervalSlider.input(notifyChange);
        this.foodSpawnAmountSlider.input(notifyChange);

        // Botões de controle
        this.eventButton.mousePressed(() => {
            if (callbacks.onRandomEvent) {
                callbacks.onRandomEvent();
            }
        });

        this.clearFoodButton.mousePressed(() => {
            if (callbacks.onClearFood) {
                callbacks.onClearFood();
            }
        });

        this.clearObstaclesButton.mousePressed(() => {
            console.log('Botão Limpar Obstáculos clicado');
            if (callbacks.onClearObstacles) {
                callbacks.onClearObstacles();
                this.obstacleSlider.value(0);
                notifyChange();
            }
        });
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            foodRate: Number(this.foodRateSlider?.value()) || 0.5,
            foodValue: Number(this.foodValueSlider?.value()) || 30,
            foodSpawnInterval: Number(this.foodSpawnIntervalSlider?.value()) || 3,
            foodSpawnAmount: Number(this.foodSpawnAmountSlider?.value()) || 3,
            maxObstacles: Number(this.obstacleSlider?.value()) || 5
        };
    }
} 