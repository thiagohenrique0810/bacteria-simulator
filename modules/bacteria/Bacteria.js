/**
 * Atualiza a bactéria no ciclo de animação
 * @param {Array} obstacles - Obstáculos no ambiente
 * @param {Array} bacteria - Outras bactérias no ambiente
 * @param {Array} food - Comida disponível no ambiente
 * @param {Array} predators - Predadores no ambiente
 */
update(obstacles = [], bacteria = [], food = [], predators = []) {
    try {
        if (this.isDead) return;
        
        // Incrementa a idade da bactéria
        this.age++;
        
        // Verifica se a bactéria atingiu o fim de sua vida útil
        if (this.age >= this.lifespan) {
            this.die("Morte natural (velhice)");
            return;
        }
        
        // Verificar se a posição é válida, corrigindo se necessário
        this.validatePosition();
        
        // Garantir que existe um objeto environment para análise
        const environmentData = { 
            nearbyBacteria: bacteria.filter(b => b !== this).slice(0, 10), // Limita para os 10 mais próximos por desempenho
            nearbyFood: food.slice(0, 10),
            nearbyPredators: predators.slice(0, 5),
            obstacles: obstacles || []
        };
        
        // Atualiza o sistema de estados se disponível
        if (this.stateManager) {
            try {
                this.stateManager.update();
            } catch (err) {
                console.error("Erro ao atualizar estados da bactéria:", err);
            }
        }
        
        // Obtém informações e ações do estado atual
        const stateInfo = this.getStateActions ? this.getStateActions() : { shouldMove: true };
        
        // Atualiza o movimento baseado no estado atual e no ambiente
        if (this.movement) {
            try {
                this.movement.update(stateInfo, environmentData);
                
                // Garante que a posição seja atualizada
                if (this.movement.movement && this.movement.movement.position) {
                    this.pos.x = this.movement.movement.position.x;
                    this.pos.y = this.movement.movement.position.y;
                } else if (typeof this.movement.update === 'function') {
                    // Tenta usar a função update alternativa
                    this.movement.update();
                    if (this.movement.movement && this.movement.movement.position) {
                        this.pos.x = this.movement.movement.position.x;
                        this.pos.y = this.movement.movement.position.y;
                    }
                }
            } catch (err) {
                console.error("Erro ao atualizar movimento:", err);
                
                // Fallback: move aleatoriamente se o movimento falhar
                if (this.movement && typeof this.movement.moveRandom === 'function') {
                    this.movement.moveRandom(1);
                } else {
                    // Movimento básico de emergência para garantir que a bactéria se mova
                    if (!this.emergency_velocity) {
                        this.emergency_velocity = createVector(random(-2, 2), random(-2, 2));
                    }
                    this.pos.add(this.emergency_velocity);
                }
            }
        }
        
        // Valida a posição após atualização do movimento
        this.validatePosition();
        
        // Mantém dentro dos limites da tela
        this.constrainToBounds();
        
        // Atualiza a energia e verifica morte por inanição
        if (this.stateManager) {
            const energyDecrement = this.calculateEnergyConsumption ? this.calculateEnergyConsumption() : 0.1;
            this.stateManager.decrementEnergy(energyDecrement);
            
            if (this.stateManager.currentEnergy <= 0) {
                this.die("Morte por inanição");
                return;
            }
        }
        
        // Atualiza a reprodução
        if (this.reproduction) {
            this.reproduction.update();
        }
        
        // Log periódico para debug
        if (frameCount % 100 === 0 && this.id % 10 === 0) {
            console.log(`Bactéria ${this.id} atualizada: pos=(${this.pos.x.toFixed(1)},${this.pos.y.toFixed(1)})`);
        }
    } catch (error) {
        console.error("Erro no update da bactéria:", error);
    }
}

/**
 * Valida e corrige a posição da bactéria se necessário
 */
validatePosition() {
    if (!this.pos) return;
    
    try {
        // Verifica se as coordenadas são NaN
        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.warn(`Posição inválida (NaN) detectada na bactéria ${this.id}. Corrigindo...`);
            
            // Corrige para uma posição aleatória válida
            if (isNaN(this.pos.x)) this.pos.x = random(width);
            if (isNaN(this.pos.y)) this.pos.y = random(height);
            
            // Se tiver sistema de movimento, sincroniza a posição
            if (this.movement && typeof this.movement.syncPosition === 'function') {
                this.movement.syncPosition();
            }
        }
        
        // Log para depuração
        if (frameCount % 240 === 0) {
            console.log(`Bactéria ${this.id}: pos=${this.pos.x.toFixed(1)},${this.pos.y.toFixed(1)}, 
                            state=${this.stateManager ? this.stateManager.currentState : "N/A"}`);
        }
    } catch (error) {
        console.error("Erro ao validar posição:", error);
        // Reseta para posição segura em caso de erro grave
        this.pos = createVector(random(width), random(height));
    }
}

/**
 * Mantém a bactéria dentro dos limites da tela
 */
constrainToBounds() {
    if (!this.pos) return;
    
    try {
        // Recupera dimensões do mundo
        const worldWidth = typeof width !== 'undefined' ? width : 800;
        const worldHeight = typeof height !== 'undefined' ? height : 600;
        
        // Determina o raio da bactéria para evitar que fique parcialmente fora da tela
        const radius = typeof this.size === 'number' ? this.size / 2 : 10;
        
        // Calcula limites seguros
        const minX = radius;
        const maxX = worldWidth - radius;
        const minY = radius;
        const maxY = worldHeight - radius;
        
        // Restringe a posição
        const wasClamped = 
            this.pos.x < minX || 
            this.pos.x > maxX || 
            this.pos.y < minY || 
            this.pos.y > maxY;
        
        // Aplica os limites
        this.pos.x = constrain(this.pos.x, minX, maxX);
        this.pos.y = constrain(this.pos.y, minY, maxY);
        
        // Se a posição foi alterada e há sistema de movimento, sincroniza
        if (wasClamped && this.movement && this.movement.movement && this.movement.movement.position) {
            this.movement.movement.position.x = this.pos.x;
            this.movement.movement.position.y = this.pos.y;
            
            // Inverte a velocidade para criar efeito de ricochete
            if (this.movement.movement.velocity) {
                if (this.pos.x === minX || this.pos.x === maxX) {
                    this.movement.movement.velocity.x *= -0.8;
                }
                if (this.pos.y === minY || this.pos.y === maxY) {
                    this.movement.movement.velocity.y *= -0.8;
                }
            }
        }
    } catch (error) {
        console.error("Erro ao restringir aos limites:", error);
    }
}

/**
 * Obtém as ações do estado atual da bactéria
 * @returns {Object} Objeto com informações sobre as ações do estado atual
 */
getStateActions() {
    // Inicializa um objeto padrão para o caso de não haver gerenciador de estados
    const defaultActions = {
        shouldMove: true,
        speedMultiplier: 1.0,
        targetType: 'random',
        target: null
    };
    
    try {
        // Verifica se o gerenciador de estados existe e tem o método necessário
        if (this.stateManager && typeof this.stateManager.getCurrentActions === 'function') {
            return this.stateManager.getCurrentActions() || defaultActions;
        }
        
        // Retorna ações padrão se não houver gerenciador
        return defaultActions;
    } catch (error) {
        console.error("Erro ao obter ações do estado:", error);
        return defaultActions;
    }
}

/**
 * Calcula o consumo de energia com base no estado e atividade atual
 * @returns {number} Quantidade de energia a ser consumida neste frame
 */
calculateEnergyConsumption() {
    try {
        // Taxa base de consumo de energia
        let baseConsumption = 0.1;
        
        // Fatores modificadores
        let stateMultiplier = 1.0;
        let sizeMultiplier = 1.0;
        let dnaMultiplier = 1.0;
        
        // Modificador por estado se disponível
        if (this.stateManager && this.stateManager.currentState) {
            switch (this.stateManager.currentState) {
                case 'exploring':
                    stateMultiplier = 1.0;
                    break;
                case 'seekingFood':
                    stateMultiplier = 1.2;
                    break;
                case 'reproducing':
                    stateMultiplier = 1.5;
                    break;
                case 'fleeing':
                    stateMultiplier = 2.0;
                    break;
                case 'resting':
                    stateMultiplier = 0.5;
                    break;
                default:
                    stateMultiplier = 1.0;
            }
        }
        
        // Modificador por tamanho (bactérias maiores gastam mais energia)
        if (typeof this.size === 'number' && this.size > 0) {
            sizeMultiplier = this.size / 20; // Normalizado para tamanho 20
        }
        
        // Modificador por genes se disponível
        if (this.dna && this.dna.genes) {
            // Metabolismo influencia no consumo de energia
            const metabolism = typeof this.dna.genes.metabolism === 'number' ? 
                              this.dna.genes.metabolism : 0.5;
                              
            // Metabolismo alto significa consumo mais eficiente (menor)
            dnaMultiplier = 1 - (metabolism * 0.4); // Range: 0.6 a 1.0
            
            // Garante um multiplicador mínimo para evitar consumo zero
            dnaMultiplier = Math.max(0.2, dnaMultiplier);
        }
        
        // Calcula consumo final
        const energyConsumption = baseConsumption * stateMultiplier * sizeMultiplier * dnaMultiplier;
        
        // Garante um valor não-negativo e finito
        return Math.max(0, isFinite(energyConsumption) ? energyConsumption : 0.1);
    } catch (error) {
        console.error("Erro ao calcular consumo de energia:", error);
        return 0.1; // Valor padrão em caso de erro
    }
} 