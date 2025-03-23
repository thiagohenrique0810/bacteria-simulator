/**
 * Componente de visualização de bactéria
 * Responsável por desenhar a bactéria e mostrar informações visuais e de depuração
 */
class BacteriaVisualizationComponent {
    /**
     * Inicializa o componente de visualização
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        this.showDebugInfo = true; // Ativar informações de debug por padrão
        this.sizeMultiplier = 1.0; // Multiplicador de tamanho para efeitos visuais
        this.pulseValue = 0; // Valor para efeito de pulsação
        this.lastStateChange = 0; // Controla efeitos visuais de mudança de estado
        this.currentColor = color(255); // Cor atual da bactéria
        this.targetColor = color(255); // Cor alvo para efeitos de transição
    }
    
    /**
     * Atualiza o componente visual
     */
    update() {
        // Efeito de pulsação baseado no frameCount
        this.pulseValue = sin(frameCount * 0.1) * 0.15;
        
        // Recupera o gerenciador de estados se disponível
        const stateManager = this.bacteria.stateManager;
        
        // Atualiza o efeito de transição de cor
        if (stateManager && stateManager.lastStateChangeTime !== this.lastStateChange) {
            this.lastStateChange = stateManager.lastStateChangeTime || 0;
            this.sizeMultiplier = 1.2; // Efeito visual para mudança de estado
        }
        
        // Gradualmente normaliza o tamanho
        this.sizeMultiplier = lerp(this.sizeMultiplier, 1.0, 0.1);
    }
    
    /**
     * Desenha a bactéria
     */
    draw() {
        push(); // Salva o estado de transformação atual
        
        // Atualiza os efeitos visuais
        this.update();
        
        // Cores base baseadas no sexo
        const baseColor = this.bacteria.isFemale ? 
            color(255, 150, 200) : // Rosa para fêmeas
            color(150, 200, 255);  // Azul para machos
        
        // Calcula tamanho com efeitos visuais
        const size = this.bacteria.size * this.sizeMultiplier * (1 + this.pulseValue);
        
        // Ajustes de cor baseados no estado
        let currentColor = baseColor;
        
        // Ajuste de cor se estiver infectada
        if (this.bacteria.isInfected) {
            currentColor = color(200, 150, 0); // Tom amarelado para indicar infecção
        }
        
        // Ajustes baseados no estado atual (se o gerenciador de estados estiver disponível)
        if (this.bacteria.stateManager) {
            const state = this.bacteria.stateManager.currentState;
            
            // Cores específicas por estado
            switch (state) {
                case "resting":
                    // Adiciona um tom azulado para descanso
                    currentColor = lerpColor(currentColor, color(100, 150, 200), 0.3);
                    break;
                    
                case "fleeing":
                    // Vermelho para fuga
                    currentColor = lerpColor(currentColor, color(255, 0, 0), 0.7);
                    break;
                    
                case "seekingFood":
                    // Verde para busca de comida
                    currentColor = lerpColor(currentColor, color(0, 255, 100), 0.3);
                    break;
                    
                case "seekingMate":
                    // Roxo para busca de parceiro
                    currentColor = lerpColor(currentColor, color(200, 100, 255), 0.5);
                    break;
                    
                case "exploring":
                    // Apenas intensifica a cor original para exploração
                    currentColor = lerpColor(currentColor, color(255), 0.1);
                    break;
            }
            
            // Ajuste baseado na energia (mais transparente com menos energia)
            const energyRatio = this.bacteria.stateManager.currentEnergy / 100;
            const minAlpha = 100; // Alfa mínimo para não ficar completamente invisível
            const alpha = map(energyRatio, 0, 1, minAlpha, 255);
            currentColor.setAlpha(alpha);
        }
        
        // Desenha o corpo principal da bactéria
        noStroke();
        fill(currentColor);
        ellipse(this.bacteria.pos.x, this.bacteria.pos.y, size, size);
        
        // Adiciona sutil brilho/contorno
        const glowColor = color(currentColor);
        glowColor.setAlpha(80);
        fill(glowColor);
        ellipse(this.bacteria.pos.x, this.bacteria.pos.y, size * 1.2, size * 1.2);
        
        // Adiciona pequenos detalhes visuais
        fill(255, 255, 255, 100); // Brilho branco
        ellipse(
            this.bacteria.pos.x - size * 0.25, 
            this.bacteria.pos.y - size * 0.25, 
            size * 0.2, 
            size * 0.2
        );
        
        // Desenha informações de debug se ativado
        if (this.showDebugInfo) {
            this.drawDebugInfo();
        }
        
        pop(); // Restaura estado de transformação
    }
    
    /**
     * Desenha informações de debug da bactéria
     */
    drawDebugInfo() {
        const bacteria = this.bacteria;
        const x = bacteria.pos.x;
        const y = bacteria.pos.y;
        const size = bacteria.size;
        
        // Desenha linha de estado acima da bactéria
        textAlign(CENTER, BOTTOM);
        textSize(10);
        fill(255);
        stroke(0);
        strokeWeight(2);
        
        // Mostra estado atual e energia
        let stateText = "?";
        let energyValue = "?";
        
        if (bacteria.stateManager) {
            stateText = bacteria.stateManager.currentState || "?";
            energyValue = bacteria.stateManager.currentEnergy.toFixed(0) || "?";
        }
        
        text(`${stateText} [${energyValue}]`, x, y - size * 0.8);
        
        // Desenha ID da bactéria
        textSize(8);
        text(`ID:${bacteria.id}`, x, y - size * 0.5);
        
        // Desenha seta de velocidade se disponível
        if (bacteria.movement && bacteria.movement.velocity) {
            const vel = bacteria.movement.velocity;
            if (vel.mag() > 0.1) { // Só mostra se houver movimento significativo
                const velScale = 10; // Escala da seta
                stroke(255, 100, 0);
                strokeWeight(2);
                line(x, y, x + vel.x * velScale, y + vel.y * velScale);
                // Ponta da seta
                const arrowSize = 5;
                const angle = vel.heading();
                const arrowX = x + vel.x * velScale;
                const arrowY = y + vel.y * velScale;
                line(arrowX, arrowY, 
                    arrowX - arrowSize * cos(angle - PI/6), 
                    arrowY - arrowSize * sin(angle - PI/6));
                line(arrowX, arrowY, 
                    arrowX - arrowSize * cos(angle + PI/6), 
                    arrowY - arrowSize * sin(angle + PI/6));
            }
        }
        
        // Resetar estilos
        noStroke();
    }
}

// Exporta a classe para uso global
window.BacteriaVisualizationComponent = BacteriaVisualizationComponent; 