/**
 * Sistema de renderização da simulação
 * Responsável por desenhar todas as entidades e elementos visuais
 */
class RenderSystem {
    /**
     * Inicializa o sistema de renderização
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Configurações de visualização
        this.showTrails = false;
        this.showEnergy = true;
        this.showGender = true;
        this.showDiseaseEffects = true;
        this.zoom = 1;
        this.showGrid = false;   // Exibir grid espacial?
        this.debugMode = true;   // Ativar modo de debug?
    }
    
    /**
     * Desenha todas as entidades da simulação
     */
    draw() {
        const entityManager = this.simulation.entityManager;
        const environmentSystem = this.simulation.environmentSystem;
        
        // Aplica iluminação conforme ciclo dia/noite
        this.applyLighting(environmentSystem.getLightFactor());
        
        // Desenha os rastros das bactérias (se ativado)
        if (this.showTrails) {
            for (let b of entityManager.bacteria) {
                b.drawTrail && b.drawTrail();
            }
        }
        
        // Desenha comida
        for (let f of entityManager.food) {
            f.draw();
        }
        
        // Desenha obstáculos
        for (let o of entityManager.obstacles) {
            o.draw();
        }
        
        // Desenha bactérias
        for (let b of entityManager.bacteria) {
            b.draw();
        }
        
        // Desenha predadores
        for (let p of entityManager.predators) {
            p.draw();
        }
        
        // Desenha efeitos visuais
        for (let e of entityManager.effects) {
            e.draw();
        }
        
        // Desenha efeitos das doenças
        if (this.showDiseaseEffects) {
            this.simulation.diseaseSystem.draw();
        }
        
        // Desenha estatísticas
        if (this.simulation.controls && !this.simulation.controls.visualizationSettings.hideStats) {
            this.simulation.statsManager.drawStats();
        }
        
        // Desenha o fundo
        this.drawBackground();
        
        // Desenha o grid espacial se ativado
        if (this.showGrid) {
            this.drawSpatialGrid();
        }
        
        // Desenha obstáculos
        this.drawObstacles();
        
        // Desenha comida
        this.drawFood();
        
        // Desenha bactérias
        this.drawBacteria();
        
        // Desenha predadores
        this.drawPredators();
        
        // Desenha efeitos
        this.drawEffects();
        
        // Informações de debug
        if (this.debugMode) {
            this.drawDebugInfo();
        }
        
        // Restaura iluminação normal
        this.resetLighting();
    }
    
    /**
     * Aplica efeito de iluminação conforme ciclo dia/noite
     * @param {number} lightFactor - Fator de luz (0-1)
     */
    applyLighting(lightFactor) {
        // Implementação básica: overlay semitransparente
        if (lightFactor < 1.0) {
            push();
            noStroke();
            // Sobreposição escura com opacidade inversamente proporcional à luz
            fill(0, 0, 30, map(lightFactor, 0, 1, 180, 0));
            rect(0, 0, width, height);
            pop();
        }
    }
    
    /**
     * Restaura iluminação normal
     */
    resetLighting() {
        // Não é necessário restaurar nada no método atual de iluminação
        // Mantido para compatibilidade futura
    }
    
    /**
     * Atualiza configurações de visualização
     * @param {Object} settings - Configurações de visualização
     */
    updateSettings(settings) {
        if (!settings) return;
        
        this.showTrails = settings.showTrails || false;
        this.showEnergy = settings.showEnergy || true;
        this.showGender = settings.showGender || true;
        this.showDiseaseEffects = settings.showDiseaseEffects || true;
        this.zoom = Math.max(0.5, Math.min(2, settings.zoom || 1));
        this.showGrid = settings.showGrid || false;
        this.debugMode = settings.debugMode || true;
    }
    
    /**
     * Desenha o fundo
     */
    drawBackground() {
        // Simplificado por enquanto - fundo preto já desenhado por background(0)
    }
    
    /**
     * Desenha o grid espacial para depuração
     */
    drawSpatialGrid() {
        const grid = this.simulation.spatialGrid;
        if (!grid) return;
        
        push();
        stroke(60, 60, 90);
        strokeWeight(1);
        
        // Desenha linhas verticais
        for (let x = 0; x <= grid.width; x += grid.cellSize) {
            line(x, 0, x, grid.height);
        }
        
        // Desenha linhas horizontais
        for (let y = 0; y <= grid.height; y += grid.cellSize) {
            line(0, y, grid.width, y);
        }
        
        // Opcional: Mostra ocupação das células
        if (this.debugMode) {
            textSize(10);
            textAlign(CENTER, CENTER);
            
            for (let i = 0; i < grid.cellsX; i++) {
                for (let j = 0; j < grid.cellsY; j++) {
                    const cell = grid.cells[i][j];
                    if (cell && cell.length > 0) {
                        fill(100, 150, 255, 100);
                        const cellX = i * grid.cellSize;
                        const cellY = j * grid.cellSize;
                        rect(cellX, cellY, grid.cellSize, grid.cellSize);
                        
                        fill(255);
                        text(cell.length, cellX + grid.cellSize/2, cellY + grid.cellSize/2);
                    }
                }
            }
        }
        
        pop();
    }
    
    /**
     * Desenha obstáculos
     */
    drawObstacles() {
        push();
        fill(60, 60, 60);
        noStroke();
        
        for (const obstacle of this.simulation.entityManager.obstacles) {
            ellipse(obstacle.pos.x, obstacle.pos.y, obstacle.size, obstacle.size);
        }
        
        pop();
    }
    
    /**
     * Desenha comida
     */
    drawFood() {
        push();
        noStroke();
        
        for (const food of this.simulation.entityManager.food) {
            // Cor baseada no valor nutricional
            const nutrition = food.nutrition || 30;
            const colorValue = map(nutrition, 10, 50, 50, 255);
            fill(colorValue, 255, colorValue);
            
            // Tamanho baseado no valor nutricional
            const size = map(nutrition, 10, 50, 5, 15);
            ellipse(food.position.x, food.position.y, size, size);
        }
        
        pop();
    }
    
    /**
     * Desenha bactérias
     */
    drawBacteria() {
        // Usa o método draw de cada bactéria para desenhar
        for (const bacteria of this.simulation.entityManager.bacteria) {
            // Tenta chamar o método de desenho
            if (bacteria.draw && typeof bacteria.draw === 'function') {
                bacteria.draw();
            } 
            // Fallback se o método draw não existir
            else {
                push();
                fill(bacteria.isFemale ? color(255, 150, 200) : color(150, 200, 255));
                noStroke();
                ellipse(bacteria.pos.x, bacteria.pos.y, bacteria.size, bacteria.size);
                pop();
            }
        }
    }
    
    /**
     * Desenha predadores
     */
    drawPredators() {
        push();
        fill(255, 50, 50);
        noStroke();
        
        for (const predator of this.simulation.entityManager.predators) {
            // Tenta chamar o método de desenho
            if (predator.draw && typeof predator.draw === 'function') {
                predator.draw();
            } 
            // Fallback se o método draw não existir
            else {
                triangle(
                    predator.pos.x, predator.pos.y - predator.size/2,
                    predator.pos.x - predator.size/2, predator.pos.y + predator.size/2,
                    predator.pos.x + predator.size/2, predator.pos.y + predator.size/2
                );
            }
        }
        
        pop();
    }
    
    /**
     * Desenha efeitos
     */
    drawEffects() {
        // Desenha todos os efeitos visuais
        for (const effect of this.simulation.entityManager.effects) {
            if (effect.draw && typeof effect.draw === 'function') {
                effect.draw();
            }
        }
    }
    
    /**
     * Desenha informações de debug
     */
    drawDebugInfo() {
        push();
        fill(255);
        textSize(12);
        textAlign(LEFT, TOP);
        
        // Informações básicas
        text(`FPS: ${frameRate().toFixed(0)}`, 10, 10);
        text(`Bactérias: ${this.simulation.entityManager.bacteria.length}`, 10, 30);
        text(`Comida: ${this.simulation.entityManager.food.length}`, 10, 50);
        text(`Predadores: ${this.simulation.entityManager.predators.length}`, 10, 70);
        
        // Estatísticas
        if (this.simulation.statsManager && this.simulation.statsManager.stats) {
            const stats = this.simulation.statsManager.stats;
            text(`Nascimentos: ${stats.births || 0}`, 10, 100);
            text(`Mortes: ${stats.deaths || 0}`, 10, 120);
            text(`Mortes por doença: ${stats.diseaseDeaths || 0}`, 10, 140);
            text(`Mortes por predador: ${stats.predatorKills || 0}`, 10, 160);
        }
        
        pop();
    }
    
    /**
     * Configura o modo de depuração
     * @param {boolean} enabled - Ativar modo de depuração?
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        
        // Ativa/desativa modo de debug em todas as bactérias
        for (const bacteria of this.simulation.entityManager.bacteria) {
            if (bacteria.visualization) {
                bacteria.visualization.showDebugInfo = enabled;
            }
        }
    }
}

// Torna a classe disponível globalmente
window.RenderSystem = RenderSystem; 