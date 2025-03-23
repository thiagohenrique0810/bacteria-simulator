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
        
        // Verifica se entityManager está disponível
        if (!this.simulation || !this.simulation.entityManager) {
            return;
        }
        
        // Adiciona dados atuais aos gráficos
        this.statsGraphs.population.data.push(this.simulation.entityManager.bacteria.length);
        this.statsGraphs.predators.data.push(this.simulation.entityManager.predators.length);
        this.statsGraphs.food.data.push(this.simulation.entityManager.food.length);
        
        // Calcula saúde média
        let totalHealth = 0;
        for (let bacteria of this.simulation.entityManager.bacteria) {
            totalHealth += bacteria.health || 0;
        }
        const avgHealth = this.simulation.entityManager.bacteria.length > 0 ? 
            totalHealth / this.simulation.entityManager.bacteria.length : 0;
        this.statsGraphs.avgHealth.data.push(avgHealth);
        
        // Calcula geração média
        let totalGeneration = 0;
        for (let bacteria of this.simulation.entityManager.bacteria) {
            if (bacteria.dna && typeof bacteria.dna.generation === 'number') {
                totalGeneration += bacteria.dna.generation;
            } else {
                totalGeneration += 1; // Valor padrão se dna.generation não existir
            }
        }
        const avgGeneration = this.simulation.entityManager.bacteria.length > 0 ? 
            totalGeneration / this.simulation.entityManager.bacteria.length : 1;
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
        
        // Limpa a tela
        background(51);
        
        // Verifica se a simulação está disponível
        if (!this.simulation) {
            console.error("❌ ERRO: Simulação não disponível no sistema de visualização");
            fill(255, 0, 0);
            textSize(20);
            textAlign(CENTER, CENTER);
            text("ERRO: Simulação não disponível", width/2, height/2);
            pop();
            return;
        }
        
        // Verifica se o gerenciador de entidades está disponível
        if (!this.simulation.entityManager) {
            console.error("❌ ERRO: EntityManager não disponível na simulação");
            fill(255, 0, 0);
            textSize(20);
            textAlign(CENTER, CENTER);
            text("ERRO: EntityManager não disponível", width/2, height/2);
            pop();
            return;
        }
        
        // Aplica zoom
        translate(width/2, height/2);
        scale(this.simulation.zoom || 1);
        translate(-width/2, -height/2);

        // Desenha os rastros se ativado
        if (this.simulation.showTrails) {
            this.drawTrails();
        }

        // Desenha os elementos
        this.drawObstacles();
        this.drawFood();
        this.drawBacterias();

        // Desenha efeitos visuais
        if (this.simulation.entityManager.effects && 
            Array.isArray(this.simulation.entityManager.effects)) {
            // Desenha cada efeito
            for (const effect of this.simulation.entityManager.effects) {
                if (effect && typeof effect.draw === 'function') {
                    effect.draw();
                }
            }
        }

        // Desenha visualização do particionamento espacial
        if (this.showGrid && this.simulation.spatialGrid) {
            this.drawSpatialGrid();
        }
        
        // Desenha os gráficos de estatísticas
        this.drawGraphs();

        pop();
    }

    /**
     * Desenha as trilhas de movimento das bactérias
     */
    drawTrails() {
        if (!this.simulation || !this.simulation.entityManager) return;
        
        // Verifica se as trilhas devem ser exibidas
        if (!this.simulation.showTrails) return;
        
        const bacteria = this.simulation.entityManager.bacteria;
        if (!Array.isArray(bacteria)) return;
        
        push();
        
        // Usa as configurações de trilha da simulação
        const trailOpacity = this.simulation.trailOpacity;
        const trailLength = this.simulation.trailLength;
        
        for (const b of bacteria) {
            if (!b || !b.movement || !Array.isArray(b.movement.history)) continue;
            
            // Define a cor da trilha baseada no tipo e sexo da bactéria
            let trailColor;
            if (b.isFemale) {
                trailColor = color(255, 150, 200, 255 * trailOpacity); // Rosa para fêmeas
            } else {
                trailColor = color(100, 150, 255, 255 * trailOpacity); // Azul para machos
            }
            
            // Desenha a trilha
            noFill();
            stroke(trailColor);
            strokeWeight(2);
            beginShape();
            
            // Limita o número de pontos ao comprimento da trilha definido
            const historyLength = Math.min(b.movement.history.length, trailLength);
            
            // Desenha somente os pontos mais recentes (limitado pelo comprimento da trilha)
            for (let i = b.movement.history.length - historyLength; i < b.movement.history.length; i++) {
                if (i >= 0) {
                    const pos = b.movement.history[i];
                    if (pos) {
                        // Calcula a opacidade baseada na posição no histórico (mais recente = mais opaco)
                        const opacity = map(
                            i, 
                            b.movement.history.length - historyLength, 
                            b.movement.history.length - 1, 
                            0.2 * trailOpacity, 
                            trailOpacity
                        );
                        
                        // Define a cor com opacidade variável
                        stroke(
                            red(trailColor), 
                            green(trailColor), 
                            blue(trailColor), 
                            255 * opacity
                        );
                        
                        // Define a espessura do traço
                        const weight = map(
                            i,
                            b.movement.history.length - historyLength,
                            b.movement.history.length - 1,
                            0.5,
                            2
                        );
                        strokeWeight(weight);
                        
                        // Desenha o ponto
                        vertex(pos.x, pos.y);
                    }
                }
            }
            
            endShape();
        }
        
        pop();
    }

    /**
     * Desenha uma bactéria na tela
     * @param {Object} bacteria - A bactéria a ser desenhada
     */
    drawBacteria(bacteria) {
        if (!bacteria || !bacteria.isActive) {
            return;
        }

        // Verificação completa de integridade da posição
        if (!bacteria.pos) {
            console.warn(`Bactéria sem posição válida ID: ${bacteria.id}`);
            return;
        }

        // Verifica especificamente o caso onde bacteria.pos.x é um objeto (erro identificado)
        if (typeof bacteria.pos.x === 'object') {
            console.warn(`Objeto detectado em bacteria.pos.x para ID: ${bacteria.id}`, bacteria.pos.x);
            
            // Tenta extrair o valor de x a partir do objeto, se possível
            if (bacteria.pos.x && typeof bacteria.pos.x.x === 'number') {
                bacteria.pos = {
                    x: bacteria.pos.x.x,
                    y: (typeof bacteria.pos.y === 'number') ? bacteria.pos.y : 0
                };
                console.log(`Posição corrigida para ID: ${bacteria.id}:`, bacteria.pos);
            } else {
                // Não foi possível corrigir, usar valores padrão
                const worldWidth = width || 800;
                const worldHeight = height || 600;
                bacteria.pos = {
                    x: worldWidth / 2,
                    y: worldHeight / 2
                };
                console.warn(`Posição redefinida para padrão ID: ${bacteria.id}:`, bacteria.pos);
            }
            
            // Tenta corrigir a posição na bactéria original
            if (this.simulation && typeof this.simulation.fixBacteriaPosition === 'function') {
                this.simulation.fixBacteriaPosition(bacteria.id, bacteria.pos.x, bacteria.pos.y);
            }
        }

        // Continua a verificação para números inválidos
        if (isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y) || 
            !isFinite(bacteria.pos.x) || !isFinite(bacteria.pos.y)) {
            
            const bacteriaId = bacteria.id || "desconhecido";
            console.warn(`Valores de posição inválidos para bactéria ID: ${bacteriaId}: (${bacteria.pos.x}, ${bacteria.pos.y})`);
            
            // Usar posição padrão se valores forem inválidos
            const worldWidth = width || 800;
            const worldHeight = height || 600;
            bacteria.pos = {
                x: worldWidth / 2,
                y: worldHeight / 2
            };
            
            // Tenta corrigir a posição na bactéria original
            if (this.simulation && typeof this.simulation.fixBacteriaPosition === 'function') {
                this.simulation.fixBacteriaPosition(bacteriaId, bacteria.pos.x, bacteria.pos.y);
            }
        }

        // Após validações, continuar com o desenho
        const size = bacteria.size || 5;
        let fillColor;

        // Verifica se há ângulo válido antes de rotacionar
        if (bacteria.movement && typeof bacteria.movement.angle === 'number' && 
            !isNaN(bacteria.movement.angle) && isFinite(bacteria.movement.angle)) {
            rotate(bacteria.movement.angle);
        }

        // Corpo da bactéria
        noStroke();
        
        // Usa cor baseada no gênero se a cor da bactéria não estiver definida
        if (bacteria.color) {
            fillColor = bacteria.color;
        } else {
            fillColor = bacteria.isFemale ? color(255, 150, 200) : color(150, 200, 255);
        }
        
        fill(fillColor);
        
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

    /**
     * Desenha a comida
     */
    drawFood() {
        try {
            // Verifica se entityManager está disponível
            if (!this.simulation || !this.simulation.entityManager) {
                return;
            }
            
            // Desenha cada item de comida
            const foods = this.simulation.entityManager.food;
            for (let i = 0; i < foods.length; i++) {
                const food = foods[i];
                if (food && food.position) {
                    fill(0, 255, 0);
                    noStroke();
                    circle(food.position.x, food.position.y, 8);
                }
            }
        } catch (error) {
            console.error("❌ Erro ao desenhar comida:", error);
        }
    }

    /**
     * Desenha os obstáculos
     */
    drawObstacles() {
        try {
            // Verifica se entityManager está disponível
            if (!this.simulation || !this.simulation.entityManager) {
                return;
            }
            
            // Desenha cada obstáculo
            const obstacles = this.simulation.entityManager.obstacles;
            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                if (obstacle && obstacle.pos) {
                    fill(100);
                    noStroke();
                    circle(obstacle.pos.x, obstacle.pos.y, obstacle.size || 20);
                }
            }
        } catch (error) {
            console.error("❌ Erro ao desenhar obstáculos:", error);
        }
    }

    /**
     * Exibe informações gerais da simulação na tela
     */
    displayInfo() {
        if (!this.showStats || !this.simulation) return;
        
        try {
            push();
            
            // Verifica se o gerenciador de entidades está disponível
            if (!this.simulation.entityManager) {
                console.error("❌ EntityManager não disponível para exibir informações");
                pop();
                return;
            }
            
            fill(255);
            noStroke();
            textAlign(LEFT, TOP);
            textSize(14);
            
            // Posição inicial para exibir estatísticas
            let y = 20;
            const x = 20;
            const lineHeight = 18;
            
            // FPS
            text(`FPS: ${frameRate().toFixed(0)}`, x, y);
            y += lineHeight;
            
            // Contagem de bactérias
            text(`Bactérias: ${this.simulation.entityManager.bacteria.length}`, x, y);
            y += lineHeight;
            
            // Contagem de comida
            text(`Comida: ${this.simulation.entityManager.food.length}`, x, y);
            y += lineHeight;
            
            // Geração média (se disponível)
            let avgGeneration = 1;
            try {
                let totalGen = 0;
                let count = 0;
                
                for (const bacteria of this.simulation.entityManager.bacteria) {
                    if (bacteria && bacteria.dna && typeof bacteria.dna.generation === 'number') {
                        totalGen += bacteria.dna.generation;
                        count++;
                    }
                }
                
                if (count > 0) {
                    avgGeneration = totalGen / count;
                }
                
                text(`Geração média: ${avgGeneration.toFixed(1)}`, x, y);
                y += lineHeight;
            } catch (error) {
                console.warn("⚠️ Erro ao calcular geração média:", error);
            }
            
            // Status da simulação (pausada ou em execução)
            if (this.simulation.paused) {
                fill(255, 100, 100);
                text("SIMULAÇÃO PAUSADA", x, y);
            }
            
            pop();
        } catch (error) {
            console.error("❌ Erro ao exibir informações:", error);
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

    /**
     * Desenha as bactérias na tela
     */
    drawBacterias() {
        try {
            // Verifica se a simulação está disponível
            if (!this.simulation) {
                console.error("❌ ERRO no drawBacterias: Simulação não definida");
                return;
            }
            
            // Verifica se o gerenciador de entidades está disponível
            if (!this.simulation.entityManager) {
                console.error("❌ ERRO no drawBacterias: EntityManager não definido na simulação");
                return;
            }
            
            // Verifica se o array de bactérias existe
            if (!this.simulation.entityManager.bacteria) {
                console.error("❌ ERRO no drawBacterias: Array de bactérias não existe no EntityManager");
                return;
            }
            
            // Verifica se bacteria é um array válido
            if (!Array.isArray(this.simulation.entityManager.bacteria)) {
                console.error("❌ ERRO no drawBacterias: O objeto bacteria não é um array");
                console.log(`🔍 Tipo de bacteria: ${typeof this.simulation.entityManager.bacteria}`);
                return;
            }
            
            // Log do número de bactérias a cada 60 frames
            if (frameCount % 60 === 0) {
                console.log(`🦠 Desenhando ${this.simulation.entityManager.bacteria.length} bactérias`);
            }
            
            // Remove valores null ou undefined do array
            const validBacteria = this.simulation.entityManager.bacteria.filter(b => b);
            
            if (validBacteria.length !== this.simulation.entityManager.bacteria.length) {
                console.warn(`⚠️ Removidos ${this.simulation.entityManager.bacteria.length - validBacteria.length} valores nulos do array de bactérias`);
                this.simulation.entityManager.bacteria = validBacteria;
            }
            
            // Desenha cada bactéria válida
            for (let i = 0; i < validBacteria.length; i++) {
                try {
                    const bacteria = validBacteria[i];
                    
                    // Verifica se a bactéria é um objeto válido
                    if (!bacteria || typeof bacteria !== 'object') {
                        console.warn(`⚠️ Bactéria ${i} inválida: ${typeof bacteria}`);
                        continue;
                    }
                    
                    // Verifica se a bactéria tem um método draw
                    if (typeof bacteria.draw === 'function') {
                        bacteria.draw();
                    } else {
                        // Tenta desenhar a bactéria usando propriedades básicas
                        if (bacteria.pos && typeof bacteria.pos.x === 'number' && typeof bacteria.pos.y === 'number') {
                            push();
                            fill(bacteria.isFemale ? color(255, 150, 200) : color(100, 150, 255));
                            noStroke();
                            ellipse(bacteria.pos.x, bacteria.pos.y, bacteria.size || 10);
                            pop();
                        } else {
                            console.warn(`⚠️ Bactéria ${i} não tem método draw nem posição válida`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erro ao desenhar bactéria ${i}:`, error);
                }
            }
            
        } catch (error) {
            console.error("❌ ERRO ao desenhar bactérias:", error);
        }
    }
}

// Tornando as classes globais
window.BacteriaVisualization = BacteriaVisualization;
window.SimulationVisualization = SimulationVisualization; 