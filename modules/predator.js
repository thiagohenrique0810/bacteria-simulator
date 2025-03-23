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
        
        // Inicializa o sistema de movimento apropriado para o predador
        this.initializeMovement();
        
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
     * Inicializa o sistema de movimento do predador
     */
    initializeMovement() {
        try {
            // Cria um objeto de movimento básico se não existir
            if (!this.movement) {
                // Verifica se podemos usar MovementBase
                if (window.MovementBase) {
                    // Inicializa o movimento com posição da bactéria e velocidade inicial
                    const initPosition = createVector(this.pos.x, this.pos.y);
                    const initVelocity = createVector(random(-1, 1), random(-1, 1));
                    initVelocity.setMag(this.maxSpeed * 0.5); // Começa com metade da velocidade máxima
                    
                    this.movement = {
                        position: initPosition,
                        velocity: initVelocity,
                        acceleration: createVector(0, 0),
                        maxSpeed: this.maxSpeed,
                        maxForce: 0.2,
                        
                        // Método para definir direção
                        setDirection: function(direction) {
                            this.velocity = direction.copy();
                            this.velocity.limit(this.maxSpeed);
                        },
                        
                        // Método para parar o movimento
                        stop: function() {
                            this.velocity.mult(0.8);
                        },
                        
                        // Método para retomar o movimento
                        resume: function() {
                            // Nada a fazer, só garante que o método existe
                        },
                        
                        // Método para atualizar posição
                        update: function(ageRatio, obstacles, size, canPassThrough, deltaTime = 1) {
                            // Aplicar efeito de idade - predadores mais velhos se movem mais lentamente
                            const ageFactor = 1 - (ageRatio * 0.3);
                            
                            // Calcular nova posição
                            this.velocity.limit(this.maxSpeed * ageFactor);
                            this.position.add(p5.Vector.mult(this.velocity, deltaTime));
                            
                            // Verificar colisões com obstáculos
                            if (obstacles && !canPassThrough) {
                                for (let obstacle of obstacles) {
                                    if (obstacle && obstacle.pos) {
                                        const d = dist(this.position.x, this.position.y, obstacle.pos.x, obstacle.pos.y);
                                        if (d < (size + obstacle.size) / 2) {
                                            // Ajusta a posição para evitar sobreposição
                                            const pushDirection = p5.Vector.sub(this.position, obstacle.pos);
                                            pushDirection.normalize();
                                            pushDirection.mult((size + obstacle.size) / 2 - d + 1);
                                            this.position.add(pushDirection);
                                            
                                            // Reflete a velocidade
                                            const reflection = p5.Vector.reflect(this.velocity, pushDirection);
                                            this.velocity = reflection;
                                        }
                                    }
                                }
                            }
                            
                            // Manter dentro dos limites da tela
                            this.position.x = constrain(this.position.x, size/2, width - size/2);
                            this.position.y = constrain(this.position.y, size/2, height - size/2);
                        }
                    };
                }
            }
        } catch (error) {
            console.error("Erro ao inicializar movimento do predador:", error);
            // Fallback: criar um objeto movement mínimo
            this.movement = {
                position: this.pos.copy(),
                velocity: createVector(0, 0),
                setDirection: (dir) => { this.velocity = dir.copy(); },
                stop: () => { this.velocity.mult(0); },
                resume: () => {},
                update: () => { 
                    this.pos.add(this.velocity); 
                    this.pos.x = constrain(this.pos.x, 0, width);
                    this.pos.y = constrain(this.pos.y, 0, height);
                }
            };
        }
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
                            this.states && typeof this.states.getEnergy === 'function' &&
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
        try {
            return this.states && 
                   typeof this.states.getEnergy === 'function' &&
                   this.states.getEnergy() >= this.minEnergyToReproduce &&
                   millis() - this.lastReproductionTime > this.reproductionCooldown;
        } catch (error) {
            console.warn("Erro ao verificar se pode reproduzir:", error);
            return false;
        }
    }

    /**
     * Encontra um parceiro para reprodução
     * @param {Array} predators - Lista de predadores
     * @returns {Predator|null} - Parceiro encontrado ou null
     */
    findReproductionPartner(predators) {
        try {
            // Verifica se pode se reproduzir e se o states existe
            if (!this.canReproduce || 
                !this.states || 
                typeof this.states.getEnergy !== 'function' ||
                this.states.getEnergy() < this.minEnergyToReproduce || 
                millis() - this.lastReproductionTime < this.reproductionCooldown) {
                return null;
            }
            
            // Verifica se predators é um array válido
            if (!predators || !Array.isArray(predators)) {
                return null;
            }

            // Encontra um parceiro compatível
            return predators.find(predator => {
                // Verifica se o predador é válido e tem os atributos necessários
                return predator && 
                    predator !== this && 
                    predator.canReproduce &&
                    predator.states && 
                    typeof predator.states.getEnergy === 'function' &&
                    predator.states.getEnergy() >= predator.minEnergyToReproduce &&
                    predator.lastReproductionTime !== undefined &&
                    predator.reproductionCooldown !== undefined &&
                    millis() - predator.lastReproductionTime >= predator.reproductionCooldown &&
                    predator.pos &&
                    !isNaN(predator.pos.x) && 
                    !isNaN(predator.pos.y) &&
                    dist(this.pos.x, this.pos.y, predator.pos.x, predator.pos.y) <= this.reproductionRange;
            });
        } catch (error) {
            console.error("Erro ao procurar parceiro para reprodução:", error);
            return null;
        }
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
        try {
            // Verifica se bacteria é um array válido
            if (!bacteria || !Array.isArray(bacteria) || bacteria.length === 0) {
                return null;
            }

            let closest = null;
            let minDist = this.huntingRange;

            for (let b of bacteria) {
                if (b && !b.isPredator && b.pos && 
                    !isNaN(b.pos.x) && !isNaN(b.pos.y) && 
                    !isNaN(this.pos.x) && !isNaN(this.pos.y)) { 
                    // Não ataca outros predadores e valida posições
                    const d = dist(this.pos.x, this.pos.y, b.pos.x, b.pos.y);
                    if (d < minDist) {
                        minDist = d;
                        closest = b;
                    }
                }
            }

            return closest;
        } catch (error) {
            console.error("Erro ao encontrar presa mais próxima:", error);
            return null;
        }
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
        try {
            // Verifica se a presa é válida
            if (!prey || !prey.pos || !this.pos || 
                isNaN(prey.pos.x) || isNaN(prey.pos.y) || 
                isNaN(this.pos.x) || isNaN(this.pos.y)) {
                return;
            }
            
            const d = dist(this.pos.x, this.pos.y, prey.pos.x, prey.pos.y);
            
            if (d < this.size + prey.size) {
                prey.health -= this.attackDamage;
                this.health += this.attackDamage * 0.5; // Recupera parte da saúde
                
                // Validação antes de acessar states
                if (this.states && typeof this.states.addEnergy === 'function') {
                    this.states.addEnergy(10); // Ganha energia ao atacar
                }
                
                this.lastAttackTime = millis();
                
                // Efeito visual do ataque
                if (window.simulation && typeof window.simulation.addEffect === 'function') {
                    try {
                        window.simulation.addEffect(new AttackEffect(prey.pos.x, prey.pos.y));
                    } catch (effectError) {
                        console.warn("Erro ao adicionar efeito de ataque:", effectError);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao atacar presa:", error);
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
        try {
            if (!stateActions.shouldMove) {
                if (this.movement && typeof this.movement.stop === 'function') {
                    this.movement.stop();
                }
                return;
            }

            if (this.movement && typeof this.movement.resume === 'function') {
                this.movement.resume();
            }
            
            let target = null;

            switch (stateActions.targetType) {
                case 'hunt':
                    if (prey && prey.pos) {
                        target = prey.pos;
                    }
                    break;
                case 'mate':
                    if (partner && partner.pos) {
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

            // Implementando a lógica de seek manualmente em vez de usar this.movement.seek
            if (target) {
                // Calculamos a direção para o alvo
                const direction = createVector(
                    target.x - this.pos.x,
                    target.y - this.pos.y
                );
                
                // Verificamos se estamos próximos do alvo
                const distance = direction.mag();
                
                // Só precisamos nos mover se não estivermos muito próximos do alvo
                if (distance > 5) {
                    // Normaliza o vetor e aplica a velocidade adequada
                    direction.normalize();
                    direction.mult(this.maxSpeed * (stateActions.speedMultiplier || 1.0));
                    
                    // Define a direção como a velocidade do predador
                    this.velocity = direction;
                    
                    // Aplica a direção ao movement se disponível
                    if (this.movement && typeof this.movement.setDirection === 'function') {
                        this.movement.setDirection(direction);
                    }
                }
            }

            // Atualiza o sistema de movimento
            if (this.movement && typeof this.movement.update === 'function') {
                this.movement.update(
                    this.age / this.lifespan,
                    obstacles,
                    this.size,
                    true // Predadores podem atravessar bactérias
                );
                
                // Atualiza posição a partir do sistema de movimento
                if (this.movement.position) {
                    this.pos.set(this.movement.position);
                }
            } else {
                // Fallback: atualiza a posição baseado na velocidade
                this.pos.add(this.velocity);
                
                // Mantém dentro dos limites da tela
                this.pos.x = constrain(this.pos.x, 0, width);
                this.pos.y = constrain(this.pos.y, 0, height);
                
                // Log para debug
                if (frameCount % 180 === 0) {
                    console.log(`Predador movendo com velocidade: ${this.velocity.mag().toFixed(2)}`);
                }
            }
        } catch (error) {
            console.error("Erro ao atualizar movimento do predador:", error);
            
            // Em caso de erro, aplica um movimento aleatório seguro
            if (!this.velocity) this.velocity = createVector(random(-1, 1), random(-1, 1));
            this.velocity.setMag(1);
            this.pos.add(this.velocity);
            this.pos.x = constrain(this.pos.x, 0, width);
            this.pos.y = constrain(this.pos.y, 0, height);
        }
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