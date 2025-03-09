/**
 * Classe responsável pela visualização das bactérias
 */
class Visualization {
    /**
     * Inicializa o sistema de visualização
     * @param {Object} params - Parâmetros de visualização
     * @param {number} params.size - Tamanho da bactéria
     * @param {boolean} params.isFemale - Se é fêmea
     */
    constructor({ size, isFemale }) {
        this.size = size;
        this.isFemale = isFemale;
        this.baseColor = isFemale ? color(255, 182, 193) : color(173, 216, 230);
        this.currentColor = this.baseColor;
        this.transparency = 255;
        this.isCourting = false;
        this.courtingEffect = 0;
    }

    /**
     * Atualiza a visualização
     * @param {Object} params - Parâmetros de atualização
     * @param {number} params.health - Saúde atual
     * @param {number} params.agePercentage - Porcentagem de idade
     * @param {string} params.currentBehavior - Comportamento atual
     * @param {boolean} params.isPregnant - Se está grávida
     * @param {boolean} params.isCourting - Se está em cortejo
     */
    update({ health, agePercentage, currentBehavior, isPregnant, isCourting }) {
        // Ajusta transparência baseada na saúde
        this.transparency = map(health, 0, 100, 100, 255);

        // Atualiza estado de cortejo
        this.isCourting = isCourting;
        if (this.isCourting) {
            this.courtingEffect = (this.courtingEffect + 0.1) % TWO_PI;
        } else {
            this.courtingEffect = 0;
        }

        // Ajusta cor base de acordo com o comportamento
        let behaviorColor;
        switch (currentBehavior) {
            case 'eat':
                behaviorColor = color(0, 255, 0); // Verde para comer
                break;
            case 'mate':
                behaviorColor = color(255, 192, 203); // Rosa para acasalar
                break;
            case 'rest':
                behaviorColor = color(100, 149, 237); // Azul para descansar
                break;
            case 'explore':
                behaviorColor = color(255, 255, 0); // Amarelo para explorar
                break;
            default:
                behaviorColor = this.baseColor;
        }

        // Mistura a cor do comportamento com a cor base
        this.currentColor = lerpColor(this.baseColor, behaviorColor, 0.3);

        // Adiciona tom de cinza conforme envelhece
        if (agePercentage > 0.5) {
            let grayness = map(agePercentage, 0.5, 1, 0, 0.7);
            let grayColor = color(128, 128, 128);
            this.currentColor = lerpColor(this.currentColor, grayColor, grayness);
        }

        // Adiciona indicador de gravidez
        if (isPregnant) {
            this.currentColor = color(255, 215, 0); // Dourado para gravidez
        }
    }

    /**
     * Desenha a bactéria
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     */
    draw(x, y) {
        push();
        translate(x, y);
        
        // Efeito de cortejo
        if (this.isCourting) {
            push();
            noFill();
            stroke(255, 192, 203);
            strokeWeight(2);
            let size = this.size * 1.5 + sin(this.courtingEffect) * 5;
            circle(0, 0, size);
            pop();
        }

        // Define cor com transparência
        let c = this.currentColor;
        fill(red(c), green(c), blue(c), this.transparency);
        noStroke();

        // Desenha corpo principal
        ellipse(0, 0, this.size, this.size);

        // Desenha indicador de gênero
        if (this.isFemale) {
            stroke(255);
            strokeWeight(1);
            noFill();
            let symbolSize = this.size * 0.4;
            circle(0, symbolSize/2, symbolSize);
            line(0, symbolSize, 0, symbolSize * 1.5);
            line(-symbolSize/4, symbolSize * 1.25, symbolSize/4, symbolSize * 1.25);
        } else {
            stroke(255);
            strokeWeight(1);
            noFill();
            let symbolSize = this.size * 0.4;
            circle(0, -symbolSize/2, symbolSize);
            line(0, 0, 0, -symbolSize * 1.5);
            line(symbolSize/2, -symbolSize, symbolSize, -symbolSize);
        }

        pop();
    }
}

// Tornando a classe global
window.Visualization = Visualization; 

/**
 * Sistema de visualização da simulação
 */
class Visualization {
    constructor(simulation) {
        this.simulation = simulation;
    }

    /**
     * Desenha as informações na tela
     */
    displayInfo() {
        push();
        fill(255);
        noStroke();
        textSize(16);
        textAlign(LEFT);

        // Área de estatísticas (à direita)
        let x = 820;
        let y = 30;
        let lineHeight = 28;

        // Título
        textStyle(BOLD);
        text("ESTATÍSTICAS", x, y);
        y += lineHeight + 10;
        textStyle(NORMAL);

        // População
        text("POPULAÇÃO", x, y);
        y += lineHeight;
        text(`Total: ${this.simulation.stats.totalBacterias}`, x, y);
        y += lineHeight;
        text(`Fêmeas: ${this.simulation.stats.femaleBacterias}`, x, y);
        y += lineHeight;
        text(`Machos: ${this.simulation.stats.maleBacterias}`, x, y);
        y += lineHeight;
        text(`Grávidas: ${this.simulation.stats.pregnantBacterias}`, x, y);
        y += lineHeight;
        text(`Filhos Gerados: ${this.simulation.stats.totalChildren}`, x, y);
        y += lineHeight + 10;

        // Saúde e Geração
        text("SAÚDE E EVOLUÇÃO", x, y);
        y += lineHeight;
        text(`Geração: ${this.simulation.stats.highestGeneration}`, x, y);
        y += lineHeight;
        text(`Saúde: ${this.simulation.stats.averageHealth.toFixed(1)}`, x, y);
        y += lineHeight + 10;

        // Estado
        text("ESTADO", x, y);
        y += lineHeight;
        text(`Descansando: ${this.simulation.stats.restingBacterias}`, x, y);
        y += lineHeight;
        text(`Com fome: ${this.simulation.stats.hungryBacterias}`, x, y);
        y += lineHeight;
        text(`Mortes/fome: ${this.simulation.stats.starvationDeaths}`, x, y);
        y += lineHeight + 10;

        // Ambiente
        text("AMBIENTE", x, y);
        y += lineHeight;
        text(`Comida: ${this.simulation.food.length}`, x, y);
        y += lineHeight;
        text(`Obstáculos: ${this.simulation.obstacles.length}`, x, y);

        // Eventos Ativos
        const activeEvents = this.simulation.randomEvents.getActiveEvents();
        if (activeEvents.length > 0) {
            y += lineHeight + 10;
            text("EVENTOS ATIVOS", x, y);
            y += lineHeight;
            
            for (let event of activeEvents) {
                text(`${event.name} (${Math.ceil(event.remainingDuration/60)}s)`, x, y);
                y += lineHeight;
            }
        }

        // Debug Info
        if (this.simulation.controls.showDebug) {
            this.displayDebugInfo(x, y + lineHeight);
        }

        pop();
    }

    /**
     * Exibe informações de debug
     */
    displayDebugInfo(x, y) {
        push();
        fill(255, 255, 0);
        textSize(14);
        text("DEBUG INFO", x, y);
        y += 20;

        // Se houver uma bactéria selecionada
        if (this.simulation.selectedBacteria) {
            const b = this.simulation.selectedBacteria;
            const genes = b.dna.getDescription();
            
            text("Bactéria Selecionada:", x, y);
            y += 20;
            
            const info = [
                `Geração: ${genes.generation}`,
                `Metabolismo: ${genes.metabolism}`,
                `Imunidade: ${genes.immunity}`,
                `Velocidade: ${genes.speed}`,
                `Fertilidade: ${genes.fertility}`,
                `Taxa Mutação: ${genes.mutationRate}`,
                `Saúde: ${b.health.toFixed(1)}`,
                `Estado: ${b.behavior.currentBehavior}`,
                `Última Refeição: ${Math.floor((frameCount - b.lastMealTime)/60)}s atrás`
            ];

            for (let line of info) {
                text(line, x + 10, y);
                y += 18;
            }
        }
        pop();
    }

    /**
     * Desenha trilhas das bactérias
     */
    drawTrails() {
        if (!this.simulation.showTrails) return;

        push();
        noFill();
        strokeWeight(1);
        
        for (let b of this.simulation.bacteria) {
            if (!b.trail) b.trail = [];
            
            // Adiciona posição atual à trilha
            b.trail.push(b.pos.copy());
            
            // Limita o tamanho da trilha
            if (b.trail.length > 30) {
                b.trail.shift();
            }

            // Desenha a trilha
            beginShape();
            for (let i = 0; i < b.trail.length; i++) {
                const alpha = map(i, 0, b.trail.length, 0, 255);
                stroke(255, alpha * 0.2);
                vertex(b.trail[i].x, b.trail[i].y);
            }
            endShape();
        }
        pop();
    }
} 

/**
 * Sistema de visualização para as bactérias
 */
class Visualization {
    /**
     * Inicializa o sistema de visualização
     * @param {DNA} dna - DNA da bactéria
     * @param {number} size - Tamanho base da bactéria
     */
    constructor(dna, size) {
        this.dna = dna;
        this.baseSize = size;
        this.currentSize = size * dna.genes.size;
        this.baseColor = color(100, 150, 200);
        this.calculateColor();
    }

    /**
     * Calcula a cor da bactéria baseada no DNA
     */
    calculateColor() {
        const genes = this.dna.genes;
        this.color = color(
            constrain(red(this.baseColor) + genes.color.r, 0, 255),
            constrain(green(this.baseColor) + genes.color.g, 0, 255),
            constrain(blue(this.baseColor) + genes.color.b, 0, 255)
        );
    }

    /**
     * Desenha a bactéria
     * @param {p5.Vector} position - Posição da bactéria
     * @param {number} health - Saúde atual da bactéria
     * @param {string} currentBehavior - Comportamento atual
     * @param {boolean} isPregnant - Se está grávida
     * @param {boolean} isFemale - Se é fêmea
     */
    draw(position, health, currentBehavior, isPregnant, isFemale) {
        push();
        translate(position.x, position.y);

        // Desenha o corpo principal
        this.drawBody(health);

        // Desenha indicadores de estado
        this.drawStateIndicators(currentBehavior, isPregnant, isFemale);

        pop();
    }

    /**
     * Desenha o corpo principal da bactéria
     * @param {number} health - Saúde atual
     */
    drawBody(health) {
        // Ajusta a transparência baseada na saúde
        const alpha = map(health, 0, 100, 100, 255);
        const currentColor = color(
            red(this.color),
            green(this.color),
            blue(this.color),
            alpha
        );

        // Corpo principal
        fill(currentColor);
        noStroke();
        ellipse(0, 0, this.currentSize, this.currentSize);

        // Borda suave
        stroke(currentColor);
        strokeWeight(2);
        noFill();
        ellipse(0, 0, this.currentSize + 2, this.currentSize + 2);
    }

    /**
     * Desenha indicadores de estado da bactéria
     * @param {string} currentBehavior - Comportamento atual
     * @param {boolean} isPregnant - Se está grávida
     * @param {boolean} isFemale - Se é fêmea
     */
    drawStateIndicators(currentBehavior, isPregnant, isFemale) {
        const size = this.currentSize;

        // Indicador de gênero
        if (isFemale) {
            stroke(255, 150, 200, 200);
            strokeWeight(2);
            noFill();
            circle(0, size/3, size/4);
        } else {
            stroke(150, 200, 255, 200);
            strokeWeight(2);
            line(-size/8, -size/3, size/8, -size/3);
            line(0, -size/3, 0, -size/4);
        }

        // Indicador de gravidez
        if (isPregnant) {
            noStroke();
            fill(255, 255, 200, 150);
            ellipse(0, 0, size/2, size/2);
        }

        // Indicador de comportamento
        this.drawBehaviorIndicator(currentBehavior);
    }

    /**
     * Desenha indicador do comportamento atual
     * @param {string} behavior - Comportamento atual
     */
    drawBehaviorIndicator(behavior) {
        const size = this.currentSize;
        noStroke();

        switch(behavior) {
            case 'eating':
                fill(0, 255, 0, 150);
                circle(-size/3, -size/3, size/4);
                break;
            case 'mating':
                fill(255, 150, 150, 150);
                heart(-size/3, -size/3, size/4);
                break;
            case 'resting':
                fill(100, 100, 255, 150);
                ellipse(-size/3, -size/3, size/4, size/6);
                break;
            case 'exploring':
                fill(255, 200, 0, 150);
                star(-size/3, -size/3, size/8, size/4, 5);
                break;
        }
    }
}

/**
 * Desenha um coração
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 * @param {number} size - Tamanho
 */
function heart(x, y, size) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.01) {
        let r = size * (1 - sin(a));
        let px = r * 16 * pow(sin(a), 3);
        let py = -r * (13 * cos(a) - 5 * cos(2*a) - 2 * cos(3*a) - cos(4*a));
        vertex(x + px/16, y + py/16);
    }
    endShape(CLOSE);
}

/**
 * Desenha uma estrela
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 * @param {number} radius1 - Raio interno
 * @param {number} radius2 - Raio externo
 * @param {number} npoints - Número de pontas
 */
function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle/2.0;
    
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a+halfAngle) * radius1;
        sy = y + sin(a+halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
} 