/**
 * Componente de visualização de bactéria
 * Responsável por desenhar a bactéria e mostrar informações visuais e de depuração
 */
class BacteriaVisualizationComponent {
    // Distribuição padrão de tipos de bactérias (compartilhada por todas as instâncias)
    static typeDistribution = {
        bacilos: 0.25,    // Tipo 0
        cocos: 0.25,      // Tipo 1
        espirilos: 0.25,  // Tipo 2
        vibrioes: 0.25    // Tipo 3
    };
    
    /**
     * Define a distribuição dos tipos de bactérias a ser usada ao criar novas bactérias
     * @param {Object} distribution - Distribuição com proporções de cada tipo (bacilos, cocos, espirilos, vibrioes)
     */
    static setTypeDistribution(distribution) {
        if (!distribution) return;
        
        // Valida as propriedades necessárias
        const required = ['bacilos', 'cocos', 'espirilos', 'vibrioes'];
        for (const prop of required) {
            if (typeof distribution[prop] !== 'number') {
                console.warn(`Propriedade ${prop} ausente ou inválida na distribuição de tipos`);
                return;
            }
        }
        
        // Verifica se os valores somam aproximadamente 1
        const sum = distribution.bacilos + distribution.cocos + 
                   distribution.espirilos + distribution.vibrioes;
        
        if (Math.abs(sum - 1) > 0.01) {
            console.warn(`Distribuição de tipos não soma 1 (soma: ${sum}). Normalizando...`);
            
            // Normaliza os valores
            this.typeDistribution = {
                bacilos: distribution.bacilos / sum,
                cocos: distribution.cocos / sum,
                espirilos: distribution.espirilos / sum,
                vibrioes: distribution.vibrioes / sum
            };
        } else {
            // Usa os valores fornecidos
            this.typeDistribution = { ...distribution };
        }
        
        console.log("Nova distribuição de tipos de bactérias:", this.typeDistribution);
    }
    
    /**
     * Seleciona um tipo de bactéria com base na distribuição configurada
     * @returns {number} Tipo de bactéria (0-3)
     */
    static selectBacteriaType() {
        const rand = Math.random();
        let cumulative = 0;
        
        // Bacilos (tipo 0)
        cumulative += this.typeDistribution.bacilos;
        if (rand < cumulative) return 0;
        
        // Cocos (tipo 1)
        cumulative += this.typeDistribution.cocos;
        if (rand < cumulative) return 1;
        
        // Espirilos (tipo 2)
        cumulative += this.typeDistribution.espirilos;
        if (rand < cumulative) return 2;
        
        // Vibriões (tipo 3)
        return 3;
    }
    
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
        
        // Novos parâmetros para aparência mais realista
        this.bacteriaType = BacteriaVisualizationComponent.selectBacteriaType(); // Usa distribuição configurada
        this.flagellaCount = Math.floor(random(0, 5)); // Número de flagelos (0-4)
        this.flagellaLength = random(0.7, 1.5); // Comprimento relativo dos flagelos
        this.flagellaPhase = random(0, TWO_PI); // Fase inicial da ondulação dos flagelos
        this.flagellaAmplitude = random(0.1, 0.3); // Amplitude da ondulação dos flagelos
        this.rotation = random(0, TWO_PI); // Rotação inicial da bactéria
        this.rotationSpeed = random(-0.02, 0.02); // Velocidade de rotação (para algumas bactérias)
        this.innerStructures = Math.floor(random(2, 5)); // Número de estruturas internas
        this.textureNoise = []; // Para criar textura na superfície
        
        // Sistema de trilhas de movimento
        this.trailEnabled = true; // Controla se a trilha é desenhada
        this.trailPositions = []; // Armazena as últimas posições da bactéria
        this.trailMaxLength = 30; // Comprimento máximo da trilha
        this.trailUpdateFrequency = 3; // A cada quantos frames a trilha é atualizada
        this.trailOpacity = 0.6; // Opacidade base da trilha (0-1)
        this.trailWidth = 0.5; // Largura base da trilha em relação ao tamanho da bactéria
        
        // Cria ruído para textura
        for (let i = 0; i < 5; i++) {
            this.textureNoise.push({
                x: random(-0.3, 0.3),
                y: random(-0.3, 0.3),
                size: random(0.1, 0.25)
            });
        }
        
        // Para movimento ondular (bactérias em forma de espiral)
        this.waveSeed = random(0, 1000);
        this.waveFrequency = random(0.3, 0.8);
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
        
        // Atualiza a rotação para alguns tipos de bactérias
        if (this.bacteriaType === 2 || this.bacteriaType === 3) { // Espirilos e vibriões tendem a girar
            this.rotation += this.rotationSpeed;
        } else if (this.bacteria.movement && this.bacteria.movement.movement && 
                  this.bacteria.movement.movement.velocity) {
            // Para bacilos e cocos, a rotação segue a direção do movimento
            const vel = this.bacteria.movement.movement.velocity;
            if (vel.mag() > 0.1) {
                const targetAngle = vel.heading();
                // Rotação suave para a direção do movimento
                this.rotation = this.normalizeAngle(
                    lerp(this.normalizeAngle(this.rotation), targetAngle, 0.1)
                );
            }
        }
        
        // Atualiza a trilha de movimento
        this.updateTrail();
    }
    
    /**
     * Atualiza a trilha de movimento da bactéria
     */
    updateTrail() {
        if (!this.trailEnabled) return;
        
        // Atualiza a trilha a cada poucos frames para economizar recursos
        if (frameCount % this.trailUpdateFrequency !== 0) return;
        
        // Adiciona a posição atual ao início da trilha
        if (this.bacteria && this.bacteria.pos) {
            // Cria uma cópia da posição para evitar referências
            const currentPos = {
                x: this.bacteria.pos.x,
                y: this.bacteria.pos.y,
                age: 0, // Idade da posição na trilha (frames)
                size: this.bacteria.size * this.sizeMultiplier * 0.8, // Tamanho da bactéria no momento
                rotation: this.rotation, // Rotação da bactéria no momento
                color: this.getCurrentColor() // Cor atual da bactéria
            };
            
            this.trailPositions.unshift(currentPos);
            
            // Limita o comprimento da trilha
            if (this.trailPositions.length > this.trailMaxLength) {
                this.trailPositions.pop();
            }
            
            // Atualiza a idade de todas as posições da trilha
            for (let i = 0; i < this.trailPositions.length; i++) {
                this.trailPositions[i].age++;
            }
        }
    }
    
    /**
     * Obtém a cor atual da bactéria baseada no estado
     * @returns {p5.Color} Cor atual da bactéria
     */
    getCurrentColor() {
        // Cores base baseadas no sexo
        const baseColor = this.bacteria.isFemale ? 
            color(255, 150, 200) : // Rosa para fêmeas
            color(150, 200, 255);  // Azul para machos
            
        // Ajuste de cor se estiver infectada
        if (this.bacteria.isInfected) {
            return color(200, 150, 0); // Tom amarelado para indicar infecção
        }
        
        // Ajustes baseados no estado atual (se o gerenciador de estados estiver disponível)
        if (this.bacteria.stateManager) {
            const state = this.bacteria.stateManager.currentState;
            
            // Cores específicas por estado
            switch (state) {
                case "resting":
                    // Adiciona um tom azulado para descanso
                    return lerpColor(baseColor, color(100, 150, 200), 0.3);
                    
                case "fleeing":
                    // Vermelho para fuga
                    return lerpColor(baseColor, color(255, 0, 0), 0.7);
                    
                case "seekingFood":
                    // Verde para busca de comida
                    return lerpColor(baseColor, color(0, 255, 100), 0.3);
                    
                case "seekingMate":
                    // Roxo para busca de parceiro
                    return lerpColor(baseColor, color(200, 100, 255), 0.5);
                    
                case "exploring":
                    // Apenas intensifica a cor original para exploração
                    return lerpColor(baseColor, color(255), 0.1);
                    
                default:
                    return baseColor;
            }
        }
        
        return baseColor;
    }
    
    /**
     * Normaliza um ângulo para o intervalo [0, TWO_PI]
     * @param {number} angle - Ângulo a ser normalizado
     * @returns {number} Ângulo normalizado
     */
    normalizeAngle(angle) {
        while (angle < 0) angle += TWO_PI;
        while (angle > TWO_PI) angle -= TWO_PI;
        return angle;
    }
    
    /**
     * Desenha a bactéria
     */
    draw() {
        push(); // Salva o estado de transformação atual
        
        // Atualiza os efeitos visuais
        this.update();
        
        // Desenha a trilha de movimento da bactéria
        this.drawTrail();
        
        // Recupera posição da bactéria
        const x = this.bacteria.pos.x;
        const y = this.bacteria.pos.y;
        
        // Translada para a posição da bactéria
        translate(x, y);
        
        // Aplica rotação baseada na direção do movimento ou tipo de bactéria
        rotate(this.rotation);
        
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
            const minAlpha = 150; // Alfa mínimo para não ficar completamente invisível
            const alpha = map(energyRatio, 0, 1, minAlpha, 255);
            currentColor.setAlpha(alpha);
        }
        
        // Desenha flagelos (antes do corpo para ficarem por trás)
        this.drawFlagella(size, currentColor);
        
        // Desenha o corpo principal da bactéria de acordo com o tipo
        this.drawBacteriaBody(size, currentColor);
        
        // Adiciona estruturas internas
        this.drawInternalStructures(size, currentColor);
        
        // Desenha efeito de brilho/membrana
        this.drawMembrane(size, currentColor);
        
        // Desenha informações de debug se ativado
        if (this.showDebugInfo) {
            this.drawDebugInfo();
        }
        
        pop(); // Restaura estado de transformação
    }
    
    /**
     * Desenha a trilha de movimento da bactéria
     */
    drawTrail() {
        if (!this.trailEnabled || this.trailPositions.length < 2) return;
        
        // Desenha a trilha usando os pontos armazenados
        noFill();
        
        // Desenha a trilha do ponto mais antigo para o mais recente
        for (let i = this.trailPositions.length - 1; i > 0; i--) {
            const pos = this.trailPositions[i];
            const nextPos = this.trailPositions[i-1];
            
            if (!pos || !nextPos) continue;
            
            // Calcula a opacidade da trilha (diminui com a idade)
            const maxAge = this.trailMaxLength * this.trailUpdateFrequency;
            const opacity = map(pos.age, 0, maxAge, this.trailOpacity, 0);
            
            // Calcula a largura da trilha (diminui com a idade)
            const width = pos.size * this.trailWidth * map(pos.age, 0, maxAge, 1, 0.1);
            
            // Define a cor da trilha
            if (pos.color) {
                const trailColor = color(
                    red(pos.color),
                    green(pos.color),
                    blue(pos.color),
                    opacity * 255
                );
                stroke(trailColor);
            } else {
                // Trilha padrão se não houver cor armazenada
                stroke(200, 200, 255, opacity * 255);
            }
            
            // Define a largura da linha
            strokeWeight(width);
            
            // Desenha a linha entre os pontos da trilha
            line(pos.x, pos.y, nextPos.x, nextPos.y);
            
            // Ajuste para diferentes tipos de bactérias
            if (this.bacteriaType === 2) { // Espirilos - trilha em espiral
                // Adiciona pequenos círculos ao longo da trilha para dar efeito de espiral
                if (i % 3 === 0) {
                    noStroke();
                    fill(red(pos.color), green(pos.color), blue(pos.color), opacity * 80);
                    circle(pos.x, pos.y, width * 1.5);
                }
            } else if (this.bacteriaType === 3) { // Vibriões - trilha pontilhada
                // Adiciona intervalos na trilha para mostrar o movimento pulsante
                strokeWeight(0);
                if (i % 2 === 0) {
                    noStroke();
                    fill(red(pos.color), green(pos.color), blue(pos.color), opacity * 120);
                    circle(pos.x, pos.y, width * 0.8);
                }
            }
        }
    }
    
    /**
     * Desenha os flagelos da bactéria
     * @param {number} size - Tamanho da bactéria
     * @param {p5.Color} color - Cor base da bactéria
     */
    drawFlagella(size, baseColor) {
        if (this.flagellaCount === 0) return;
        
        // Cor do flagelo (mais transparente que o corpo)
        const flagellaColor = color(red(baseColor), green(baseColor), blue(baseColor), 120);
        stroke(flagellaColor);
        noFill();
        
        // Espessura do flagelo proporcional ao tamanho da bactéria
        const flagellaWidth = size * 0.05;
        strokeWeight(flagellaWidth);
        
        // Animação de ondulação
        const waveSpeed = 0.1;
        const wavePhase = frameCount * waveSpeed + this.flagellaPhase;
        
        // Comprimeto máximo do flagelo
        const maxLength = size * this.flagellaLength;
        
        // Desenha cada flagelo
        for (let i = 0; i < this.flagellaCount; i++) {
            // Ângulo do flagelo
            let angleOffset;
            
            // Distribuição dos flagelos depende do tipo de bactéria
            if (this.bacteriaType === 0 || this.bacteriaType === 2) { // Bacilos e espirilos
                // Flagelos nas extremidades
                angleOffset = i < this.flagellaCount/2 ? PI : 0;
            } else if (this.bacteriaType === 1) { // Cocos
                // Flagelos distribuídos radialmente
                angleOffset = (TWO_PI * i) / this.flagellaCount;
            } else { // Vibriões
                // Flagelos principalmente na curva
                angleOffset = PI/2 + (PI * i) / (this.flagellaCount);
            }
            
            // Ponto inicial do flagelo na borda da bactéria
            let xStart, yStart;
            
            if (this.bacteriaType === 0) { // Bacilo (formato alongado)
                xStart = cos(angleOffset) * (size * 0.5);
                yStart = sin(angleOffset) * (size * 0.25);
            } else if (this.bacteriaType === 1) { // Coco (formato redondo)
                xStart = cos(angleOffset) * (size * 0.5);
                yStart = sin(angleOffset) * (size * 0.5);
            } else if (this.bacteriaType === 2) { // Espirilo (formato espiral)
                xStart = cos(angleOffset) * (size * 0.6);
                yStart = sin(angleOffset) * (size * 0.2);
            } else { // Vibrião (formato em vírgula)
                xStart = cos(angleOffset) * (size * 0.3);
                yStart = sin(angleOffset) * (size * 0.3);
            }
            
            // Desenha o flagelo como uma curva ondulada
            beginShape();
            for (let t = 0; t <= 1; t += 0.05) {
                const segmentLength = t * maxLength;
                const xOffset = cos(angleOffset) * segmentLength;
                const waveOffset = sin(t * 10 + wavePhase) * this.flagellaAmplitude * size * t;
                const yOffset = sin(angleOffset) * segmentLength + waveOffset;
                
                vertex(xStart + xOffset, yStart + yOffset);
            }
            endShape();
        }
    }
    
    /**
     * Desenha o corpo principal da bactéria de acordo com o tipo
     * @param {number} size - Tamanho da bactéria
     * @param {p5.Color} color - Cor da bactéria
     */
    drawBacteriaBody(size, currentColor) {
        noStroke();
        fill(currentColor);
        
        switch (this.bacteriaType) {
            case 0: // Bacilo (formato cilíndrico/alongado)
                ellipse(0, 0, size, size * 0.5);
                break;
                
            case 1: // Coco (formato esférico)
                circle(0, 0, size);
                break;
                
            case 2: // Espirilo (formato em espiral)
                // Desenha uma forma espiral com vários segmentos
                beginShape();
                const spiralSegments = 12;
                for (let i = 0; i <= spiralSegments; i++) {
                    const t = i / spiralSegments;
                    const angle = t * PI * 2;
                    const radius = size * 0.4;
                    const xOffset = cos(angle) * radius * 0.3;
                    
                    // Adiciona uma ondulação baseada no tempo
                    const wavePhase = frameCount * 0.05 + this.waveSeed;
                    const waveOffset = sin(t * 8 + wavePhase) * size * 0.1;
                    
                    vertex(
                        (t - 0.5) * size,
                        sin(angle) * radius + waveOffset
                    );
                }
                endShape(CLOSE);
                break;
                
            case 3: // Vibrião (formato em vírgula/meia lua)
                // Desenha uma forma curvada
                beginShape();
                for (let i = 0; i <= 12; i++) {
                    const t = i / 12;
                    const angle = t * PI;
                    const xPos = cos(angle) * size * 0.4;
                    const yWidth = sin(t * PI) * size * 0.25;
                    const yPos = sin(angle) * size * 0.4 - yWidth;
                    vertex(xPos, yPos);
                }
                endShape(CLOSE);
                break;
        }
        
        // Adiciona texturas de ruído para dar um aspecto mais orgânico
        const darkColor = color(
            red(currentColor) * 0.7,
            green(currentColor) * 0.7,
            blue(currentColor) * 0.7,
            150
        );
        
        fill(darkColor);
        noStroke();
        
        // Desenha manchas de textura na superfície
        for (const noise of this.textureNoise) {
            const spotSize = size * noise.size;
            ellipse(noise.x * size, noise.y * size, spotSize, spotSize);
        }
    }
    
    /**
     * Desenha estruturas internas da bactéria
     * @param {number} size - Tamanho da bactéria
     * @param {p5.Color} color - Cor da bactéria
     */
    drawInternalStructures(size, currentColor) {
        // Cor das estruturas internas (mais claras que o corpo)
        const structureColor = color(
            min(255, red(currentColor) * 1.3),
            min(255, green(currentColor) * 1.3),
            min(255, blue(currentColor) * 1.3),
            200
        );
        
        fill(structureColor);
        noStroke();
        
        // Desenha estruturas internas (como DNA, ribossomos)
        for (let i = 0; i < this.innerStructures; i++) {
            // Posição da estrutura depende do tipo da bactéria
            let xPos, yPos;
            let structSize;
            
            switch (this.bacteriaType) {
                case 0: // Bacilo
                    xPos = map(i, 0, this.innerStructures-1, -size*0.3, size*0.3);
                    yPos = sin(i * PI / this.innerStructures) * size * 0.1;
                    structSize = size * 0.15;
                    break;
                    
                case 1: // Coco
                    const angle = (TWO_PI * i) / this.innerStructures;
                    xPos = cos(angle) * size * 0.2;
                    yPos = sin(angle) * size * 0.2;
                    structSize = size * 0.2;
                    break;
                    
                case 2: // Espirilo
                    xPos = map(i, 0, this.innerStructures-1, -size*0.4, size*0.4);
                    yPos = sin((i / this.innerStructures) * PI) * size * 0.1;
                    structSize = size * 0.1;
                    break;
                    
                case 3: // Vibrião
                    const t = i / (this.innerStructures-1);
                    const vibAngle = t * PI * 0.8;
                    xPos = cos(vibAngle) * size * 0.25;
                    yPos = sin(vibAngle) * size * 0.25;
                    structSize = size * 0.15;
                    break;
            }
            
            // Adiciona pulsação sutil para as estruturas internas
            const pulseFactor = 1 + sin(frameCount * 0.08 + i) * 0.1;
            circle(xPos, yPos, structSize * pulseFactor);
        }
    }
    
    /**
     * Desenha a membrana celular com efeito de brilho
     * @param {number} size - Tamanho da bactéria
     * @param {p5.Color} color - Cor base da bactéria
     */
    drawMembrane(size, baseColor) {
        // Efeito de brilho/membrana
        const glowColor = color(red(baseColor), green(baseColor), blue(baseColor), 30);
        
        // Tamanho da membrana externa
        const membraneSize = size * 1.1;
        
        // Desenha um contorno difuso para simular a membrana celular
        noFill();
        strokeWeight(size * 0.05);
        
        for (let i = 0; i < 3; i++) {
            const alpha = map(i, 0, 2, 80, 10);
            stroke(red(baseColor), green(baseColor), blue(baseColor), alpha);
            
            // O formato da membrana segue o formato do corpo
            if (this.bacteriaType === 0) { // Bacilo
                ellipse(0, 0, membraneSize * (1 + i*0.05), membraneSize * 0.5 * (1 + i*0.05));
            } else if (this.bacteriaType === 1) { // Coco
                circle(0, 0, membraneSize * (1 + i*0.05));
            } else if (this.bacteriaType === 2) { // Espirilo
                // Contorno da forma espiral
                beginShape();
                const spiralSegments = 12;
                for (let j = 0; j <= spiralSegments; j++) {
                    const t = j / spiralSegments;
                    const angle = t * PI * 2;
                    const radius = membraneSize * 0.4 * (1 + i*0.05);
                    const xOffset = cos(angle) * radius * 0.3;
                    
                    const wavePhase = frameCount * 0.05 + this.waveSeed;
                    const waveOffset = sin(t * 8 + wavePhase) * membraneSize * 0.1 * (1 + i*0.05);
                    
                    vertex(
                        (t - 0.5) * membraneSize * (1 + i*0.05),
                        sin(angle) * radius + waveOffset
                    );
                }
                endShape();
            } else { // Vibrião
                beginShape();
                for (let j = 0; j <= 12; j++) {
                    const t = j / 12;
                    const angle = t * PI;
                    const factor = 1 + i*0.05;
                    const xPos = cos(angle) * membraneSize * 0.4 * factor;
                    const yWidth = sin(t * PI) * membraneSize * 0.25 * factor;
                    vertex(xPos, sin(angle) * membraneSize * 0.4 * factor - yWidth);
                }
                endShape();
            }
        }
    }
    
    /**
     * Desenha informações de debug da bactéria
     */
    drawDebugInfo() {
        // Resetar transformações para desenhar texto corretamente
        resetMatrix();
        
        const x = this.bacteria.pos.x;
        const y = this.bacteria.pos.y;
        const size = this.bacteria.size;
        
        // Desenha linha de estado acima da bactéria
        textAlign(CENTER, BOTTOM);
        textSize(10);
        fill(255);
        stroke(0);
        strokeWeight(2);
        
        // Mostra estado atual e energia
        let stateText = "?";
        let energyValue = "?";
        
        if (this.bacteria.stateManager) {
            stateText = this.bacteria.stateManager.currentState || "?";
            energyValue = this.bacteria.stateManager.currentEnergy.toFixed(0) || "?";
        }
        
        text(`${stateText} [${energyValue}]`, x, y - size * 0.8);
        
        // Desenha ID da bactéria
        textSize(8);
        text(`ID:${this.bacteria.id}`, x, y - size * 0.5);
        
        // Resetar estilos
        noStroke();
    }
}

// Exporta a classe para uso global
window.BacteriaVisualizationComponent = BacteriaVisualizationComponent; 