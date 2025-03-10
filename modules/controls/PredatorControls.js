/**
 * Controles específicos para os predadores
 */
window.PredatorControls = class PredatorControls extends window.ControlsBase {
    /**
     * Inicializa os controles dos predadores
     * @param {p5.Element} container - Container p5.js para os controles
     */
    constructor(container) {
        super();
        
        if (!container || !container.elt) {
            console.error('Container inválido fornecido para PredatorControls');
            return;
        }
        
        this.container = container;
        
        // Aguarda o p5.js estar pronto
        if (typeof createDiv === 'function') {
            this.setupControls();
        } else {
            console.warn('p5.js não está pronto ainda. Os controles serão inicializados posteriormente.');
            window.addEventListener('load', () => {
                this.setupControls();
            });
        }
    }

    /**
     * Configura os controles dos predadores
     */
    setupControls() {
        if (!this.container || !this.container.elt) {
            console.error('Container não definido ou inválido para PredatorControls');
            return;
        }

        try {
            // Título principal
            const title = createElement('h2', 'Controles dos Predadores');
            title.style('margin', '0 0 20px 0');
            title.style('font-size', '20px');
            title.style('color', '#2c3e50');
            title.style('font-weight', 'bold');
            title.style('border-bottom', '2px solid #dc3545');
            title.style('padding-bottom', '10px');
            this.container.child(title);

            // Container para os controles
            const predDiv = createDiv();
            predDiv.style('width', '100%');
            predDiv.style('margin-bottom', '20px');

            // Habilitar/Desabilitar reprodução
            this.enableReproductionCheckbox = createCheckbox('Permitir Reprodução', true);
            this.enableReproductionCheckbox.style('margin', '10px 0');
            this.enableReproductionCheckbox.style('display', 'block');
            this.enableReproductionCheckbox.style('color', '#495057');
            this.enableReproductionCheckbox.style('cursor', 'pointer');
            predDiv.child(this.enableReproductionCheckbox);

            // Custo de energia para reprodução
            this.reproductionCostSlider = createSlider(20, 60, 40, 5);
            this.reproductionCostSlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Custo de Reprodução:', this.reproductionCostSlider);

            // Tempo de cooldown da reprodução
            this.reproductionCooldownSlider = createSlider(5, 30, 10, 1);
            this.reproductionCooldownSlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Cooldown (s):', this.reproductionCooldownSlider);

            // Energia mínima para reprodução
            this.minEnergySlider = createSlider(50, 100, 80, 5);
            this.minEnergySlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Energia Mínima:', this.minEnergySlider);

            // Alcance de reprodução
            this.reproductionRangeSlider = createSlider(30, 100, 50, 5);
            this.reproductionRangeSlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Alcance:', this.reproductionRangeSlider);

            // Taxa de mutação
            this.mutationRateSlider = createSlider(0, 0.5, 0.1, 0.05);
            this.mutationRateSlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Taxa de Mutação:', this.mutationRateSlider);

            // Limite de predadores
            this.predatorLimitSlider = createSlider(2, 10, 5, 1);
            this.predatorLimitSlider.elt.type = 'range';
            this.addControlRow(predDiv, 'Limite de Predadores:', this.predatorLimitSlider);

            // Adiciona o container ao container principal
            this.container.child(predDiv);

            // Estiliza todos os sliders
            this.styleAllSliders();
        } catch (error) {
            console.error('Erro ao configurar controles dos predadores:', error);
        }
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

        // Eventos dos controles
        this.enableReproductionCheckbox.changed(notifyChange);
        this.reproductionCostSlider.input(notifyChange);
        this.reproductionCooldownSlider.input(notifyChange);
        this.minEnergySlider.input(notifyChange);
        this.reproductionRangeSlider.input(notifyChange);
        this.mutationRateSlider.input(notifyChange);
        this.predatorLimitSlider.input(notifyChange);
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            predatorReproductionEnabled: this.enableReproductionCheckbox?.checked() || true,
            predatorReproductionCost: Number(this.reproductionCostSlider?.value()) || 40,
            predatorReproductionCooldown: Number(this.reproductionCooldownSlider?.value()) * 60 || 600,
            predatorMinEnergy: Number(this.minEnergySlider?.value()) || 80,
            predatorReproductionRange: Number(this.reproductionRangeSlider?.value()) || 50,
            predatorMutationRate: Number(this.mutationRateSlider?.value()) || 0.1,
            predatorLimit: Number(this.predatorLimitSlider?.value()) || 5
        };
    }
}; 