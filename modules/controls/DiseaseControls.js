/**
 * Controles para o sistema de doenças
 */
// Verifica se a classe já foi definida antes de declarar
if (!window.DiseaseControls) {
    window.DiseaseControls = class DiseaseControls extends ControlsBase {
        /**
         * Inicializa os controles do sistema de doenças
         * @param {Object} config - Configuração inicial
         */
        constructor(config = {}) {
            super('Doenças', config);
            
            this.state = {
                // Propriedades padrão
                enableDiseases: true,
                randomDiseaseChance: 0.0005,
                maxDiseases: 5,
                infectionRange: 50,
                showDiseaseEffects: true,
                diseaseDuration: 3000,
                ...config
            };
        }

        /**
         * Configura os controles para o sistema de doenças
         */
        setupControls() {
            // Contêiner principal
            this.controlsDiv = createDiv();
            this.controlsDiv.class('controls-panel');
            this.controlsDiv.id('disease-controls');
            this.controlsDiv.parent('controls-container');

            // Título
            const titleDiv = createDiv('Controle de Doenças');
            titleDiv.class('controls-title');
            titleDiv.parent(this.controlsDiv);

            // Toggle para ativar/desativar doenças
            this.createToggle(
                'Ativar Doenças',
                this.state.enableDiseases,
                (value) => {
                    this.setState({ enableDiseases: value });
                    if (window.simulation && window.simulation.diseaseSystem) {
                        // Se desativado, remove todas as doenças ativas
                        if (!value) {
                            window.simulation.diseaseSystem.diseases = [];
                        }
                    }
                }
            );
            
            // Controle da chance de surgimento de doenças aleatórias
            this.createSlider(
                'Chance de Surgimento',
                this.state.randomDiseaseChance,
                0,
                0.001,
                0.0001,
                (value) => {
                    this.setState({ randomDiseaseChance: value });
                    if (window.simulation && window.simulation.diseaseSystem) {
                        window.simulation.diseaseSystem.randomDiseaseChance = value;
                    }
                }
            );
            
            // Número máximo de doenças simultâneas
            this.createSlider(
                'Máximo de Doenças',
                this.state.maxDiseases,
                1,
                10,
                1,
                (value) => {
                    this.setState({ maxDiseases: value });
                    if (window.simulation && window.simulation.diseaseSystem) {
                        window.simulation.diseaseSystem.maxDiseases = value;
                    }
                }
            );
            
            // Raio de infecção
            this.createSlider(
                'Raio de Infecção',
                this.state.infectionRange,
                20,
                100,
                5,
                (value) => {
                    this.setState({ infectionRange: value });
                    if (window.simulation && window.simulation.diseaseSystem) {
                        window.simulation.diseaseSystem.infectionRange = value;
                    }
                }
            );
            
            // Duração padrão das doenças
            this.createSlider(
                'Duração (frames)',
                this.state.diseaseDuration,
                500,
                10000,
                500,
                (value) => {
                    this.setState({ diseaseDuration: value });
                }
            );
            
            // Toggle para mostrar efeitos visuais das doenças
            this.createToggle(
                'Efeitos Visuais',
                this.state.showDiseaseEffects,
                (value) => {
                    this.setState({ showDiseaseEffects: value });
                    if (window.simulation) {
                        window.simulation.showDiseaseEffects = value;
                    }
                }
            );
            
            // Botão para criar doença manualmente
            const createDiseaseButton = createButton('Criar Nova Doença');
            createDiseaseButton.class('control-button');
            createDiseaseButton.parent(this.controlsDiv);
            createDiseaseButton.mousePressed(() => {
                if (window.simulation && window.simulation.diseaseSystem) {
                    window.simulation.diseaseSystem.createRandomDisease();
                }
            });
            
            // Botão para eliminar todas as doenças
            const clearDiseasesButton = createButton('Eliminar Doenças');
            clearDiseasesButton.class('control-button');
            clearDiseasesButton.parent(this.controlsDiv);
            clearDiseasesButton.mousePressed(() => {
                if (window.simulation && window.simulation.diseaseSystem) {
                    window.simulation.diseaseSystem.diseases = [];
                }
            });
            
            // Estatísticas de doenças
            this.statsDiv = createDiv();
            this.statsDiv.class('disease-stats');
            this.statsDiv.parent(this.controlsDiv);
            this.statsDiv.html('Estatísticas das Doenças:<br>Carregando...');
            
            // Atualiza estatísticas periodicamente
            setInterval(() => {
                this.updateStats();
            }, 1000);
        }
        
        /**
         * Atualiza as estatísticas exibidas
         */
        updateStats() {
            if (!window.simulation || !window.simulation.diseaseSystem) return;
            
            const stats = window.simulation.diseaseSystem.getStatistics();
            let statsHtml = 'Estatísticas das Doenças:<br>';
            statsHtml += `Doenças ativas: ${stats.activeDiseases}<br>`;
            statsHtml += `Total de infectados: ${stats.totalInfected}<br>`;
            statsHtml += `Taxa de infecção: ${(stats.infectionRate * 100).toFixed(1)}%<br>`;
            
            if (stats.diseaseNames.length > 0) {
                statsHtml += '<br>Doenças:<br>';
                for (const disease of stats.diseaseNames) {
                    statsHtml += `- ${disease.name}: ${disease.infected} infectados, ${disease.immune} imunes<br>`;
                }
            }
            
            this.statsDiv.html(statsHtml);
        }
        
        /**
         * Método para criar um controle de slider
         */
        createSlider(label, defaultValue, min, max, step, callback) {
            const controlDiv = createDiv();
            controlDiv.class('control-item');
            controlDiv.parent(this.controlsDiv);
            
            const labelElement = createElement('label', label);
            labelElement.parent(controlDiv);
            
            const slider = createSlider(min, max, defaultValue, step);
            slider.class('control-slider');
            slider.parent(controlDiv);
            
            const valueDisplay = createSpan(defaultValue);
            valueDisplay.class('slider-value');
            valueDisplay.parent(controlDiv);
            
            slider.input(() => {
                const value = slider.value();
                valueDisplay.html(Number(value).toFixed(step < 1 ? 4 : 0));
                callback(value);
            });
        }
        
        /**
         * Método para criar um controle de toggle (checkbox)
         */
        createToggle(label, defaultValue, callback) {
            const controlDiv = createDiv();
            controlDiv.class('control-item');
            controlDiv.parent(this.controlsDiv);
            
            const checkboxId = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
            
            const labelElement = createElement('label', label);
            labelElement.attribute('for', checkboxId);
            labelElement.parent(controlDiv);
            
            const checkbox = createCheckbox('', defaultValue);
            checkbox.id(checkboxId);
            checkbox.class('control-toggle');
            checkbox.parent(controlDiv);
            
            checkbox.changed(() => {
                callback(checkbox.checked());
            });
        }

        /**
         * Configura os event listeners
         * @param {Object} callbacks - Objeto com os callbacks da aplicação
         */
        setupEventListeners(callbacks) {
            if (!callbacks) return;
            
            console.log("Configurando event listeners para DiseaseControls");
            
            // Botões já têm event listeners configurados no setupControls
            // Este método é mantido para compatibilidade com a interface de outros controles
        }

        /**
         * Retorna o estado atual dos controles
         * @returns {Object} Estado atual
         */
        getState() {
            return { ...this.state };
        }
    }
} 