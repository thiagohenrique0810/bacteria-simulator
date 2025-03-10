/**
 * Gerencia os estados e energia da bactéria
 */
class BacteriaStateManager {
    constructor() {
        this.energy = 100;
        this.currentState = window.BacteriaStates.EXPLORING;
    }

    /**
     * Obtém o estado atual
     * @returns {string} Estado atual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Define o estado atual
     * @param {string} state - Novo estado
     */
    setCurrentState(state) {
        this.currentState = state;
    }

    /**
     * Obtém o nível de energia atual
     * @returns {number} Nível de energia
     */
    getEnergy() {
        return this.energy;
    }

    /**
     * Adiciona energia
     * @param {number} amount - Quantidade de energia a adicionar
     */
    addEnergy(amount) {
        this.energy += amount;
        this.normalizeEnergy();
    }

    /**
     * Remove energia
     * @param {number} amount - Quantidade de energia a remover
     */
    removeEnergy(amount) {
        this.energy -= amount;
        this.normalizeEnergy();
    }

    /**
     * Normaliza o nível de energia entre 0 e 100
     */
    normalizeEnergy() {
        this.energy = constrain(this.energy, 0, 100);
    }

    /**
     * Calcula recompensa baseada no estado atual
     * @param {Object} conditions - Condições do ambiente
     * @returns {number} Valor da recompensa
     */
    calculateStateReward(conditions) {
        let reward = 0;

        switch (this.currentState) {
            case window.BacteriaStates.SEARCHING_FOOD:
                reward += conditions.foodNearby ? 1 : -0.5;
                break;
            case window.BacteriaStates.SEARCHING_MATE:
                reward += conditions.mateNearby ? 1 : -0.5;
                break;
            case window.BacteriaStates.RESTING:
                reward += this.energy < 50 ? 0.5 : -0.2;
                break;
            case window.BacteriaStates.FLEEING:
                reward += conditions.predatorNearby ? 1 : -1;
                break;
        }

        return reward;
    }
}

/**
 * Classe principal que representa uma bactéria
 */
class Bacteria {
    /**
     * Cria uma nova bactéria
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {Object} parentDNA - DNA dos pais (opcional)
     */
    constructor(x, y, parentDNA = null) {
        // Posição e tamanho
        this.pos = createVector(x, y);
        this.size = 20;

        // Inicializa DNA primeiro para ter acesso ao tempo de vida
        this.dna = new DNA(parentDNA);

        // Atributos básicos
        this.health = 100;
        this.age = 0;
        this.lifespan = this.dna.baseLifespan;
        this.lastMealTime = frameCount;
        this.healthLossRate = window.simulation ? window.simulation.controls.healthLossSlider.value() : 0.05;
        this.starvationTime = window.simulation ? window.simulation.controls.feedingIntervalSlider.value() * 60 * 60 : 30 * 60 * 60;
        this.isFemale = random() > 0.5;

        // Estado atual
        this.state = window.BacteriaStates.EXPLORING;

        // Inicializa sistemas
        this.movement = new Movement(this.pos.copy(), this.size);
        this.states = new BacteriaStateManager(); // Sistema de estados
        this.reproduction = new Reproduction(this.isFemale);
        this.reproduction.setDNA(this.dna);
        this.visualization = new BacteriaVisualization({
            size: this.size,
            isFemale: this.isFemale
        });

        // Raio de percepção
        this.perceptionRadius = 150;

        // Sistema de aprendizado
        this.qLearning = {
            qTable: {},
            learningRate: 0.1,
            discountFactor: 0.9,
            lastState: null,
            lastAction: null,
            actions: ['explore', 'seekFood', 'seekMate', 'rest']
        };

        // Sistema Neural
        this.brain = new NeuralNetwork();
        this.useNeural = true; // Flag para alternar entre Q-Learning e Rede Neural
        this.lastNeuralInputs = null;
        this.lastNeuralOutputs = null;
    }

    /**
     * Normaliza os inputs para a rede neural
     * @param {Object} conditions - Condições do ambiente
     * @returns {Array} - Array normalizado de inputs
     */
    normalizeInputs(conditions) {
        return [
            this.health / 100, // Saúde normalizada
            this.states.getEnergy() / 100, // Energia normalizada
            conditions.foodNearby ? 1 : 0, // Comida próxima
            conditions.mateNearby ? 1 : 0, // Parceiro próximo
            conditions.predatorNearby ? 1 : 0, // Predador próximo
            this.age / this.lifespan // Idade normalizada
        ];
    }

    /**
     * Escolhe uma ação usando a rede neural
     * @param {Array} inputs - Inputs normalizados
     * @returns {string} - Ação escolhida
     */
    chooseNeuralAction(inputs) {
        const outputs = this.brain.predict(inputs);
        this.lastNeuralInputs = inputs;
        this.lastNeuralOutputs = outputs;

        // Encontra o índice da maior probabilidade
        let maxIndex = 0;
        for (let i = 1; i < outputs.length; i++) {
            if (outputs[i] > outputs[maxIndex]) {
                maxIndex = i;
            }
        }

        // Mapeia o índice para uma ação
        return this.qLearning.actions[maxIndex];
    }

    /**
     * Atualiza o estado da bactéria
     * @param {Array} food - Lista de comida disponível
     * @param {Array} predators - Lista de predadores
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Array} others - Lista de outras bactérias
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(food, predators, obstacles, others, deltaTime = 1/60) {
        // Garante que os parâmetros são arrays válidos
        food = Array.isArray(food) ? food : [];
        predators = Array.isArray(predators) ? predators : [];
        obstacles = Array.isArray(obstacles) ? obstacles.filter(o => o instanceof window.Obstacle) : [];
        others = Array.isArray(others) ? others : [];

        // Atualiza idade e saúde
        this.age += deltaTime;
        this.updateHealth(deltaTime);

        // Verifica se está morta
        if (this.isDead()) {
            return null;
        }

        // Avalia ambiente e escolhe ação
        let inputs = this.evaluateEnvironment(food, predators, others);
        let action = this.chooseAction(inputs);
        
        // Atualiza estado com base na ação
        this.updateState(action);
        
        // Atualiza movimento com base no estado atual
        this.movement.update(
            this.age / this.lifespan,
            obstacles,
            this.size,
            this.states.getCurrentState() === window.BacteriaStates.RESTING,
            deltaTime
        );

        // Atualiza posição
        this.pos = this.movement.position;

        // Mantém separação de outras bactérias
        this.movement.separate(others, this.size * 2);

        // Procura comida se estiver com fome
        if (this.states.getCurrentState() === window.BacteriaStates.SEARCHING_FOOD) {
            this.findFood(food);
        }

        // Procura parceiro se estiver procurando
        if (this.states.getCurrentState() === window.BacteriaStates.SEARCHING_MATE) {
            this.findMate(others);
        }

        // Atualiza sistema de aprendizado
        this.updateLearning(inputs, action);

        // Verifica reprodução - só cria filho se for fêmea e estiver grávida
        if (this.isFemale) {
            let childDNA = this.reproduction.update();
            if (childDNA) {
                // Cria o filho com DNA combinado dos pais
                const child = new Bacteria(this.pos.x, this.pos.y, childDNA);
                if (window.simulation) {
                    window.simulation.stats.naturalBirths++;
                }
                return child;
            }
        } else {
            // Se for macho, apenas atualiza o sistema de reprodução
            this.reproduction.update();
        }

        // Atualiza visualização
        this.visualization.update({
            health: this.health,
            agePercentage: this.age / this.lifespan,
            currentBehavior: this.states.getCurrentState(),
            isPregnant: this.reproduction.isPregnant,
            isCourting: this.reproduction.isCourting()
        });

        return null;
    }

    /**
     * Avalia as condições do ambiente
     * @param {Array} foods - Lista de comidas
     * @param {Array} predators - Lista de predadores
     * @param {Array} others - Lista de outras bactérias
     * @returns {Object} - Condições do ambiente
     */
    evaluateEnvironment(foods, predators, others) {
        const conditions = {
            foodNearby: false,
            mateNearby: false,
            predatorNearby: false
        };

        // Verifica se foods é um array válido
        if (Array.isArray(foods)) {
            for (let food of foods) {
                if (food && food.position) {
                    let d = dist(this.pos.x, this.pos.y, food.position.x, food.position.y);
                    if (d < this.perceptionRadius) {
                        conditions.foodNearby = true;
                        break;
                    }
                }
            }
        }

        // Verifica se predators é um array válido
        if (Array.isArray(predators)) {
            const predator = this.findClosestPredator(predators);
            if (predator) {
                conditions.predatorNearby = true;
            }
        }

        // Verifica se others é um array válido
        if (Array.isArray(others)) {
            for (let other of others) {
                if (other && other !== this && !other.isPredator) {
                    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                    if (d < this.perceptionRadius && 
                        other.isFemale !== this.isFemale && 
                        other.states && other.states.getEnergy() > 70) {
                        conditions.mateNearby = true;
                        break;
                    }
                }
            }
        }

        return conditions;
    }

    /**
     * Atualiza o movimento baseado nas ações do estado
     * @param {Object} stateActions - Ações recomendadas pelo estado atual
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Array} foods - Lista de comidas
     * @param {Array} others - Lista de outras bactérias
     * @param {number} deltaTime - Tempo desde a última atualização (em segundos)
     */
    updateMovementFromState(stateActions, obstacles, foods, others, deltaTime = 1/60) {
        if (!stateActions.shouldMove) {
            this.movement.stop();
            return;
        }

        this.movement.resume();
        let target = null;
        let perception = this.perceptionRadius;

        switch (stateActions.targetType) {
            case 'food':
                target = this.findClosestFood(foods);
                perception *= 1.2; // Aumenta percepção para comida
                break;
            case 'mate':
                target = this.findMate(others);
                perception *= 1.5; // Aumenta percepção para parceiros
                break;
            case 'escape':
                const predator = this.findClosestPredator(others);
                if (predator) {
                    // Foge na direção oposta ao predador
                    const escapeVector = p5.Vector.sub(this.pos, predator.pos);
                    escapeVector.normalize();
                    escapeVector.mult(this.perceptionRadius);
                    target = p5.Vector.add(this.pos, escapeVector);
                    
                    // Gasta mais energia ao fugir
                    this.states.removeEnergy(0.2);
                }
                perception *= 1.3; // Aumenta percepção para fuga
                break;
            case 'random':
                if (random() < 0.02) {
                    target = createVector(
                        random(width * 0.8),
                        random(height)
                    );
                }
                break;
        }

        this.movement.update(
            this.age / this.lifespan,
            obstacles,
            this.size,
            false
        );

        if (target) {
            this.movement.seek(target, perception, stateActions.speedMultiplier);
        }

        // Ajusta a separação baseado no estado
        let separationDistance = this.size * 1.5;
        if (stateActions.state === 'reproducing') {
            separationDistance *= 0.8; // Reduz separação durante reprodução
        } else if (stateActions.state === 'fleeing') {
            separationDistance *= 1.5; // Aumenta separação durante fuga
        }

        this.movement.separate(others, separationDistance);
    }

    /**
     * Encontra o predador mais próximo
     * @param {Array} others - Lista de outras bactérias
     * @returns {Bacteria|null} - Predador mais próximo ou null
     */
    findClosestPredator(others) {
        let closest = null;
        let minDist = this.perceptionRadius;

        for (let other of others) {
            if (other.isPredator) {
                const d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d < minDist) {
                    minDist = d;
                    closest = other;
                }
            }
        }

        return closest;
    }

    /**
     * Atualiza a saúde da bactéria
     * @param {number} deltaTime - Tempo desde a última atualização (em segundos)
     */
    updateHealth(deltaTime = 1/60) {
        // Perde saúde ao longo do tempo
        this.health -= this.healthLossRate * deltaTime * 60;

        // Verifica fome
        const timeSinceLastMeal = frameCount - this.lastMealTime;
        if (timeSinceLastMeal > this.starvationTime) {
            this.health -= (0.1 * deltaTime * 60); // Dano por fome ajustado pelo deltaTime
        }

        // Limita a saúde entre 0 e 100
        this.health = constrain(this.health, 0, 100);
    }

    /**
     * Encontra a comida mais próxima
     * @param {Array} foods - Lista de comidas
     * @returns {p5.Vector|null} - Posição da comida mais próxima
     */
    findClosestFood(foods) {
        let closest = null;
        let minDist = Infinity;

        for (let food of foods) {
            let d = dist(this.pos.x, this.pos.y, food.position.x, food.position.y);
            if (d < minDist) {
                minDist = d;
                closest = food.position;
            }
        }

        return closest;
    }

    /**
     * Encontra um parceiro para acasalamento
     * @param {Array} others - Lista de outras bactérias
     * @returns {p5.Vector|null} - Posição do parceiro
     */
    findMate(others) {
        let closest = null;
        let minDist = Infinity;

        for (let other of others) {
            if (other !== this && 
                other.reproduction.canMateNow() && 
                other.isFemale !== this.isFemale &&
                other.health >= 70) { // Só considera parceiros saudáveis
                let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d < minDist) {
                    minDist = d;
                    closest = other.pos;
                }
            }
        }

        return closest;
    }

    /**
     * Verifica se a bactéria está com fome
     * @returns {boolean} - Se a bactéria está com fome
     */
    isHungry() {
        // Considera com fome se a saúde estiver abaixo de 85 ou se estiver há muito tempo sem comer
        return this.health < 85 || (frameCount - this.lastMealTime > this.starvationTime * 0.5);
    }

    /**
     * Tenta comer uma comida
     * @param {Object} food - Objeto comida a ser consumido
     * @returns {boolean} - Se conseguiu comer a comida
     */
    eat(food) {
        // Só come se estiver com fome
        if (!this.isHungry()) {
            return false;
        }

        // Limita o ganho de saúde para não ultrapassar 100
        const healthGain = Math.min(food.nutrition, 100 - this.health);
        this.health += healthGain;
        
        // Atualiza o tempo da última refeição
        this.lastMealTime = frameCount;
        
        // Adiciona energia proporcional ao valor nutricional
        const energyGain = food.nutrition * 2.5;
        
        // Bônus de energia se estiver com pouca saúde
        if (this.health < 50) {
            this.states.addEnergy(energyGain * 1.2);
        } else {
            this.states.addEnergy(energyGain);
        }
        
        // Garante que a saúde está dentro dos limites
        this.health = constrain(this.health, 0, 100);

        return true;
    }

    /**
     * Tenta acasalar com outra bactéria
     * @param {Bacteria} other - Outra bactéria
     * @returns {boolean} - Se o acasalamento foi bem sucedido
     */
    mate(other) {
        if (this.states.getEnergy() > 70 && other.states.getEnergy() > 70) {
            this.states.removeEnergy(30); // Gasta energia no acasalamento
            return this.reproduction.mate(other.reproduction);
        }
        return false;
    }

    /**
     * Verifica se a bactéria está morta
     * @returns {boolean} - Se a bactéria está morta
     */
    isDead() {
        return this.health <= 0 || this.age >= this.lifespan || this.states.getEnergy() <= 0;
    }

    /**
     * Desenha a bactéria
     */
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.movement.velocity.heading());

        // Desenha o corpo principal (forma de bastonete)
        const bodyLength = this.size * 1.5;
        const bodyWidth = this.size * 0.6;
        
        // Cor base da bactéria com transparência
        const baseColor = this.isFemale ? color(255, 182, 193) : color(173, 216, 230);
        
        // Desenha sombra
        noStroke();
        fill(0, 30);
        ellipse(2, 2, bodyLength, bodyWidth);

        // Desenha o corpo principal
        stroke(0, 50);
        strokeWeight(0.5);
        fill(baseColor);
        ellipse(0, 0, bodyLength, bodyWidth);

        // Adiciona textura interna (citoplasma)
        noStroke();
        for (let i = 0; i < 8; i++) {
            const x = random(-bodyLength/4, bodyLength/4);
            const y = random(-bodyWidth/4, bodyWidth/4);
            const size = random(2, 4);
            fill(red(baseColor) - 20, green(baseColor) - 20, blue(baseColor) - 20, 150);
            ellipse(x, y, size, size);
        }

        // Desenha membrana celular
        noFill();
        stroke(0, 100);
        strokeWeight(0.8);
        ellipse(0, 0, bodyLength, bodyWidth);

        // Desenha flagelos (cílios)
        stroke(0, 150);
        strokeWeight(0.5);
        const numFlagella = 6;
        const flagellaLength = this.size * 0.8;
        for (let i = 0; i < numFlagella; i++) {
            const angle = (i / numFlagella) * TWO_PI;
            const x1 = (bodyLength/2) * cos(angle);
            const y1 = (bodyWidth/2) * sin(angle);
            const x2 = x1 + flagellaLength * cos(angle + sin(frameCount * 0.1 + i) * 0.5);
            const y2 = y1 + flagellaLength * sin(angle + sin(frameCount * 0.1 + i) * 0.5);
            
            beginShape();
            for (let t = 0; t <= 1; t += 0.1) {
                const x = bezierPoint(x1, x1 + random(-2, 2), x2 + random(-2, 2), x2, t);
                const y = bezierPoint(y1, y1 + random(-2, 2), y2 + random(-2, 2), y2, t);
                curveVertex(x, y);
            }
            endShape();
        }

        // Indicador de energia
        if (window.simulation?.showEnergy) {
            const energyPercentage = this.states.getEnergy() / 100;
            const energyBarWidth = this.size * 1.2;
            const energyBarHeight = 3;
            
            // Barra de fundo
            fill(0, 100);
            noStroke();
            rect(-energyBarWidth/2, -this.size/1.5, energyBarWidth, energyBarHeight);
            
            // Barra de energia
            fill(lerpColor(color(255, 0, 0), color(0, 255, 0), energyPercentage));
            rect(-energyBarWidth/2, -this.size/1.5, energyBarWidth * energyPercentage, energyBarHeight);
        }

        // Efeito de brilho quando saudável
        if (this.health > 80) {
            const glowSize = this.size * 1.2;
            const glowColor = color(255, 255, 255, 30);
            noStroke();
            fill(glowColor);
            ellipse(0, 0, glowSize, glowSize * 0.7);
        }

        pop();
    }

    /**
     * Calcula a recompensa para o Q-Learning
     * @returns {number} - Valor da recompensa
     */
    calculateReward() {
        let reward = 0;

        // Recompensa baseada na saúde
        if (this.health > 80) reward += 1;
        else if (this.health < 30) reward -= 1;

        // Recompensa baseada na energia
        if (this.states.getEnergy() > 70) reward += 0.5;
        else if (this.states.getEnergy() < 30) reward -= 0.5;

        // Recompensa por estar vivo
        reward += 0.1;

        // Penalidade por estar muito tempo sem comer
        if (frameCount - this.lastMealTime > this.starvationTime) {
            reward -= 1;
        }

        // Recompensa adicional do sistema de estados
        reward += this.states.calculateStateReward({
            foodNearby: this.nearFood,
            mateNearby: this.nearMate,
            predatorNearby: false
        });

        return reward;
    }

    /**
     * Atualiza a Q-Table com base na experiência
     * @param {Object} state - Estado anterior
     * @param {string} action - Ação tomada
     * @param {number} reward - Recompensa recebida
     * @param {Object} nextState - Próximo estado
     */
    updateQTable(state, action, reward, nextState) {
        const stateKey = JSON.stringify(state);
        const nextStateKey = JSON.stringify(nextState);

        // Inicializa valores se necessário
        if (!this.qLearning.qTable[stateKey]) {
            this.qLearning.qTable[stateKey] = {};
            for (let a of this.qLearning.actions) {
                this.qLearning.qTable[stateKey][a] = 0;
            }
        }

        if (!this.qLearning.qTable[nextStateKey]) {
            this.qLearning.qTable[nextStateKey] = {};
            for (let a of this.qLearning.actions) {
                this.qLearning.qTable[nextStateKey][a] = 0;
            }
        }

        // Calcula o valor máximo do próximo estado
        const maxNextQ = Math.max(...Object.values(this.qLearning.qTable[nextStateKey]));

        // Atualiza o valor Q
        const oldQ = this.qLearning.qTable[stateKey][action];
        this.qLearning.qTable[stateKey][action] = oldQ + 
            this.qLearning.learningRate * (reward + this.qLearning.discountFactor * maxNextQ - oldQ);
    }

    /**
     * Escolhe uma ação baseada na política epsilon-greedy
     * @param {Object} state - Estado atual
     * @returns {string} - Ação escolhida
     */
    chooseAction(state) {
        const stateKey = JSON.stringify(state);
        
        // Inicializa valores Q para o estado se necessário
        if (!this.qLearning.qTable[stateKey]) {
            this.qLearning.qTable[stateKey] = {};
            for (let action of this.qLearning.actions) {
                this.qLearning.qTable[stateKey][action] = 0;
            }
        }

        // Epsilon-greedy: 10% de chance de exploração
        if (random() < 0.1) {
            return random(this.qLearning.actions);
        }

        // Encontra a ação com maior valor Q
        let bestAction = this.qLearning.actions[0];
        let maxQ = this.qLearning.qTable[stateKey][bestAction];

        for (let action of this.qLearning.actions) {
            if (this.qLearning.qTable[stateKey][action] > maxQ) {
                maxQ = this.qLearning.qTable[stateKey][action];
                bestAction = action;
            }
        }

        return bestAction;
    }

    /**
     * Cria um filho combinando DNA e redes neurais
     * @param {Bacteria} other - Outra bactéria
     * @returns {Object} - DNA e rede neural do filho
     */
    createOffspring(other) {
        // Combina DNA
        const childDNA = this.dna.combine(other.dna);
        
        // Combina redes neurais
        const childBrain = this.brain.crossover(other.brain);
        
        // Chance de mutação
        if (random() < 0.1) {
            childBrain.mutationRate = 0.2; // Aumenta taxa de mutação temporariamente
        }
        
        return { dna: childDNA, brain: childBrain };
    }

    /**
     * Limpa recursos ao remover a bactéria
     */
    dispose() {
        if (this.brain) {
            this.brain.dispose();
        }
    }

    /**
     * Atualiza o estado da bactéria com base na ação escolhida
     * @param {string} action - Ação escolhida ('explore', 'seekFood', 'seekMate', 'rest')
     */
    updateState(action) {
        // Atualiza o estado com base na ação
        switch (action) {
            case 'explore':
                this.states.setCurrentState(window.BacteriaStates.EXPLORING);
                // Gasta energia ao explorar
                this.states.removeEnergy(0.1);
                break;
            
            case 'seekFood':
                this.states.setCurrentState(window.BacteriaStates.SEARCHING_FOOD);
                // Gasta mais energia ao procurar comida ativamente
                this.states.removeEnergy(0.15);
                break;
            
            case 'seekMate':
                this.states.setCurrentState(window.BacteriaStates.SEARCHING_MATE);
                // Gasta energia ao procurar parceiro
                this.states.removeEnergy(0.2);
                break;
            
            case 'rest':
                this.states.setCurrentState(window.BacteriaStates.RESTING);
                // Recupera energia ao descansar
                this.states.addEnergy(0.3);
                break;
            
            default:
                this.states.setCurrentState(window.BacteriaStates.EXPLORING);
                this.states.removeEnergy(0.1);
        }
    }

    /**
     * Atualiza o sistema de aprendizado
     * @param {Object} inputs - Condições do ambiente
     * @param {string} action - Ação tomada
     */
    updateLearning(inputs, action) {
        // Calcula a recompensa baseada no estado atual
        const reward = this.calculateReward();

        // Se estiver usando rede neural
        if (this.useNeural && this.lastNeuralInputs) {
            // Treina a rede neural com a experiência anterior
            const target = Array(this.qLearning.actions.length).fill(0);
            target[this.qLearning.actions.indexOf(action)] = reward;
            
            // Atualiza os pesos da rede
            this.brain.mutate();
        } else {
            // Atualiza Q-Table se houver estado anterior
            if (this.qLearning.lastState) {
                this.updateQTable(
                    this.qLearning.lastState,
                    this.qLearning.lastAction,
                    reward,
                    inputs
                );
            }
        }

        // Armazena estado e ação atual para próxima atualização
        this.qLearning.lastState = inputs;
        this.qLearning.lastAction = action;
    }

    /**
     * Procura e tenta comer comida próxima
     * @param {Array} foods - Lista de comidas disponíveis
     */
    findFood(foods) {
        if (!Array.isArray(foods)) return;

        for (let food of foods) {
            if (!food || !food.position) continue;

            const d = dist(this.pos.x, this.pos.y, food.position.x, food.position.y);
            if (d < this.size/2 + food.size/2) {
                if (this.eat(food)) {
                    // Adiciona energia ao encontrar comida
                    this.states.addEnergy(20);
                    return true;
                }
            } else if (d < this.perceptionRadius) {
                // Se a comida está dentro do raio de percepção, move em direção a ela
                const desired = p5.Vector.sub(food.position, this.pos);
                desired.normalize();
                desired.mult(4); // Velocidade máxima
                this.movement.seek(food.position, this.perceptionRadius, 1.2);
            }
        }
        return false;
    }
}

// Tornando a classe global
window.Bacteria = Bacteria;
window.BacteriaStateManager = BacteriaStateManager; 