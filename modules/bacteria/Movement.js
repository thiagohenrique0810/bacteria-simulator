/**
 * Classe responsável pelo movimento da bactéria
 */
class BacteriaMovement {
    /**
     * Inicializa o módulo de movimento
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        this.movement = new Movement(bacteria.pos.copy(), bacteria.size);
    }

    /**
     * Faz a bactéria se mover em uma direção aleatória
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveRandom(deltaTime) {
        deltaTime = deltaTime || 1;
        
        // Chance de mudar de direção (10% por segundo)
        if (random() < 0.01 * deltaTime * 60) {
            // Gera um vetor aleatório para movimento
            const randomDirection = p5.Vector.random2D();
            // Força normalizada
            randomDirection.normalize();
            // Aplica velocidade baseada no gene de velocidade
            const speedMultiplier = this.bacteria.dna.genes.speed || 1;
            randomDirection.mult(speedMultiplier);
            
            // Aplica a força ao sistema de movimento
            this.movement.setDirection(randomDirection);
        }
        
        // Calcula a razão da idade (0-1)
        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
        
        // Sempre atualiza o movimento com os parâmetros necessários
        this.movement.update(
            ageRatio,
            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
            this.bacteria.size,
            this.bacteria.states.getCurrentState() === window.BacteriaStates.RESTING,
            deltaTime
        );
        
        // Atualiza a posição da bactéria
        this.bacteria.pos = this.movement.getPosition();
    }

    /**
     * Move a bactéria em direção a uma posição
     * @param {p5.Vector} target - Posição alvo
     * @param {number} speedMultiplier - Multiplicador de velocidade
     * @param {number} deltaTime - Tempo desde o último frame
     */
    moveTowards(target, speedMultiplier, deltaTime) {
        // Verifica se target é válido
        if (!target || !target.x || !target.y) return;
        
        // Valores padrão
        speedMultiplier = speedMultiplier || 1;
        deltaTime = deltaTime || 1;
        
        // Cria um vetor do ponto atual para o alvo
        const direction = createVector(target.x - this.bacteria.pos.x, target.y - this.bacteria.pos.y);
        
        // Normaliza para manter velocidade constante
        direction.normalize();
        
        // Aplica o multiplicador de velocidade e gene de velocidade
        const geneSpeedMultiplier = this.bacteria.dna.genes.speed || 1;
        direction.mult(speedMultiplier * geneSpeedMultiplier);
        
        // Define a direção no sistema de movimento
        this.movement.setDirection(direction);
        
        // Calcula a razão da idade (0-1)
        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
        
        // Atualiza o movimento com os parâmetros necessários
        this.movement.update(
            ageRatio,
            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
            this.bacteria.size,
            this.bacteria.states.getCurrentState() === window.BacteriaStates.RESTING,
            deltaTime
        );
        
        // Atualiza a posição da bactéria
        this.bacteria.pos = this.movement.getPosition();
    }

    /**
     * Para o movimento da bactéria
     */
    stop() {
        this.movement.stop();
    }

    /**
     * Continua o movimento da bactéria
     */
    resume() {
        this.movement.resume();
    }

    /**
     * Aplica uma força ao movimento
     * @param {p5.Vector} force - Força a ser aplicada
     */
    applyForce(force) {
        this.movement.applyForce(force);
    }

    /**
     * Define a direção do movimento
     * @param {p5.Vector} direction - Direção do movimento
     */
    setDirection(direction) {
        this.movement.setDirection(direction);
    }

    /**
     * Atualiza o movimento com base nas ações da bactéria
     * @param {Object} stateActions - Ações do estado atual
     * @param {Object} conditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    applyStateActions(stateActions, conditions, deltaTime) {
        // Verifica se stateActions é válido
        if (!stateActions) return;
        
        // Aplica as ações de movimento baseadas no estado
        if (!stateActions.shouldMove) {
            // Para de se mover se estiver descansando
            this.stop();
        } else {
            // Continua movendo conforme o estado
            this.resume();
            
            // Define a velocidade baseada no multiplicador do estado e gene de velocidade
            const speedMultiplier = stateActions.speedMultiplier * (this.bacteria.dna.genes.speed || 1);
            
            // Aplica o movimento baseado no tipo de alvo
            switch (stateActions.targetType) {
                case 'food':
                    if (conditions.foodTarget) {
                        this.moveTowards(conditions.foodTarget.position, speedMultiplier, deltaTime);
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'mate':
                    if (conditions.mateTarget) {
                        this.moveTowards(conditions.mateTarget.pos, speedMultiplier, deltaTime);
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'escape':
                    if (conditions.predatorTarget) {
                        // Movimento na direção oposta ao predador
                        const escapeVector = createVector(
                            this.bacteria.pos.x - conditions.predatorTarget.pos.x,
                            this.bacteria.pos.y - conditions.predatorTarget.pos.y
                        );
                        escapeVector.normalize();
                        escapeVector.mult(speedMultiplier * 1.5); // Mais rápido ao fugir
                        
                        this.setDirection(escapeVector);
                        
                        // Calcula a razão da idade (0-1)
                        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
                        
                        // Atualiza o movimento com os parâmetros necessários
                        this.movement.update(
                            ageRatio,
                            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
                            this.bacteria.size,
                            false, // Não está descansando quando está fugindo
                            deltaTime
                        );
                    } else {
                        this.moveRandom(deltaTime);
                    }
                    break;
                    
                case 'random':
                default:
                    this.moveRandom(deltaTime);
                    break;
            }
        }
        
        // Atualiza a posição com base no movimento
        if (this.movement) {
            this.bacteria.pos = this.movement.getPosition();
        } else {
            console.error("Movimento inválido na bactéria:", this.bacteria.id);
        }
    }
}

// Exporta a classe para uso global
window.BacteriaMovement = BacteriaMovement; 