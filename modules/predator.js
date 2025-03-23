/**
 * Classe que representa um predador no sistema
 * Herda de Bacteria mas com comportamentos específicos de caça
 */
class Predator extends Bacteria {
    /**
     * Cria um novo predador
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     */
    constructor(x, y) {
        super(x, y);
        this.isPredator = true;
        this.huntingRange = 150;
        this.attackDamage = 20;
        this.attackRange = 30;
        this.attackCooldown = 1000; // 1 segundo
        this.lastAttackTime = 0;
        this.target = null;
        this.state = new PredatorStates(this);
        this.size = 25;
        this.color = color(255, 0, 0); // Vermelho sólido
        
        // Inicialização do movimento
        this.maxSpeed = 3;
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.velocity.setMag(this.maxSpeed);
        
        // Configurações de reprodução
        this.canReproduce = true;
        this.reproductionEnergyCost = 40;
        this.reproductionCooldown = 600; // 10 segundos
        this.lastReproductionTime = 0;
        this.reproductionRange = 50;
        this.minEnergyToReproduce = 80;
        this.mutationRate = 0.1;
        
        // Sobrescreve configurações da bactéria base
        this.healthLossRate = 0.03; // Perde saúde mais lentamente
        this.starvationTime = 120 * 60; // Mais tempo sem precisar comer
        this.perceptionRadius = 250; // Maior raio de percepção
    }

    /**
     * Atualiza o predador
     * @param {Array} bacteria - Lista de bactérias para caçar
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Array} predators - Lista de outros predadores
     * @param {number} deltaTime - Tempo desde o último frame
     * @returns {Predator|null} - Novo predador se reproduzir
     */
    update(bacteria, obstacles, predators = [], deltaTime = 1) {
        try {
            // Atualiza idade
            this.age += deltaTime;

            // Verifica se está morto
            if (this.isDead()) {
                return null;
            }

            // Atualiza saúde
            this.health -= this.healthLossRate * deltaTime;
            this.health = constrain(this.health, 0, 100);
            
            // Encontra a presa mais próxima
            const prey = this.findClosestPrey(bacteria);
            
            // Procura parceiro para reprodução
            const partner = this.findReproductionPartner(predators);
            
            // Atualiza estado baseado nas condições
            const stateActions = this.state.update({
                bacteria,
                predators,
                canReproduce: this.canReproduce && 
                            this.states.getEnergy() >= this.minEnergyToReproduce && 
                            millis() - this.lastReproductionTime >= this.reproductionCooldown,
                partnerNearby: partner !== null
            });

            // Atualiza movimento baseado no estado
            this.updateMovement(stateActions, obstacles, prey, partner);

            // Tenta atacar se houver presa próxima
            if (prey && this.canAttack()) {
                this.attack(prey);
            }

            // Tenta reproduzir se houver parceiro próximo
            if (partner && this.canReproduce && this.canReproduceNow()) {
                return this.reproduce(partner);
            }

            return null;
        } catch (error) {
            console.error("Erro no update do Predator:", error);
            return null;
        }
    }

    /**
     * Verifica se pode se reproduzir agora
     * @returns {boolean} - Se pode se reproduzir
     */
    canReproduceNow() {
        return this.states.getEnergy() >= this.minEnergyToReproduce &&
               millis() - this.lastReproductionTime > this.reproductionCooldown;
    }

    /**
     * Encontra um parceiro para reprodução
     * @param {Array} predators - Lista de predadores
     * @returns {Predator|null} - Parceiro encontrado ou null
     */
    findReproductionPartner(predators) {
        if (!this.canReproduce || 
            this.states.getEnergy() < this.minEnergyToReproduce || 
            millis() - this.lastReproductionTime < this.reproductionCooldown) {
            return null;
        }

        return predators.find(predator => 
            predator !== this && 
            predator.canReproduce &&
            predator.states.getEnergy() >= predator.minEnergyToReproduce &&
            millis() - predator.lastReproductionTime >= predator.reproductionCooldown &&
            dist(this.pos.x, this.pos.y, predator.pos.x, predator.pos.y) <= this.reproductionRange
        );
    }

    /**
     * Reproduz com outro predador
     * @param {Predator} partner - Parceiro para reprodução
     * @returns {Predator|null} - Novo predador ou null
     */
    reproduce(partner) {
        if (!this.canReproduceNow() || !partner.canReproduceNow()) return null;

        // Gasta energia na reprodução
        this.states.removeEnergy(this.reproductionEnergyCost);
        partner.states.removeEnergy(this.reproductionEnergyCost);

        // Atualiza tempo da última reprodução
        this.lastReproductionTime = millis();
        partner.lastReproductionTime = millis();

        // Cria novo predador
        const childX = (this.pos.x + partner.pos.x) / 2;
        const childY = (this.pos.y + partner.pos.y) / 2;
        
        // Cria o filho
        const child = new Predator(childX, childY);
        
        // Herança de características com possibilidade de mutação
        if (random() < this.mutationRate) {
            // Mutação aleatória
            child.attackDamage = constrain(this.attackDamage + random(-5, 5), 10, 25);
            child.huntingRange = constrain(this.huntingRange + random(-20, 20), 100, 250);
            child.size = constrain(this.size + random(-2, 2), 20, 30);
        } else {
            // Herança média dos pais
            child.attackDamage = constrain((this.attackDamage + partner.attackDamage) / 2, 10, 25);
            child.huntingRange = constrain((this.huntingRange + partner.huntingRange) / 2, 100, 250);
            child.size = constrain((this.size + partner.size) / 2, 20, 30);
        }

        // Garante valores mínimos
        child.attackDamage = max(10, child.attackDamage);
        child.huntingRange = max(100, child.huntingRange);
        child.size = max(20, child.size);

        return child;
    }

    /**
     * Encontra a presa mais próxima
     * @param {Array} bacteria - Lista de bactérias
     * @returns {Bacteria|null} - Bactéria mais próxima ou null
     */
    findClosestPrey(bacteria) {
        let closest = null;
        let minDist = this.huntingRange;

        for (let b of bacteria) {
            if (!b.isPredator) { // Não ataca outros predadores
                const d = dist(this.pos.x, this.pos.y, b.pos.x, b.pos.y);
                if (d < minDist) {
                    minDist = d;
                    closest = b;
                }
            }
        }

        return closest;
    }

    /**
     * Verifica se pode atacar
     * @returns {boolean} - Se pode atacar
     */
    canAttack() {
        return millis() - this.lastAttackTime > this.attackCooldown;
    }

    /**
     * Ataca uma bactéria
     * @param {Bacteria} prey - Bactéria alvo
     */
    attack(prey) {
        const d = dist(this.pos.x, this.pos.y, prey.pos.x, prey.pos.y);
        
        if (d < this.size + prey.size) {
            prey.health -= this.attackDamage;
            this.health += this.attackDamage * 0.5; // Recupera parte da saúde
            this.states.addEnergy(10); // Ganha energia ao atacar
            this.lastAttackTime = millis();
            
            // Efeito visual do ataque
            if (window.simulation) {
                window.simulation.addEffect(new AttackEffect(prey.pos.x, prey.pos.y));
            }
        }
    }

    /**
     * Atualiza o movimento do predador
     * @param {Object} stateActions - Ações do estado atual
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Bacteria} prey - Presa atual
     * @param {Predator} partner - Parceiro para reprodução
     */
    updateMovement(stateActions, obstacles, prey, partner) {
        if (!stateActions.shouldMove) {
            this.movement.stop();
            return;
        }

        this.movement.resume();
        let target = null;

        switch (stateActions.targetType) {
            case 'hunt':
                if (prey) {
                    target = prey.pos;
                }
                break;
            case 'mate':
                if (partner) {
                    target = partner.pos;
                }
                break;
            case 'random':
                if (random() < 0.02) {
                    target = createVector(
                        random(width),
                        random(height)
                    );
                }
                break;
        }

        if (target) {
            this.movement.seek(target, this.perceptionRadius, stateActions.speedMultiplier);
        }

        this.movement.update(
            this.age / this.lifespan,
            obstacles,
            this.size,
            true // Predadores podem atravessar bactérias
        );

        // Atualiza posição
        this.pos.set(this.movement.position);
    }

    /**
     * Desenha o predador
     */
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Corpo principal
        fill(this.color);
        noStroke();
        ellipse(0, 0, this.size, this.size);
        
        // Indicador de ataque
        if (!this.canAttack()) {
            const cooldownProgress = (millis() - this.lastAttackTime) / this.attackCooldown;
            stroke(255);
            noFill();
            arc(0, 0, this.size + 5, this.size + 5, 0, TWO_PI * cooldownProgress);
        }
        
        pop();
    }
}

// Torna a classe global
window.Predator = Predator; 