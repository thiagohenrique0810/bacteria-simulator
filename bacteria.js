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

        // Inicializa sistemas
        this.movement = new Movement(this.pos.copy(), this.size);
        this.states = new BacteriaStates(); // Novo sistema de estados
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
    }

    /**
     * Atualiza o estado da bactéria
     * @param {Array} foods - Lista de comidas
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Array} others - Lista de outras bactérias
     */
    update(foods, obstacles, others) {
        this.age++;
        this.updateHealth();

        // Avalia as condições do ambiente
        const conditions = this.evaluateEnvironment(foods, others);

        // Usa Q-Learning para escolher a ação
        const currentState = {
            health: Math.floor(this.health / 20), // Discretiza a saúde em 5 níveis
            energy: Math.floor(this.states.getEnergy() / 20),
            foodNearby: conditions.foodNearby,
            mateNearby: conditions.mateNearby
        };

        // Se houver estado anterior, atualiza Q-Table
        if (this.qLearning.lastState && this.qLearning.lastAction) {
            const reward = this.calculateReward();
            this.updateQTable(
                this.qLearning.lastState,
                this.qLearning.lastAction,
                reward,
                currentState
            );
        }

        // Escolhe nova ação
        const action = this.chooseAction(currentState);
        this.qLearning.lastState = currentState;
        this.qLearning.lastAction = action;

        // Converte ação do Q-Learning para ação do sistema de estados
        const stateActions = this.states.update({
            ...conditions,
            forcedState: action
        });

        // Verifica reprodução - só cria filho se for fêmea e estiver grávida
        if (this.isFemale) {
            let childDNA = this.reproduction.update();
            if (childDNA) {
                // Cria o filho com DNA combinado dos pais
                const child = new Bacteria(this.pos.x, this.pos.y, childDNA);
                if (window.simulation) {
                    window.simulation.stats.naturalBirths++; // Contabiliza nascimento natural
                }
                return child;
            }
        } else {
            // Se for macho, apenas atualiza o sistema de reprodução
            this.reproduction.update();
        }

        // Atualiza movimento baseado nas ações do estado
        this.updateMovementFromState(stateActions, obstacles, foods, others);

        // Sincroniza posição com o sistema de movimento
        this.pos.set(this.movement.position);

        // Atualiza visualização
        this.visualization.update({
            health: this.health,
            agePercentage: this.age / this.lifespan,
            currentBehavior: stateActions.state,
            isPregnant: this.reproduction.isPregnant,
            isCourting: this.reproduction.isCourting()
        });

        return null;
    }

    /**
     * Avalia as condições do ambiente
     * @param {Array} foods - Lista de comidas
     * @param {Array} others - Lista de outras bactérias
     * @returns {Object} - Condições do ambiente
     */
    evaluateEnvironment(foods, others) {
        const conditions = {
            foodNearby: false,
            mateNearby: false,
            predatorNearby: false // Para futura implementação de predadores
        };

        // Verifica comida próxima
        for (let food of foods) {
            let d = dist(this.pos.x, this.pos.y, food.position.x, food.position.y);
            if (d < this.perceptionRadius) {
                conditions.foodNearby = true;
                break;
            }
        }

        // Verifica parceiros próximos
        for (let other of others) {
            if (other !== this) {
                let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d < this.perceptionRadius && 
                    other.isFemale !== this.isFemale && 
                    other.states.getEnergy() > 70) {
                    conditions.mateNearby = true;
                    break;
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
     */
    updateMovementFromState(stateActions, obstacles, foods, others) {
        // Gerencia o estado de movimento
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
                // Implementar lógica de fuga
                const predator = this.findClosestPredator(others);
                if (predator) {
                    // Foge na direção oposta ao predador
                    target = createVector(
                        this.pos.x + (this.pos.x - predator.x) * 2,
                        this.pos.y + (this.pos.y - predator.y) * 2
                    );
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
     * @returns {p5.Vector|null} - Posição do predador mais próximo
     */
    findClosestPredator(others) {
        // Por enquanto retorna null pois não temos predadores implementados
        return null;
    }

    /**
     * Atualiza a saúde da bactéria
     */
    updateHealth() {
        if (window.simulation) {
            this.healthLossRate = window.simulation.controls.healthLossSlider.value();
            this.starvationTime = window.simulation.controls.feedingIntervalSlider.value() * 60 * 60;
        }

        // Reduz a perda de saúde quando a energia está alta
        const energyLevel = this.states.getEnergy();
        let healthLoss = this.healthLossRate;
        
        if (energyLevel > 80) {
            healthLoss *= 0.5; // Reduz perda de saúde pela metade quando energia alta
        } else if (energyLevel < 30) {
            healthLoss *= 1.5; // Aumenta perda de saúde quando energia baixa
        }

        this.health -= healthLoss;

        // Aumenta perda de saúde se estiver sem comer por muito tempo
        if (frameCount - this.lastMealTime > this.starvationTime) {
            this.health -= this.healthLossRate * 2; // Reduzido de 4x para 2x
            this.states.removeEnergy(0.15); // Reduzido de 0.2 para 0.15
        }

        // Se a saúde estiver muito baixa, perde energia mais rapidamente
        if (this.health < 30) {
            this.states.removeEnergy(0.1);
        }

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
        this.visualization.draw(this.pos.x, this.pos.y);
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
}

// Tornando a classe global
window.Bacteria = Bacteria; 