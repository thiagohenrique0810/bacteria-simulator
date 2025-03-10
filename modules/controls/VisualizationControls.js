/**
 * Controles de visualização da simulação
 */
window.VisualizationControls = class VisualizationControls extends ControlsBase {
    /**
     * Inicializa os controles de visualização
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles de visualização
     */
    setupControls() {
        const visDiv = this.createSection(this.container, 'Visualização');

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
     * Configura os event listeners
     */
    setupEventListeners(callbacks) {
        // Função auxiliar para notificar mudanças
        const notifyChange = () => {
            if (callbacks.onChange) {
                callbacks.onChange(this.getState());
            }
        };

        // Eventos de visualização
        this.showTrailsCheckbox.changed(() => {
            if (callbacks.onToggleTrails) {
                callbacks.onToggleTrails(this.showTrailsCheckbox.checked());
            }
            notifyChange();
        });

        this.showEnergyCheckbox.changed(() => {
            if (callbacks.onToggleEnergy) {
                callbacks.onToggleEnergy(this.showEnergyCheckbox.checked());
            }
            notifyChange();
        });

        this.showGenderCheckbox.changed(() => {
            if (callbacks.onToggleGender) {
                callbacks.onToggleGender(this.showGenderCheckbox.checked());
            }
            notifyChange();
        });

        this.statsCheckbox.changed(() => {
            if (callbacks.onToggleStats) {
                callbacks.onToggleStats(this.statsCheckbox.checked());
            }
            notifyChange();
        });

        this.debugCheckbox.changed(() => {
            if (callbacks.onToggleDebug) {
                callbacks.onToggleDebug(this.debugCheckbox.checked());
            }
            notifyChange();
        });

        this.zoomSlider.input(() => {
            notifyChange();
        });

        // Força uma atualização inicial
        notifyChange();
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            showStats: this.statsCheckbox?.checked() || true,
            debugMode: this.debugCheckbox?.checked() || false,
            showTrails: this.showTrailsCheckbox?.checked() || false,
            showEnergy: this.showEnergyCheckbox?.checked() || true,
            showGender: this.showGenderCheckbox?.checked() || true,
            zoom: Number(this.zoomSlider?.value()) || 1
        };
    }
} 