/**
 * Sistema de controles para os predadores
 */
class PredatorControls {
    /**
     * Inicializa os controles dos predadores
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        this.container = container;
        this.initialized = false;
        this.elements = {};
        this.initialize();
    }

    /**
     * Inicializa os controles
     */
    initialize() {
        if (this.initialized) return;
        
        // Cria seção para os predadores dentro do container principal
        const section = createDiv();
        section.parent(this.container);
        section.class('control-section predator-controls-section');
        section.style('margin-top', '20px');
        section.style('padding-top', '15px');
        section.style('border-top', '1px solid rgba(100,120,150,0.3)');
        
        // Adiciona título da seção como h3 (subtítulo)
        const title = createElement('h3', 'Controles dos Predadores');
        title.parent(section);
        title.style('color', '#FF9E80'); // Cor mais alaranjada para predadores
        
        // Checkbox para habilitar reprodução
        this.elements.predatorReproductionCheck = createCheckbox('Permitir Reprodução', true);
        this.elements.predatorReproductionCheck.parent(section);
        this.elements.predatorReproductionCheck.class('predator-control');
        
        // Slider para custo de reprodução
        const reproductionCostDiv = createDiv();
        reproductionCostDiv.class('slider-container');
        reproductionCostDiv.parent(section);
        
        const reproductionCostLabel = createDiv('Custo de Reprodução:');
        reproductionCostLabel.parent(reproductionCostDiv);
        reproductionCostLabel.class('slider-label');
        
        this.elements.predatorReproductionCostSlider = createSlider(10, 80, 40, 1);
        this.elements.predatorReproductionCostSlider.parent(reproductionCostDiv);
        this.elements.predatorReproductionCostSlider.class('predator-slider');
        
        this.elements.predatorReproductionCostValue = createDiv('40.0');
        this.elements.predatorReproductionCostValue.parent(reproductionCostDiv);
        this.elements.predatorReproductionCostValue.class('slider-value');
        
        // Slider para cooldown de reprodução
        const reproductionCooldownDiv = createDiv();
        reproductionCooldownDiv.class('slider-container');
        reproductionCooldownDiv.parent(section);
        
        const reproductionCooldownLabel = createDiv('Cooldown (s):');
        reproductionCooldownLabel.parent(reproductionCooldownDiv);
        reproductionCooldownLabel.class('slider-label');
        
        this.elements.predatorReproductionCooldownSlider = createSlider(1, 30, 10, 1);
        this.elements.predatorReproductionCooldownSlider.parent(reproductionCooldownDiv);
        this.elements.predatorReproductionCooldownSlider.class('predator-slider');
        
        this.elements.predatorReproductionCooldownValue = createDiv('10.0');
        this.elements.predatorReproductionCooldownValue.parent(reproductionCooldownDiv);
        this.elements.predatorReproductionCooldownValue.class('slider-value');
        
        // Slider para energia mínima
        const minEnergyDiv = createDiv();
        minEnergyDiv.class('slider-container');
        minEnergyDiv.parent(section);
        
        const minEnergyLabel = createDiv('Energia Mínima:');
        minEnergyLabel.parent(minEnergyDiv);
        minEnergyLabel.class('slider-label');
        
        this.elements.predatorMinEnergySlider = createSlider(20, 80, 50, 1);
        this.elements.predatorMinEnergySlider.parent(minEnergyDiv);
        this.elements.predatorMinEnergySlider.class('predator-slider');
        
        this.elements.predatorMinEnergyValue = createDiv('50.0');
        this.elements.predatorMinEnergyValue.parent(minEnergyDiv);
        this.elements.predatorMinEnergyValue.class('slider-value');
        
        // Slider para raio de alcance de reprodução
        const reproductionRangeDiv = createDiv();
        reproductionRangeDiv.class('slider-container');
        reproductionRangeDiv.parent(section);
        
        const reproductionRangeLabel = createDiv('Alcance:');
        reproductionRangeLabel.parent(reproductionRangeDiv);
        reproductionRangeLabel.class('slider-label');
        
        this.elements.predatorReproductionRangeSlider = createSlider(20, 100, 50, 1);
        this.elements.predatorReproductionRangeSlider.parent(reproductionRangeDiv);
        this.elements.predatorReproductionRangeSlider.class('predator-slider');
        
        this.elements.predatorReproductionRangeValue = createDiv('50.0');
        this.elements.predatorReproductionRangeValue.parent(reproductionRangeDiv);
        this.elements.predatorReproductionRangeValue.class('slider-value');
        
        // Slider para taxa de mutação
        const mutationRateDiv = createDiv();
        mutationRateDiv.class('slider-container');
        mutationRateDiv.parent(section);
        
        const mutationRateLabel = createDiv('Taxa de Mutação:');
        mutationRateLabel.parent(mutationRateDiv);
        mutationRateLabel.class('slider-label');
        
        this.elements.predatorMutationRateSlider = createSlider(0, 0.2, 0.05, 0.01);
        this.elements.predatorMutationRateSlider.parent(mutationRateDiv);
        this.elements.predatorMutationRateSlider.class('predator-slider');
        
        this.elements.predatorMutationRateValue = createDiv('0.05');
        this.elements.predatorMutationRateValue.parent(mutationRateDiv);
        this.elements.predatorMutationRateValue.class('slider-value');
        
        // Slider para limite de predadores
        const predatorLimitDiv = createDiv();
        predatorLimitDiv.class('slider-container');
        predatorLimitDiv.parent(section);
        
        const predatorLimitLabel = createDiv('Limite de Predadores:');
        predatorLimitLabel.parent(predatorLimitDiv);
        predatorLimitLabel.class('slider-label');
        
        this.elements.predatorLimitSlider = createSlider(0, 10, 2, 1);
        this.elements.predatorLimitSlider.parent(predatorLimitDiv);
        this.elements.predatorLimitSlider.class('predator-slider');
        
        this.elements.predatorLimitValue = createDiv('2');
        this.elements.predatorLimitValue.parent(predatorLimitDiv);
        this.elements.predatorLimitValue.class('slider-value');
        
        // Aplica estilos CSS
        this.applyStyles();
        
        this.initialized = true;
    }
    
    /**
     * Aplica estilos aos elementos
     */
    applyStyles() {
        // Estilos para contêineres de sliders
        selectAll('.slider-container', this.container).forEach(el => {
            el.style('margin-bottom', '12px');
            el.style('width', '100%');
        });
        
        // Estilos para labels de sliders
        selectAll('.slider-label', this.container).forEach(el => {
            el.style('font-size', '12px');
            el.style('margin-bottom', '3px');
            el.style('color', '#d0d0d0');
        });
        
        // Estilos para valores de sliders
        selectAll('.slider-value', this.container).forEach(el => {
            el.style('font-size', '11px');
            el.style('text-align', 'right');
            el.style('min-width', '40px');
            el.style('margin-left', 'auto');
            el.style('color', '#a0a0a0');
            el.style('background', 'rgba(30, 30, 40, 0.5)');
            el.style('padding', '2px 6px');
            el.style('border-radius', '3px');
        });
        
        // Estilos para os sliders
        selectAll('.predator-slider', this.container).forEach(slider => {
            slider.style('width', '100%');
            slider.style('height', '8px');
            slider.style('outline', 'none');
            slider.style('border-radius', '4px');
            slider.style('background', '#1a2a3a');
            slider.style('appearance', 'none');
            slider.style('-webkit-appearance', 'none');
            slider.style('margin', '6px 0');
        });
    }

    /**
     * Configura os event listeners
     * @param {Object} callbacks - Callbacks para os eventos
     */
    setupEventListeners(callbacks) {
        if (!this.initialized) return;
        
        // Callback para notificar mudanças
        const notifyChange = () => {
            if (callbacks && callbacks.onChange) {
                callbacks.onChange(this.getState());
            }
        };
        
        // Configura listeners para cada controle
        this.elements.predatorReproductionCheck.changed(() => {
            notifyChange();
        });
        
        this.elements.predatorReproductionCostSlider.input(() => {
            const value = this.elements.predatorReproductionCostSlider.value();
            this.elements.predatorReproductionCostValue.html(value);
            notifyChange();
        });
        
        this.elements.predatorReproductionCooldownSlider.input(() => {
            const value = this.elements.predatorReproductionCooldownSlider.value();
            this.elements.predatorReproductionCooldownValue.html(value);
            notifyChange();
        });
        
        this.elements.predatorMinEnergySlider.input(() => {
            const value = this.elements.predatorMinEnergySlider.value();
            this.elements.predatorMinEnergyValue.html(value);
            notifyChange();
        });
        
        this.elements.predatorReproductionRangeSlider.input(() => {
            const value = this.elements.predatorReproductionRangeSlider.value();
            this.elements.predatorReproductionRangeValue.html(value);
            notifyChange();
        });
        
        this.elements.predatorMutationRateSlider.input(() => {
            const value = this.elements.predatorMutationRateSlider.value();
            this.elements.predatorMutationRateValue.html(value.toFixed(2));
            notifyChange();
        });
        
        this.elements.predatorLimitSlider.input(() => {
            const value = this.elements.predatorLimitSlider.value();
            this.elements.predatorLimitValue.html(value);
            notifyChange();
        });
    }

    /**
     * Retorna o estado atual dos controles
     * @returns {Object} Estado atual dos controles
     */
    getState() {
        if (!this.initialized) return {};
        
        return {
            predatorReproductionEnabled: this.elements.predatorReproductionCheck.checked(),
            predatorReproductionCost: parseFloat(this.elements.predatorReproductionCostSlider.value()),
            predatorReproductionCooldown: parseFloat(this.elements.predatorReproductionCooldownSlider.value()),
            predatorMinEnergy: parseFloat(this.elements.predatorMinEnergySlider.value()),
            predatorReproductionRange: parseFloat(this.elements.predatorReproductionRangeSlider.value()),
            predatorMutationRate: parseFloat(this.elements.predatorMutationRateSlider.value()),
            predatorLimit: parseInt(this.elements.predatorLimitSlider.value())
        };
    }
}

// Adiciona ao escopo global
window.PredatorControls = PredatorControls; 