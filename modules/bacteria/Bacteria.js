/**
 * Atualiza a bactéria no ciclo de animação
 * @param {Array} obstacles - Obstáculos no ambiente
 * @param {Array} bacteria - Outras bactérias no ambiente
 * @param {Array} food - Comida disponível no ambiente
 * @param {Array} predators - Predadores no ambiente
 */
update(obstacles, bacteria, food, predators) {
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
        
        // Atualiza o sistema de estados se disponível
        if (this.stateManager) {
            try {
                this.stateManager.update();
            } catch (err) {
                console.error("Erro ao atualizar estados da bactéria:", err);
            }
        }
        
        // Obtém informações e ações do estado atual
        const stateInfo = this.getStateActions();
        
        // Analisa o ambiente para identificar alvos (se o método existir)
        let environmentData = {};
        if (typeof this.analyzeEnvironment === 'function') {
            try {
                environmentData = this.analyzeEnvironment(bacteria, food, predators, obstacles);
            } catch (err) {
                console.error("Erro ao analisar ambiente:", err);
                // Cria um objeto vazio para não quebrar o fluxo
                environmentData = { 
                    nearbyBacteria: [],
                    nearbyFood: [],
                    nearbyPredators: [],
                    obstacles: obstacles || []
                };
            }
        } else {
            // Fallback caso o método não exista
            environmentData = { 
                nearbyBacteria: [],
                nearbyFood: [],
                nearbyPredators: [],
                obstacles: obstacles || []
            };
        }
        
        // Atualiza o movimento baseado no estado atual e no ambiente
        if (this.movement) {
            try {
                this.movement.update(stateInfo, environmentData);
                
                // Garante que a posição seja atualizada
                if (this.movement.movement && this.movement.movement.position) {
                    this.pos.x = this.movement.movement.position.x;
                    this.pos.y = this.movement.movement.position.y;
                }
            } catch (err) {
                console.error("Erro ao atualizar movimento:", err);
                
                // Fallback: move aleatoriamente se o movimento falhar
                if (this.movement && typeof this.movement.moveRandom === 'function') {
                    this.movement.moveRandom(1);
                }
            }
        }
        
        // Valida a posição após atualização do movimento
        this.validatePosition();
        
        // Mantém dentro dos limites da tela
        this.constrainToBounds();
        
        // Atualiza a energia e verifica morte por inanição
        if (this.stateManager) {
            const energyDecrement = this.calculateEnergyConsumption();
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
        
        // Atualiza o ciclo de alimentação
        if (this.feeding) {
            this.feeding.update(food);
        }
        
        // Processa colisões com comida, se tiver método de alimentação
        if (this.feeding && typeof this.feeding.checkForFood === 'function') {
            this.feeding.checkForFood(food);
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