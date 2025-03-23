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
     * @param {number} speedModifier - Modificador de velocidade (opcional)
     */
    moveRandom(deltaTime, speedModifier = 1.0) {
        deltaTime = deltaTime || 1;
        
        // Se a velocidade atual está muito baixa, força uma nova direção
        let forceNewDirection = false;
        
        if (this.movement.velocity.mag() < 0.05) {
            forceNewDirection = true;
        }
        
        // Chance de mudar de direção (10% por segundo) ou força uma nova direção
        if (forceNewDirection || random() < 0.01 * deltaTime * 60) {
            // Gera um vetor aleatório para movimento
            const randomDirection = p5.Vector.random2D();
            // Força normalizada
            randomDirection.normalize();
            // Aplica velocidade baseada no gene de velocidade e speedModifier
            let finalSpeed = speedModifier;
            // Incorpora o gene de velocidade se disponível
            if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes) {
                const geneSpeed = this.bacteria.dna.genes.speed || 1;
                finalSpeed *= geneSpeed;
            }
            randomDirection.mult(finalSpeed);
            
            // Aplica a força ao sistema de movimento
            this.movement.setDirection(randomDirection);
            
            if (forceNewDirection && this.bacteria && this.bacteria.age % 60 === 0) {
                console.log(`Bactéria ${this.bacteria.id} forçou nova direção: vel=${randomDirection.mag().toFixed(2)}`);
            }
        } else {
            // Mantém movimento existente, mas aplica uma pequena força aleatória para evitar ficar parado
            const randomJitter = p5.Vector.random2D();
            randomJitter.mult(0.2 * speedModifier); // Pequena força aleatória ajustada pelo modificador
            this.movement.applyForce(randomJitter);
        }
        
        // Calcula a razão da idade (0-1)
        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
        
        // Verifica se a bactéria tem acesso ao sistema de estados
        const isResting = (this.bacteria.stateManager && 
                          typeof this.bacteria.stateManager.getCurrentState === 'function') ? 
                          this.bacteria.stateManager.getCurrentState() === 'resting' : 
                          (this.bacteria.states && 
                           typeof this.bacteria.states.getCurrentState === 'function' ? 
                           this.bacteria.states.getCurrentState() === window.BacteriaStates.RESTING : 
                           false);
        
        // Sempre atualiza o movimento com os parâmetros necessários
        this.movement.update(
            ageRatio,
            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
            this.bacteria.size,
            isResting,
            deltaTime
        );
        
        // Não atualizamos a posição aqui, isso agora é feito no método update da classe Bacteria
    }

    /**
     * Move a bactéria em direção a uma posição
     * @param {p5.Vector} target - Posição alvo
     * @param {number} deltaTime - Tempo desde o último frame
     * @param {number} speedMultiplier - Multiplicador de velocidade (opcional)
     */
    moveTowards(target, deltaTime, speedMultiplier = 1.0) {
        // Verifica se target é válido
        if (!target || !target.x || !target.y) return;
        
        // Valores padrão
        deltaTime = deltaTime || 1;
        
        // Cria um vetor do ponto atual para o alvo
        const direction = createVector(target.x - this.bacteria.pos.x, target.y - this.bacteria.pos.y);
        
        // Normaliza para manter velocidade constante
        direction.normalize();
        
        // Aplica o multiplicador de velocidade e gene de velocidade
        let finalSpeed = speedMultiplier;
        // Incorpora o gene de velocidade se disponível
        if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes) {
            const geneSpeed = this.bacteria.dna.genes.speed || 1;
            finalSpeed *= geneSpeed;
        }
        direction.mult(finalSpeed);
        
        // Define a direção no sistema de movimento
        this.movement.setDirection(direction);
        
        // Calcula a razão da idade (0-1)
        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
        
        // Verifica se a bactéria tem acesso ao sistema de estados
        const isResting = (this.bacteria.stateManager && 
                          typeof this.bacteria.stateManager.getCurrentState === 'function') ? 
                          this.bacteria.stateManager.getCurrentState() === 'resting' : 
                          (this.bacteria.states && 
                           typeof this.bacteria.states.getCurrentState === 'function' ? 
                           this.bacteria.states.getCurrentState() === window.BacteriaStates.RESTING : 
                           false);
        
        // Atualiza o movimento com os parâmetros necessários
        this.movement.update(
            ageRatio,
            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
            this.bacteria.size,
            isResting,
            deltaTime
        );
        
        // Não atualizamos a posição aqui, isso agora é feito no método update da classe Bacteria
    }

    /**
     * Move a bactéria para longe de uma posição (fuga)
     * @param {p5.Vector} target - Posição a fugir
     * @param {number} deltaTime - Tempo desde o último frame
     * @param {number} speedMultiplier - Multiplicador de velocidade (opcional)
     */
    moveAway(target, deltaTime, speedMultiplier = 1.5) {
        // Verifica se target é válido
        if (!target || !target.x || !target.y) return;
        
        // Valores padrão
        deltaTime = deltaTime || 1;
        
        // Cria um vetor na direção OPOSTA ao alvo (fuga)
        const direction = createVector(this.bacteria.pos.x - target.x, this.bacteria.pos.y - target.y);
        
        // Se estiver muito perto do perigo, adiciona um componente aleatório para evitar ficar preso
        if (direction.mag() < this.bacteria.size * 2) {
            const randomEscape = p5.Vector.random2D();
            randomEscape.mult(0.5);
            direction.add(randomEscape);
        }
        
        // Normaliza para manter velocidade constante
        direction.normalize();
        
        // Aplica o multiplicador de velocidade (fugir é mais rápido) e gene de velocidade
        let finalSpeed = speedMultiplier;
        // Incorpora o gene de velocidade se disponível
        if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes) {
            const geneSpeed = this.bacteria.dna.genes.speed || 1;
            finalSpeed *= geneSpeed;
        }
        direction.mult(finalSpeed);
        
        // Define a direção no sistema de movimento
        this.movement.setDirection(direction);
        
        // Log de depuração
        if (this.bacteria && this.bacteria.age % 60 === 0) {
            console.log(`Bactéria ${this.bacteria.id} fugindo: vel=${direction.mag().toFixed(2)}`);
        }
        
        // Calcula a razão da idade (0-1)
        const ageRatio = this.bacteria.age / this.bacteria.lifespan;
        
        // Atualiza o movimento com os parâmetros necessários (nunca descansa durante fuga)
        this.movement.update(
            ageRatio,
            this.bacteria.simulation ? this.bacteria.simulation.obstacles : [],
            this.bacteria.size,
            false, // Nunca descansa durante fuga
            deltaTime
        );
        
        // Não atualizamos a posição aqui, isso agora é feito no método update da classe Bacteria
    }

    /**
     * Comportamento de evitar obstáculos
     * @param {Array} obstacles - Array de obstáculos
     * @param {number} deltaTime - Tempo desde o último frame 
     */
    avoidObstacles(obstacles, deltaTime) {
        if (!obstacles || !Array.isArray(obstacles) || obstacles.length === 0) return;
        
        // Verificar colisões com obstáculos
        for (const obstacle of obstacles) {
            if (!obstacle || !obstacle.collidesWith) continue;
            
            // Verifica colisão com uma margem de segurança
            if (obstacle.collidesWith(this.bacteria.pos, this.bacteria.size * 1.5)) {
                // Calcula vetor de fuga do obstáculo
                let escapeVector;
                
                // Se o obstáculo tem um método para calcular direção de fuga, usa-o
                if (typeof obstacle.getEscapeDirection === 'function') {
                    escapeVector = obstacle.getEscapeDirection(this.bacteria.pos);
                } 
                // Caso contrário, usa uma abordagem simples
                else if (obstacle.position) {
                    escapeVector = createVector(
                        this.bacteria.pos.x - obstacle.position.x,
                        this.bacteria.pos.y - obstacle.position.y
                    );
                } else {
                    // Se não conseguir determinar direção, apenas muda para direção aleatória
                    escapeVector = p5.Vector.random2D();
                }
                
                // Normaliza e aplica uma força mais forte
                escapeVector.normalize();
                escapeVector.mult(2.0); // Força maior para evitar obstáculos
                
                // Aplica a força ao movimento
                this.applyForce(escapeVector);
                
                // Log de depuração
                if (this.bacteria && this.bacteria.age % 60 === 0) {
                    console.log(`Bactéria ${this.bacteria.id} evitando obstáculo`);
                }
                
                // Só evita um obstáculo por vez para comportamento mais natural
                break;
            }
        }
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
     * Aplica ações baseadas no estado atual da bactéria
     * @param {Object} stateInfo - Informações sobre o estado atual
     * @param {Object} environmentConditions - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    applyStateActions(stateInfo, environmentConditions, deltaTime) {
        if (!stateInfo) {
            console.warn("BacteriaMovement: stateInfo não fornecido");
            return;
        }

        try {
            // Depuração
            if (this.bacteria && this.bacteria.age % 60 === 0) {
                console.log(`Movimento da bactéria ${this.bacteria.id}: Estado=${stateInfo.state}, Deve Mover=${stateInfo.shouldMove}, Tipo Alvo=${stateInfo.targetType}`);
            }

            // Se não deve se mover, garante que a velocidade vá para 0 gradualmente
            if (!stateInfo.shouldMove) {
                // Desacelerar até parar
                if (this.movement) {
                    this.movement.applyDamping(0.9);
                }
                return;
            }

            // Aplica força aleatória quando não tem um alvo específico
            if (stateInfo.targetType === 'random' || !stateInfo.target) {
                // A velocidade da bactéria depende da energia e da idade
                let speedModifier = 1.0;
                
                // Ajusta velocidade baseado no multiplicador de velocidade fornecido
                if (stateInfo.speedMultiplier !== undefined) {
                    speedModifier *= stateInfo.speedMultiplier;
                }
                
                // Se tiver energia suficiente, move-se mais rápido
                if (this.bacteria && this.bacteria.stateManager) {
                    const energy = this.bacteria.stateManager.currentEnergy;
                    speedModifier *= (energy > 70) ? 1.2 : (energy > 30) ? 1.0 : 0.7;
                }
                
                // Introduz um fator de personalidade baseado no DNA
                if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes) {
                    // Usa o gene de velocidade, se disponível
                    if (this.bacteria.dna.genes.speed !== undefined) {
                        speedModifier *= 0.5 + this.bacteria.dna.genes.speed;
                    }
                    
                    // Usa o gene de atividade, se disponível
                    if (this.bacteria.dna.genes.activity !== undefined) {
                        speedModifier *= 0.5 + this.bacteria.dna.genes.activity;
                    }
                }
                
                // Chama moveRandom com o speedModifier calculado
                this.moveRandom(deltaTime, speedModifier);
            }
            // Move em direção ao alvo (comida, parceiro, etc)
            else if (stateInfo.target) {
                // Define o destino e move em direção a ele
                let destination;
                
                // Converte o alvo em um vetor de posição
                if (stateInfo.target.position) {
                    destination = stateInfo.target.position;
                } else if (stateInfo.target.pos) {
                    destination = stateInfo.target.pos;
                } else {
                    console.warn("BacteriaMovement: Alvo sem posição válida");
                    this.moveRandom(deltaTime);
                    return;
                }
                
                // Calcular speedModifier baseado no tipo de alvo
                let speedModifier = stateInfo.speedMultiplier || 1.0;
                
                // Ajusta velocidade com base no tipo de alvo
                switch (stateInfo.targetType) {
                    case 'food':
                        // Move-se mais rápido em direção à comida quando tem pouca energia
                        if (this.bacteria && this.bacteria.stateManager) {
                            const energy = this.bacteria.stateManager.currentEnergy;
                            speedModifier *= (energy < 30) ? 1.5 : 1.2;
                        }
                        break;
                        
                    case 'mate':
                        // Move-se em velocidade moderada em direção ao parceiro
                        speedModifier *= 0.8;
                        break;
                        
                    case 'escape':
                        // Move-se rapidamente para fugir de predadores
                        speedModifier *= 1.8;
                        // Direção é OPOSTA à posição do predador
                        this.moveAway(destination, deltaTime, speedModifier);
                        return;
                        
                    default:
                        // Velocidade padrão para outros alvos
                        speedModifier *= 1.0;
                }
                
                // Move em direção ao destino
                this.moveTowards(destination, deltaTime, speedModifier);
            }
            
            // Se a velocidade está muito baixa, aplica uma força aleatória adicional
            if (this.movement && this.movement.velocity.mag() < 0.1) {
                const randomForce = p5.Vector.random2D().mult(0.5);
                this.applyForce(randomForce);
                
                if (this.bacteria && this.bacteria.age % 60 === 0) {
                    console.log(`Aplicando força impulso de movimento à bactéria ${this.bacteria.id}: vel=${this.movement.velocity.mag().toFixed(2)}`);
                }
            }
            
            // Processa comportamentos de evitar obstáculos se fornecidos
            if (environmentConditions && environmentConditions.obstacles && environmentConditions.obstacles.length > 0) {
                this.avoidObstacles(environmentConditions.obstacles, deltaTime);
            }
        } catch (error) {
            console.error("Erro ao aplicar ações de estado:", error);
        }
    }
}

// Exporta a classe para uso global
window.BacteriaMovement = BacteriaMovement; 