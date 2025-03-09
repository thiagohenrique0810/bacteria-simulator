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
        this.lastMealTime = frameCount; // Começa com comida
        this.healthLossRate = window.simulation ? window.simulation.controls.healthLossSlider.value() : 0.05;
        this.starvationTime = window.simulation ? window.simulation.controls.feedingIntervalSlider.value() * 60 * 60 : 30 * 60 * 60; // 30 minutos em frames por padrão
        this.isFemale = random() > 0.5;

        // Inicializa outros sistemas
        this.movement = new Movement(this.pos.copy(), this.size);
        this.behavior = new Behavior(this.dna);
        this.reproduction = new Reproduction(this.isFemale);
        this.reproduction.setDNA(this.dna);
        this.visualization = new BacteriaVisualization({
            size: this.size,
            isFemale: this.isFemale
        });
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

        // Atualiza sistemas
        this.behavior.update(
            this.health,
            frameCount - this.lastMealTime,
            this.starvationTime,
            this.reproduction.canMateNow(),
            this.reproduction.isInMatingRecovery()
        );

        // Verifica reprodução
        let childDNA = this.reproduction.update();
        if (childDNA) {
            // Cria nova bactéria com o DNA combinado
            return new Bacteria(this.pos.x, this.pos.y, childDNA);
        }

        // Atualiza movimento baseado no comportamento
        this.updateMovement(obstacles, foods, others);

        // Sincroniza posição com o sistema de movimento
        this.pos.set(this.movement.position);

        // Atualiza visualização
        this.visualization.update({
            health: this.health,
            agePercentage: this.age / this.lifespan,
            currentBehavior: this.behavior.currentBehavior,
            isPregnant: this.reproduction.isPregnant,
            isCourting: this.reproduction.isCourting()
        });

        return null;
    }

    /**
     * Atualiza a saúde da bactéria
     */
    updateHealth() {
        // Atualiza as taxas baseado nos controles
        if (window.simulation) {
            this.healthLossRate = window.simulation.controls.healthLossSlider.value();
            this.starvationTime = window.simulation.controls.feedingIntervalSlider.value() * 60 * 60;
        }

        // Perde saúde normalmente
        this.health -= this.healthLossRate;

        // Perde mais saúde se estiver com fome
        if (frameCount - this.lastMealTime > this.starvationTime) {
            this.health -= this.healthLossRate * 4; // Perde saúde 4x mais rápido quando com fome
        }

        // Limita a saúde entre 0 e 100
        this.health = constrain(this.health, 0, 100);
    }

    /**
     * Atualiza o movimento baseado no comportamento atual
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Array} foods - Lista de comidas
     * @param {Array} others - Lista de outras bactérias
     */
    updateMovement(obstacles, foods, others) {
        let target = null;
        let perception = 100;
        let attraction = 1;

        switch (this.behavior.currentBehavior) {
            case 'eat':
                target = this.findClosestFood(foods);
                perception = 150;
                attraction = this.dna.foodAttraction;
                break;
            case 'mate':
                target = this.findMate(others);
                perception = 200;
                attraction = this.dna.mateAttraction;
                break;
            case 'explore':
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
            this.behavior.isRestingState()
        );

        if (target) {
            this.movement.seek(target, perception, attraction);
        }

        this.movement.separate(others, this.size * 1.5);
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
     * Tenta comer uma comida
     * @param {Object} food - Comida a ser consumida
     */
    eat(food) {
        let result = this.behavior.eat(food.nutrition);
        if (result) {
            this.health += result.healthGain;
            this.health = constrain(this.health, 0, 100);
            this.lastMealTime = frameCount;
        }
    }

    /**
     * Tenta acasalar com outra bactéria
     * @param {Bacteria} other - Outra bactéria
     * @returns {boolean} - Se o acasalamento foi bem sucedido
     */
    mate(other) {
        return this.reproduction.mate(other.reproduction);
    }

    /**
     * Verifica se a bactéria está morta
     * @returns {boolean} - Se a bactéria está morta
     */
    isDead() {
        return this.health <= 0 || this.age >= this.lifespan;
    }

    /**
     * Desenha a bactéria
     */
    draw() {
        this.visualization.draw(this.pos.x, this.pos.y);
    }
}

// Tornando a classe global
window.Bacteria = Bacteria; 