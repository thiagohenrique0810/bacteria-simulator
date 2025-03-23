/**
 * Classe responsável pela visualização da bactéria
 */
class BacteriaVisualizationComponent {
    /**
     * Inicializa o módulo de visualização
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        this.size = bacteria.size;
        this.isFemale = bacteria.isFemale;
        this.baseColor = this.isFemale ? color(255, 182, 193) : color(173, 216, 230);
        this.currentColor = this.baseColor;
        this.transparency = 255;
        this.isCourting = false;
        this.courtingEffect = 0;
    }

    /**
     * Desenha a bactéria
     */
    draw() {
        push();
        
        // Tamanho baseado no DNA
        const size = this.size * (0.7 + this.bacteria.dna.genes.size * 0.6);
        
        // Cor base baseada no gênero, DNA e estado
        let baseColor;
        
        if (this.isFemale) {
            baseColor = color(255, 150, 200); // Rosa para fêmeas
        } else {
            baseColor = color(150, 200, 255); // Azul para machos
        }
        
        // Ajusta cor com base no DNA
        const r = baseColor.levels[0] * (0.7 + this.bacteria.dna.genes.colorR * 0.3);
        const g = baseColor.levels[1] * (0.7 + this.bacteria.dna.genes.colorG * 0.3);
        const b = baseColor.levels[2] * (0.7 + this.bacteria.dna.genes.colorB * 0.3);
        
        // Cor final
        const finalColor = color(r, g, b);
        
        // Transparência baseada na saúde
        const alpha = map(this.bacteria.health, 0, 100, 100, 255);
        finalColor.setAlpha(alpha);
        
        // Desenha corpo base da bactéria
        fill(finalColor);
        noStroke();
        
        // Corpo da bactéria
        ellipse(this.bacteria.pos.x, this.bacteria.pos.y, size, size);
        
        // Indicador de infecção (se presente)
        if (this.bacteria.isInfected) {
            // Desenha símbolo de alerta
            strokeWeight(1.5);
            stroke(255, 50, 50);
            noFill();
            drawingContext.setLineDash([2, 2]);
            ellipse(this.bacteria.pos.x, this.bacteria.pos.y, size * 1.5, size * 1.5);
            drawingContext.setLineDash([]);
            
            // Pequeno símbolo de doença
            fill(255, 50, 50);
            noStroke();
            const symbolSize = size * 0.2;
            ellipse(this.bacteria.pos.x, this.bacteria.pos.y - (size * 0.5), symbolSize, symbolSize);
        }
        
        // Desenha indicador de estado
        const stateColor = this.getStateColor();
        fill(stateColor);
        noStroke();
        ellipse(this.bacteria.pos.x, this.bacteria.pos.y, size * 0.5, size * 0.5);
        
        // Indicador de energia (se habilitado)
        if (window.simulation && window.simulation.showEnergy) {
            const energyWidth = size * 1.2;
            const energyHeight = 3;
            const energyY = this.bacteria.pos.y + (size / 2) + 5;
            
            // Fundo da barra
            fill(50, 50, 50, 150);
            rect(this.bacteria.pos.x - energyWidth/2, energyY, energyWidth, energyHeight);
            
            // Barra de energia
            const energyLevel = map(this.bacteria.energy, 0, 100, 0, energyWidth);
            fill(50, 200, 50, 200);
            rect(this.bacteria.pos.x - energyWidth/2, energyY, energyLevel, energyHeight);
        }
        
        pop();
    }

    /**
     * Retorna a cor associada ao estado atual
     * @returns {p5.Color} Cor do estado
     */
    getStateColor() {
        if (!this.bacteria.states) {
            return color(150, 150, 150);
        }
        
        switch (this.bacteria.states.getCurrentState()) {
            case window.BacteriaStates.EXPLORING:
                return color(50, 200, 50);
            case window.BacteriaStates.SEARCHING_FOOD:
                return color(200, 150, 50);
            case window.BacteriaStates.SEARCHING_MATE:
                return color(200, 50, 200);
            case window.BacteriaStates.FLEEING:
                return color(200, 0, 0);
            case window.BacteriaStates.RESTING:
                return color(50, 50, 200);
            default:
                return color(150, 150, 150);
        }
    }

    /**
     * Atualiza a visualização com as informações atuais da bactéria
     * @param {Object} params - Parâmetros de atualização
     */
    update(params = {}) {
        // Ajusta transparência baseada na saúde
        this.transparency = map(this.bacteria.health, 0, 100, 100, 255);

        // Atualiza estado de cortejo
        if (params.isCourting) {
            this.isCourting = params.isCourting;
            this.courtingEffect = (this.courtingEffect + 0.1) % TWO_PI;
        } else {
            this.isCourting = false;
            this.courtingEffect = 0;
        }
    }
}

// Exporta a classe para uso global
window.BacteriaVisualizationComponent = BacteriaVisualizationComponent; 