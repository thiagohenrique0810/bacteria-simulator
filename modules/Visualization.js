/**
 * Sistema de visualização das bactérias
 */
class BacteriaVisualization {
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

/**
 * Sistema de visualização da simulação
 */
class SimulationVisualization {
    /**
     * Inicializa o sistema de visualização
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.trails = [];
        this.maxTrails = 100;
        this.showStats = true;
        this.showGenes = false;
        this.showGrid = false;
        
        // Configurações de estatísticas
        this.statsGraphs = {
            population: {
                data: [],
                maxPoints: 100,
                color: color(0, 200, 0),
                visible: true,
                min: 0,
                max: 100,
                title: 'População'
            },
            predators: {
                data: [],
                maxPoints: 100,
                color: color(200, 0, 0),
                visible: true,
                min: 0,
                max: 10,
                title: 'Predadores'
            },
            food: {
                data: [],
                maxPoints: 100,
                color: color(0, 0, 200),
                visible: true,
                min: 0,
                max: 200,
                title: 'Comida'
            },
            avgHealth: {
                data: [],
                maxPoints: 100,
                color: color(200, 100, 0),
                visible: true,
                min: 0,
                max: 100,
                title: 'Saúde Média'
            },
            generation: {
                data: [],
                maxPoints: 100,
                color: color(150, 0, 150),
                visible: true,
                min: 1,
                max: 10,
                title: 'Geração'
            }
        };
        
        // Atualiza estatísticas a cada segundo
        this.lastStatUpdate = 0;
        this.statUpdateInterval = 60; // frames (1 segundo em 60fps)
    }

    /**
     * Atualiza os dados dos gráficos
     */
    updateGraphs() {
        // Atualiza somente a cada intervalo definido
        if (frameCount - this.lastStatUpdate < this.statUpdateInterval) {
            return;
        }
        
        this.lastStatUpdate = frameCount;
        
        // Adiciona dados atuais aos gráficos
        this.statsGraphs.population.data.push(this.simulation.bacteria.length);
        this.statsGraphs.predators.data.push(this.simulation.predators.length);
        this.statsGraphs.food.data.push(this.simulation.food.length);
        
        // Calcula saúde média
        let totalHealth = 0;
        for (let bacteria of this.simulation.bacteria) {
            totalHealth += bacteria.health;
        }
        const avgHealth = this.simulation.bacteria.length > 0 ? 
            totalHealth / this.simulation.bacteria.length : 0;
        this.statsGraphs.avgHealth.data.push(avgHealth);
        
        // Calcula geração média
        let totalGeneration = 0;
        for (let bacteria of this.simulation.bacteria) {
            totalGeneration += bacteria.dna.generation;
        }
        const avgGeneration = this.simulation.bacteria.length > 0 ? 
            totalGeneration / this.simulation.bacteria.length : 1;
        this.statsGraphs.generation.data.push(avgGeneration);
        
        // Limita o número de pontos
        for (let key in this.statsGraphs) {
            const graph = this.statsGraphs[key];
            if (graph.data.length > graph.maxPoints) {
                graph.data.shift();
            }
            
            // Atualiza min/max dinâmicos
            if (graph.data.length > 0) {
                const maxValue = Math.max(...graph.data);
                graph.max = Math.max(graph.max, Math.ceil(maxValue * 1.2));
            }
        }
    }

    /**
     * Desenha os gráficos de estatísticas
     */
    drawGraphs() {
        const graphWidth = 220;
        const graphHeight = 80;
        const margin = 10;
        const statsX = width - graphWidth - margin;
        
        // Atualiza os gráficos
        this.updateGraphs();
        
        // Verifica se há dados suficientes
        if (this.statsGraphs.population.data.length < 2) return;
        
        let yOffset = 50;
        
        // Desenha cada gráfico
        for (let key in this.statsGraphs) {
            const graph = this.statsGraphs[key];
            if (!graph.visible) continue;
            
            // Desenha fundo do gráfico
            fill(0, 0, 0, 150);
            stroke(150);
            rect(statsX, yOffset, graphWidth, graphHeight);
            
            // Desenha título
            noStroke();
            fill(255);
            textAlign(LEFT, TOP);
            textSize(12);
            text(graph.title, statsX + 5, yOffset + 2);
            
            // Desenha valor atual
            const currentValue = graph.data[graph.data.length - 1];
            textAlign(RIGHT, TOP);
            text(Math.round(currentValue), statsX + graphWidth - 5, yOffset + 2);
            
            // Desenha o gráfico
            stroke(graph.color);
            noFill();
            beginShape();
            for (let i = 0; i < graph.data.length; i++) {
                const x = map(i, 0, graph.maxPoints, statsX, statsX + graphWidth);
                const y = map(graph.data[i], graph.min, graph.max, 
                             yOffset + graphHeight - 5, yOffset + 15);
                vertex(x, y);
            }
            endShape();
            
            // Desenha linhas guia
            stroke(150, 50);
            line(statsX, yOffset + graphHeight/2, statsX + graphWidth, yOffset + graphHeight/2);
            
            yOffset += graphHeight + margin;
        }
    }

    /**
     * Desenha a simulação
     */
    draw() {
        push();
        
        // Aplica zoom
        translate(width/2, height/2);
        scale(this.simulation.zoom || 1);
        translate(-width/2, -height/2);

        // Limpa a tela
        background(51);

        // Desenha os rastros se ativado
        if (this.simulation.showTrails) {
            this.drawTrails();
        }

        // Desenha os elementos
        this.drawObstacles();
        this.drawFood();
        this.drawBacteria();

        // Desenha visualização do particionamento espacial
        if (this.showGrid && this.simulation.spatialGrid) {
            this.drawSpatialGrid();
        }
        
        // Desenha os gráficos de estatísticas
        this.drawGraphs();

        pop();
    }

    /**
     * Desenha os rastros das bactérias
     */
    drawTrails() {
        // Adiciona novas posições aos rastros
        if (frameCount % 5 === 0) {
            const newTrails = this.simulation.bacteria.map(b => ({
                x: b.pos.x,
                y: b.pos.y,
                alpha: 255
            }));
            this.trails.push(...newTrails);

            // Limita o número de rastros
            while (this.trails.length > this.maxTrails) {
                this.trails.shift();
            }
        }

        // Desenha os rastros
        noStroke();
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.alpha = max(0, trail.alpha - 2);
            
            if (trail.alpha <= 0) {
                this.trails.splice(i, 1);
                continue;
            }

            fill(255, trail.alpha * 0.4);
            circle(trail.x, trail.y, 4);
        }
    }

    /**
     * Desenha as bactérias na simulação
     */
    drawBacteria() {
        for (let bacteria of this.simulation.bacteria) {
            if (!bacteria || !bacteria.pos) {
                console.warn("Bactéria sem posição detectada, pulando...");
                continue;  // Pula bactérias sem posição definida
            }
            
            push();
            translate(bacteria.pos.x, bacteria.pos.y);
            
            // Verifica se há ângulo válido antes de rotacionar
            if (bacteria.movement && typeof bacteria.movement.angle === 'number') {
                rotate(bacteria.movement.angle);
            }

            // Corpo da bactéria
            noStroke();
            
            // Usa cor baseada no gênero se a cor da bactéria não estiver definida
            let bacteriaColor;
            if (bacteria.color) {
                bacteriaColor = bacteria.color;
            } else {
                bacteriaColor = bacteria.isFemale ? color(255, 150, 200) : color(150, 200, 255);
            }
            
            fill(bacteriaColor);
            
            // Define um tamanho padrão se não estiver disponível
            const size = bacteria.size || 20;
            ellipse(0, 0, size, size * 0.7);

            // Indicador de gênero se ativado
            if (this.simulation.showGender) {
                stroke(255);
                strokeWeight(1);
                if (bacteria.isFemale) {
                    circle(0, size * 0.4, size * 0.2);
                } else {
                    line(0, size * 0.3, 0, size * 0.5);
                    line(-size * 0.1, size * 0.4, size * 0.1, size * 0.4);
                }
            }

            // Barra de energia se ativada
            if (this.simulation.showEnergy) {
                const energyWidth = size * 1.2;
                const energyHeight = 3;
                const energyY = -size * 0.7;
                
                // Fundo da barra
                noStroke();
                fill(0, 100);
                rect(-energyWidth/2, energyY, energyWidth, energyHeight);
                
                // Barra de energia
                const health = bacteria.health !== undefined ? bacteria.health : 100;
                const energyLevel = map(health, 0, 100, 0, energyWidth);
                fill(lerpColor(color(255, 0, 0), color(0, 255, 0), health/100));
                rect(-energyWidth/2, energyY, energyLevel, energyHeight);
            }

            pop();
        }
    }

    /**
     * Desenha a comida
     */
    drawFood() {
        for (let food of this.simulation.food) {
            if (!food.position) continue;
            const size = map(food.nutrition || 30, 10, 50, 5, 15);
            fill(0, 255, 0);
            noStroke();
            circle(food.position.x, food.position.y, size);
        }
    }

    /**
     * Desenha os obstáculos
     */
    drawObstacles() {
        fill(100);
        stroke(200);
        strokeWeight(2);
        for (let obstacle of this.simulation.obstacles) {
            // Usa w/h ou width/height, o que estiver disponível
            const w = obstacle.w || obstacle.width || 20;
            const h = obstacle.h || obstacle.height || 20;
            rect(obstacle.x, obstacle.y, w, h);
        }
    }

    /**
     * Exibe informações da simulação
     */
    displayInfo() {
        if (!this.simulation.controls?.statsCheckbox?.checked()) return;

        const stats = this.simulation.stats || {};
        const x = 810;
        let y = 20;
        const lineHeight = 20;

        fill(255);
        noStroke();
        textAlign(LEFT);
        textSize(14);

        // Informações gerais
        text(`Geração: ${stats.generation || 1}`, x, y); y += lineHeight;
        text(`População: ${stats.totalBacteria || 0}`, x, y); y += lineHeight;
        text(`Fêmeas: ${stats.femaleBacterias || 0}`, x, y); y += lineHeight;
        text(`Machos: ${stats.maleBacterias || 0}`, x, y); y += lineHeight;
        y += lineHeight;

        // Estatísticas vitais
        text(`Nascimentos: ${stats.births || 0}`, x, y); y += lineHeight;
        text(`Mortes: ${stats.deaths || 0}`, x, y); y += lineHeight;
        text(`Comida Consumida: ${stats.foodConsumed || 0}`, x, y); y += lineHeight;
        text(`Mutações: ${stats.mutations || 0}`, x, y); y += lineHeight;
        y += lineHeight;

        // Estado atual
        text(`Eventos: ${stats.eventsTriggered || 0}`, x, y); y += lineHeight;
        text(`Saúde Média: ${(stats.averageHealth || 0).toFixed(1)}`, x, y); y += lineHeight;
        text(`Comida Disponível: ${this.simulation.food?.length || 0}`, x, y); y += lineHeight;
        text(`Obstáculos: ${this.simulation.obstacles?.length || 0}`, x, y);

        // Adiciona informações sobre o sistema de grid e ciclo dia/noite
        if (this.simulation.dayNightEnabled) {
            textAlign(LEFT, TOP);
            textSize(14);
            fill(this.simulation.dayTime ? color(255, 200, 0) : color(100, 100, 255));
            text(`Estado: ${this.simulation.dayTime ? 'Dia' : 'Noite'}`, 
                 width - 150, height - 40);
        }
    }

    /**
     * Desenha o grid espacial
     */
    drawSpatialGrid() {
        const grid = this.simulation.spatialGrid;
        stroke(100, 100, 255, 30);
        
        // Desenha linhas verticais
        for (let x = 0; x <= grid.cols; x++) {
            const xPos = x * grid.cellSize;
            line(xPos, 0, xPos, this.simulation.height);
        }
        
        // Desenha linhas horizontais
        for (let y = 0; y <= grid.rows; y++) {
            const yPos = y * grid.cellSize;
            line(0, yPos, this.simulation.width, yPos);
        }
    }
}

// Tornando as classes globais
window.BacteriaVisualization = BacteriaVisualization;
window.SimulationVisualization = SimulationVisualization; 