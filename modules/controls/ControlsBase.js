/**
 * Classe base para controles da simulação
 */
window.ControlsBase = class ControlsBase {
    /**
     * Inicializa a classe base de controles
     */
    constructor() {
        this.initialized = false;
        this.callbacks = {};
    }

    /**
     * Cria uma seção de controles
     * @param {p5.Element} container - Container p5.js para a seção
     * @param {string} title - Título da seção
     * @returns {p5.Element} - Elemento p5.js da seção criada
     */
    createSection(container, title) {
        if (!container || !container.elt) {
            console.error('Container inválido fornecido para createSection');
            return null;
        }

        try {
            const div = createDiv();
            div.style('margin-bottom', '20px');
            
            const titleEl = createElement('h3', title);
            titleEl.style('margin', '0 0 20px 0');
            titleEl.style('font-size', '18px');
            titleEl.style('color', '#2c3e50');
            titleEl.style('font-weight', 'bold');
            titleEl.style('border-bottom', '2px solid #4CAF50');
            titleEl.style('padding-bottom', '10px');
            div.child(titleEl);
            
            container.child(div);
            return div;
        } catch (error) {
            console.error('Erro ao criar seção:', error);
            return null;
        }
    }

    /**
     * Adiciona uma linha de controle com label
     * @param {p5.Element} parent - Elemento pai p5.js
     * @param {string} label - Label do controle
     * @param {p5.Element} control - Elemento de controle p5.js
     * @returns {p5.Element} - Elemento p5.js da linha criada
     */
    addControlRow(parent, label, control) {
        if (!parent || !parent.elt || !control || !control.elt) {
            console.error('Parâmetros inválidos fornecidos para addControlRow');
            return null;
        }

        try {
            const row = createDiv();
            row.class('control-row');
            row.style('display', 'flex');
            row.style('align-items', 'center');
            row.style('margin-bottom', '12px');
            row.style('padding', '8px 12px');
            row.style('background-color', '#ffffff');
            row.style('border-radius', '6px');
            row.style('border', '1px solid #e9ecef');
            row.style('box-shadow', '0 1px 2px rgba(0,0,0,0.05)');

            // Label
            const labelEl = createDiv(label);
            labelEl.style('width', '140px');
            labelEl.style('margin-right', '15px');
            labelEl.style('font-size', '14px');
            labelEl.style('color', '#495057');
            labelEl.style('font-weight', '500');
            row.child(labelEl);

            // Control wrapper
            const controlWrapper = createDiv();
            controlWrapper.class('control-wrapper');
            controlWrapper.style('flex', '1');
            controlWrapper.style('min-width', '120px');
            controlWrapper.style('position', 'relative');
            
            // Ajusta o estilo do controle
            if (control.elt.type === 'range') {
                this.styleSlider(control);
            }
            
            controlWrapper.child(control);
            row.child(controlWrapper);

            // Valor atual
            const valueDisplay = createDiv('0');
            valueDisplay.class('value-display');
            valueDisplay.style('width', '50px');
            valueDisplay.style('margin-left', '15px');
            valueDisplay.style('text-align', 'right');
            valueDisplay.style('font-family', 'monospace');
            valueDisplay.style('font-size', '14px');
            valueDisplay.style('color', '#495057');
            valueDisplay.style('background', '#e9ecef');
            valueDisplay.style('padding', '4px 8px');
            valueDisplay.style('border-radius', '4px');
            valueDisplay.style('font-weight', '500');
            row.child(valueDisplay);

            // Atualiza o valor e o gradiente
            const updateControl = () => {
                const value = control.value();
                const formattedValue = typeof value === 'number' ? 
                    (value >= 0.01 && value < 100 ? value.toFixed(2) : value.toFixed(0)) : 
                    value;
                valueDisplay.html(formattedValue);

                if (control.elt.type === 'range') {
                    this.updateSliderGradient(control);
                }
            };

            // Adiciona listeners
            if (control.elt.type === 'range') {
                control.input(updateControl);
                control.changed(updateControl);
                updateControl();
            }

            parent.child(row);
            return row;
        } catch (error) {
            console.error('Erro ao criar linha de controle:', error);
            return null;
        }
    }

    /**
     * Estiliza um slider
     */
    styleSlider(slider) {
        if (!slider || !slider.elt) return;

        slider.style('width', '100%');
        slider.style('-webkit-appearance', 'none');
        slider.style('appearance', 'none');
        slider.style('height', '6px');
        slider.style('background', '#e9ecef');
        slider.style('border-radius', '3px');
        slider.style('outline', 'none');
        slider.style('cursor', 'pointer');
        slider.style('margin', '0');
        slider.style('padding', '0');
        
        // Estilo do thumb
        const thumbStyle = `
            -webkit-appearance: none !important;
            width: 16px !important;
            height: 16px !important;
            background: #4CAF50 !important;
            border-radius: 50% !important;
            margin-top: -5px !important;
            cursor: pointer !important;
            border: 0 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            transition: all 0.2s ease !important;
        `;
        
        slider.style('::-webkit-slider-thumb', thumbStyle);
        slider.style('::-moz-range-thumb', thumbStyle);
        slider.style('::-ms-thumb', thumbStyle);

        // Hover effect
        slider.style('::-webkit-slider-thumb:hover', 'background: #45a049 !important; transform: scale(1.1) !important;');
        slider.style('::-moz-range-thumb:hover', 'background: #45a049 !important; transform: scale(1.1) !important;');
        slider.style('::-ms-thumb:hover', 'background: #45a049 !important; transform: scale(1.1) !important;');
    }

    /**
     * Atualiza o gradiente do slider
     */
    updateSliderGradient(slider) {
        if (!slider || !slider.elt) return;

        const value = slider.value();
        const min = parseFloat(slider.elt.min) || 0;
        const max = parseFloat(slider.elt.max) || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        slider.style('background', `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${percentage}%, #e9ecef ${percentage}%, #e9ecef 100%)`);
    }

    /**
     * Atualiza o display de valor do slider
     */
    updateValueDisplay(slider) {
        if (!slider || !slider.elt || !slider.elt.parentElement) return;
        
        const row = slider.elt.parentElement.closest('.control-row');
        if (!row) return;
        
        const valueDisplay = row.getElementsByClassName('value-display')[0];
        if (valueDisplay) {
            const value = slider.value();
            const formattedValue = typeof value === 'number' ? 
                (value >= 0.01 && value < 100 ? value.toFixed(2) : value.toFixed(0)) : 
                value;
            valueDisplay.innerHTML = formattedValue;
            this.updateSliderGradient(slider);
        }
    }

    /**
     * Estiliza todos os sliders
     */
    styleAllSliders() {
        if (!this.container || !this.container.elt) return;

        try {
            // Encontra todos os sliders no container
            const inputs = this.container.elt.getElementsByTagName('input');
            if (!inputs) return;

            const sliders = Array.from(inputs)
                .filter(input => input.type === 'range')
                .map(input => input._pInst); // Obtém a instância p5.js do elemento

            // Aplica o estilo em cada slider
            sliders.forEach(slider => {
                if (slider) {
                    this.styleSlider(slider);
                    this.updateValueDisplay(slider);
                }
            });
        } catch (error) {
            console.warn('Erro ao estilizar sliders:', error);
        }
    }
}; 