/**
 * Sistema de controles para visualização
 */
// Muda a declaração para verificar se a classe já está definida
if (!window.VisualizationControls) {
    window.VisualizationControls = class VisualizationControls {
        /**
         * Cria os controles de visualização
         * @param {HTMLElement} container - Container dos controles
         */
        constructor(container) {
            this.container = container;
            this.elements = {};
            this.initialized = false;
            this.callbacks = {};
            
            // Inicializa os controles imediatamente
            this.initialize();
        }

        /**
         * Inicializa os controles
         */
        initialize() {
            if (this.initialized) return;

            // Cria o container para esta seção
            const section = createDiv();
            section.parent(this.container);
            section.class('control-section');
            
            const heading = createElement('h3', 'Visualização');
            heading.parent(section);

            // Controle de visualização de energia
            this.elements.showEnergyCheck = createCheckbox('Mostrar Energia', true);
            this.elements.showEnergyCheck.parent(section);
            this.elements.showEnergyCheck.changed(() => {
                if (this.callbacks.onEnergyToggle) {
                    this.callbacks.onEnergyToggle(this.elements.showEnergyCheck.checked());
                }
            });

            // Controle de visualização de gênero
            this.elements.showGenderCheck = createCheckbox('Mostrar Gênero', true);
            this.elements.showGenderCheck.parent(section);
            this.elements.showGenderCheck.changed(() => {
                if (this.callbacks.onGenderToggle) {
                    this.callbacks.onGenderToggle(this.elements.showGenderCheck.checked());
                }
            });
            
            // Controle de visualização de rastros
            this.elements.showTrailsCheck = createCheckbox('Mostrar Rastros', false);
            this.elements.showTrailsCheck.parent(section);
            this.elements.showTrailsCheck.changed(() => {
                if (this.callbacks.onTrailsToggle) {
                    this.callbacks.onTrailsToggle(this.elements.showTrailsCheck.checked());
                }
            });
            
            // Controle de visualização do grid espacial
            this.elements.showGridCheck = createCheckbox('Mostrar Grid Espacial', false);
            this.elements.showGridCheck.parent(section);
            this.elements.showGridCheck.changed(() => {
                if (this.callbacks.onGridToggle) {
                    this.callbacks.onGridToggle(this.elements.showGridCheck.checked());
                }
            });
            
            // Título para controles de gráficos
            const graphsHeading = createElement('h4', 'Gráficos');
            graphsHeading.parent(section);
            
            // Controles para gráficos
            const graphTypes = [
                { id: 'population', label: 'População' },
                { id: 'predators', label: 'Predadores' },
                { id: 'food', label: 'Comida' },
                { id: 'avgHealth', label: 'Saúde Média' },
                { id: 'generation', label: 'Geração' }
            ];
            
            for (const graph of graphTypes) {
                this.elements[`show${graph.id}Graph`] = createCheckbox(graph.label, true);
                this.elements[`show${graph.id}Graph`].parent(section);
                this.elements[`show${graph.id}Graph`].changed(() => {
                    if (this.callbacks.onGraphToggle) {
                        this.callbacks.onGraphToggle(
                            graph.id, 
                            this.elements[`show${graph.id}Graph`].checked()
                        );
                    }
                });
            }

            this.initialized = true;
        }

        /**
         * Configura os event listeners
         * @param {Object} callbacks - Objeto com callbacks
         */
        setupEventListeners(callbacks) {
            this.callbacks = { ...this.callbacks, ...callbacks };
            
            // Notifica sobre mudanças no estado
            const notifyChange = () => {
                if (this.callbacks.onChange) {
                    this.callbacks.onChange(this.getState());
                }
            };
            
            // Configura os listeners para cada elemento
            if (this.elements.showEnergyCheck) {
                this.elements.showEnergyCheck.changed(notifyChange);
            }
            
            if (this.elements.showGenderCheck) {
                this.elements.showGenderCheck.changed(notifyChange);
            }
            
            if (this.elements.showTrailsCheck) {
                this.elements.showTrailsCheck.changed(notifyChange);
            }
            
            if (this.elements.showGridCheck) {
                this.elements.showGridCheck.changed(notifyChange);
            }
            
            // Configura listeners para os controles de gráficos
            const graphTypes = ['population', 'predators', 'food', 'avgHealth', 'generation'];
            for (const type of graphTypes) {
                const control = this.elements[`show${type}Graph`];
                if (control) {
                    control.changed(notifyChange);
                }
            }
        }
        
        /**
         * Método stub para compatibilidade
         */
        styleAllSliders() {
            // Método vazio para compatibilidade
            console.log("styleAllSliders chamado - método stub");
        }

        /**
         * Define callbacks para eventos
         * @param {Object} callbacks - Objeto com callbacks
         */
        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }

        /**
         * Retorna o estado atual dos controles
         * @returns {Object} - Estado atual
         */
        getState() {
            if (!this.initialized) return {};

            return {
                showEnergy: this.elements.showEnergyCheck.checked(),
                showGender: this.elements.showGenderCheck.checked(),
                showTrails: this.elements.showTrailsCheck.checked(),
                showGrid: this.elements.showGridCheck.checked(),
                graphs: {
                    population: this.elements.showpopulationGraph.checked(),
                    predators: this.elements.showpredatorsGraph.checked(),
                    food: this.elements.showfoodGraph.checked(),
                    avgHealth: this.elements.showavgHealthGraph.checked(),
                    generation: this.elements.showgenerationGraph.checked()
                }
            };
        }

        /**
         * Atualiza controles com base no estado
         * @param {Object} state - Novo estado
         */
        setState(state) {
            if (!this.initialized) return;

            if (state.showEnergy !== undefined) 
                this.elements.showEnergyCheck.checked(state.showEnergy);
                
            if (state.showGender !== undefined) 
                this.elements.showGenderCheck.checked(state.showGender);
                
            if (state.showTrails !== undefined) 
                this.elements.showTrailsCheck.checked(state.showTrails);
                
            if (state.showGrid !== undefined) 
                this.elements.showGridCheck.checked(state.showGrid);
                
            if (state.graphs) {
                if (state.graphs.population !== undefined)
                    this.elements.showpopulationGraph.checked(state.graphs.population);
                    
                if (state.graphs.predators !== undefined)
                    this.elements.showpredatorsGraph.checked(state.graphs.predators);
                    
                if (state.graphs.food !== undefined)
                    this.elements.showfoodGraph.checked(state.graphs.food);
                    
                if (state.graphs.avgHealth !== undefined)
                    this.elements.showavgHealthGraph.checked(state.graphs.avgHealth);
                    
                if (state.graphs.generation !== undefined)
                    this.elements.showgenerationGraph.checked(state.graphs.generation);
            }
        }
    };
}
// Não adicionar novamente ao escopo global, pois já deve estar definido 