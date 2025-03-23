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
        
        try {
            // Cria o sistema de movimento
            this.movement = new Movement(bacteria.pos.copy(), bacteria.size);
            
            // Verifica se foi criado corretamente
            if (!this.movement) {
                console.error("Falha ao criar o sistema de movimento. Tentando alternativa...");
                // Tenta criar usando construtor global como fallback
                this.movement = new window.Movement(bacteria.pos.copy(), bacteria.size);
            }
            
            // Verifica se a propriedades essenciais existem
            if (!this.movement.position || !this.movement.velocity) {
                console.error("Sistema de movimento criado sem propriedades essenciais!");
                // Cria propriedades mínimas necessárias
                this.movement.position = bacteria.pos.copy();
                this.movement.velocity = createVector(0, 0);
            }
        } catch (error) {
            console.error("Erro crítico ao inicializar movimento:", error);
            // Cria um objeto mínimo para evitar erros fatais
            this.movement = {
                position: bacteria.pos.copy(),
                velocity: createVector(0, 0),
                update: function() { console.warn("Método update simulado"); },
                setDirection: function() { console.warn("Método setDirection simulado"); }
            };
        }
        
        // Controles para movimento aleatório suave
        this.wanderAngle = random(TWO_PI);
        this.wanderTimer = 0;
        this.wanderInterval = random(30, 60); // Intervalo de mudança de direção (em frames)
    }

    /**
     * Faz a bactéria se mover em uma direção aleatória com movimento natural
     * @param {number} deltaTime - Tempo desde o último frame
     * @param {number} speedModifier - Modificador de velocidade (opcional)
     */
    moveRandom(deltaTime = 1, speedModifier = 1.0) {
        try {
            // Verifica se o movimento foi inicializado corretamente
            if (!this.movement || !this.movement.velocity) {
                console.warn("Sistema de movimento não inicializado corretamente");
                return;
            }
            
            // Verifica se a posição da bactéria é válida
            if (this.bacteria && (isNaN(this.bacteria.pos.x) || isNaN(this.bacteria.pos.y))) {
                console.warn("Posição da bactéria inválida (NaN). Corrigindo...");
                this.bacteria.pos.x = isNaN(this.bacteria.pos.x) ? random(width) : this.bacteria.pos.x;
                this.bacteria.pos.y = isNaN(this.bacteria.pos.y) ? random(height) : this.bacteria.pos.y;
                
                // Sincroniza a posição do sistema de movimento
                if (this.movement && this.movement.position) {
                    this.movement.position.x = this.bacteria.pos.x;
                    this.movement.position.y = this.bacteria.pos.y;
                }
            }
            
            // Incrementa o temporizador de wandering
            this.wanderTimer++;
            
            // Recupera as dimensões do mundo
            const worldWidth = typeof width !== 'undefined' ? width : 800;
            const worldHeight = typeof height !== 'undefined' ? height : 600;
            
            // Detecta se está em um canto ou perto da borda
            const margin = this.bacteria.size * 5;
            const isNearLeftEdge = this.bacteria.pos.x < margin;
            const isNearRightEdge = this.bacteria.pos.x > worldWidth - margin;
            const isNearTopEdge = this.bacteria.pos.y < margin;
            const isNearBottomEdge = this.bacteria.pos.y > worldHeight - margin;
            
            const isInCorner = (isNearLeftEdge && isNearTopEdge) || 
                               (isNearLeftEdge && isNearBottomEdge) || 
                               (isNearRightEdge && isNearTopEdge) || 
                               (isNearRightEdge && isNearBottomEdge);
                               
            const isNearEdge = isNearLeftEdge || isNearRightEdge || isNearTopEdge || isNearBottomEdge;
            
            // Verifica se há informação de "preso no canto" do sistema de aprendizado
            let isStuck = false;
            let stuckBehavior = false;
            
            // Verifica se a bactéria tem um sistema de aprendizado que indica que está presa
            if (this.bacteria && this.bacteria.learning && 
                this.bacteria.learning.movementParams && 
                this.bacteria.learning.movementParams.isStuck) {
                isStuck = true;
                stuckBehavior = true;
            }
            
            // Comportamento especial quando está presa em um canto (prioridade máxima)
            if (stuckBehavior) {
                // Direciona fortemente para o centro com alta velocidade e aleatoriedade
                const centerDirection = createVector(
                    worldWidth/2 - this.bacteria.pos.x,
                    worldHeight/2 - this.bacteria.pos.y
                );
                
                // Normaliza o vetor (com segurança para evitar erros)
                if (centerDirection.mag() > 0) {
                    centerDirection.normalize();
                    
                    // Adiciona forte componente aleatório para aumentar chances de sair do canto
                    const randomAngle = random(-PI/2, PI/2);
                    centerDirection.rotate(randomAngle);
                    
                    // Aplica velocidade aumentada
                    const escapeSpeed = 2.0; // Velocidade muito alta para sair do canto
                    
                    // Usar código seguro para aplicar multiplicação
                    if (!isNaN(speedModifier) && !isNaN(escapeSpeed) && 
                        isFinite(speedModifier) && isFinite(escapeSpeed)) {
                        centerDirection.mult(speedModifier * escapeSpeed);
                    } else {
                        // Em caso de erro, usa valores seguros
                        centerDirection.mult(1.5);
                    }
                    
                    // Aplica a direção
                    this.movement.setDirection(centerDirection);
                    
                    // Reseta o temporizador de wandering
                    this.wanderTimer = 0;
                    this.wanderInterval = random(10, 20); // Intervalo muito curto para mudanças rápidas
                }
            }
            // Comportamento para quando está em um canto ou perto da borda, mas não "preso"
            else if ((isInCorner && random() < 0.4) || (isNearEdge && random() < 0.25)) {
                // Vetor direcionado ao centro, mas com menor probabilidade de ativação
                // para permitir exploração dos cantos
                const centerDirection = createVector(
                    worldWidth/2 - this.bacteria.pos.x,
                    worldHeight/2 - this.bacteria.pos.y
                );
                
                // Normaliza com segurança
                if (centerDirection.mag() > 0) {
                    centerDirection.normalize();
                    
                    // Adiciona uma variação aleatória para evitar movimento direto e previsível
                    centerDirection.rotate(random(-PI/3, PI/3));
                    
                    // Velocidade moderada para sair da borda
                    const escapeSpeed = isInCorner ? 1.2 : 1.1;
                    
                    // Usa código seguro para multiplicação
                    if (!isNaN(speedModifier) && !isNaN(escapeSpeed) && 
                        isFinite(speedModifier) && isFinite(escapeSpeed)) {
                        centerDirection.mult(speedModifier * escapeSpeed);
                    } else {
                        // Em caso de erro, usa valores seguros
                        centerDirection.mult(1.0);
                    }
                    
                    // Aplica a direção
                    this.movement.setDirection(centerDirection);
                    
                    // Atualiza o ângulo de wandering para manter consistência
                    this.wanderAngle = Math.atan2(centerDirection.y, centerDirection.x);
                    
                    // Redefine o intervalo para mudança mais frequente quando estiver perto das bordas
                    this.wanderTimer = 0;
                    this.wanderInterval = random(20, 40);
                }
            } 
            // Movimento de wandering normal
            else if (this.wanderTimer >= this.wanderInterval) {
                // Reseta o temporizador com uma pequena variação
                this.wanderTimer = 0;
                this.wanderInterval = random(30, 60);
                
                // Comportamento de exploração normal
                // Altera o ângulo de wandering para um movimento mais natural
                // Permite maior aleatoriedade quando não está em canto
                this.wanderAngle += random(-0.8, 0.8);
            }
            
            // Cria um vetor de direção com base no ângulo atual
            const wanderDirection = createVector(cos(this.wanderAngle), sin(this.wanderAngle));
            
            // Ajusta a velocidade com base na posição e na idade
            let finalSpeedMultiplier = speedModifier;
            
            // Bactérias mais jovens têm um pouco mais de energia para explorar
            const ageModifier = this.bacteria && typeof this.bacteria.age === 'number' && 
                                typeof this.bacteria.lifespan === 'number' && this.bacteria.lifespan > 0 ?
                                1.0 - (this.bacteria.age / this.bacteria.lifespan) * 0.3 : 1.0;
            
            // Validação de valores numéricos
            if (!isNaN(ageModifier) && isFinite(ageModifier)) {
                finalSpeedMultiplier *= ageModifier;
            }
            
            // Aplica a velocidade final com validação para evitar NaN
            if (!isNaN(finalSpeedMultiplier) && isFinite(finalSpeedMultiplier)) {
                wanderDirection.mult(finalSpeedMultiplier * 0.8);
            } else {
                // Em caso de erro, usa um valor seguro
                wanderDirection.mult(0.5);
            }
            
            // Aplica a direção como força de steering
            this.movement.setDirection(wanderDirection);
            
            // Atualiza o movimento com os parâmetros necessários
            const ageRatio = this.bacteria && typeof this.bacteria.age === 'number' && 
                             typeof this.bacteria.lifespan === 'number' && this.bacteria.lifespan > 0 ?
                             this.bacteria.age / this.bacteria.lifespan : 0.5;
            
            const obstacles = this.bacteria.environment?.obstacles || [];
            const size = this.bacteria.size || 10;
            const isResting = this.bacteria.stateManager?.currentState === 'resting';
            
            // Atualiza o movimento, agora usando a interface correta
            this.movement.update(ageRatio, obstacles, size, true, isResting);
            
            // Sincroniza a posição da bactéria com o sistema de movimento
            this.bacteria.pos.x = this.movement.position.x;
            this.bacteria.pos.y = this.movement.position.y;
        } catch (error) {
            console.error("Erro ao mover aleatoriamente:", error);
        }
    }

    /**
     * Move a bactéria em direção a uma posição com comportamento natural
     * @param {p5.Vector} target - Posição alvo
     * @param {number} deltaTime - Tempo desde o último frame
     * @param {number} speedMultiplier - Multiplicador de velocidade (opcional)
     */
    moveTowards(target, deltaTime, speedMultiplier = 1.0) {
        // Verifica se target é válido
        if (!target || !target.x || !target.y) return;
        
        try {
            // Valores padrão
            deltaTime = deltaTime || 1;
            
            // Cria um vetor do ponto atual para o alvo
            const desiredDirection = p5.Vector.sub(target, this.bacteria.pos);
            
            // Calcula a distância ao alvo
            const distanceToTarget = desiredDirection.mag();
            
            // Normaliza o vetor de direção
            desiredDirection.normalize();
            
            // Aplica o multiplicador de velocidade baseado na proximidade ao alvo (desacelera ao se aproximar)
            const arrivalFactor = map(
                constrain(distanceToTarget, 0, 100), 
                0, 100, 
                0.3, 1.0
            ); // Desacelera ao se aproximar do alvo
            
            // Incorpora o gene de velocidade se disponível
            let finalSpeed = speedMultiplier * arrivalFactor;
            if (this.bacteria && this.bacteria.dna && this.bacteria.dna.genes) {
                const geneSpeed = this.bacteria.dna.genes.speed || 1;
                finalSpeed *= geneSpeed;
            }
            
            // Aplica a velocidade à direção
            desiredDirection.mult(finalSpeed);
            
            // Define a direção no sistema de movimento (usando steering behaviors)
            this.movement.setDirection(desiredDirection);
            
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
            const obstacles = this.bacteria.simulation ? this.bacteria.simulation.obstacles : [];
            
            // Atualiza o movimento usando a interface correta
            this.movement.update(
                ageRatio,
                obstacles,
                this.bacteria.size,
                true,  // Evitar bordas
                isResting
            );
            
            // Sincroniza a posição da bactéria com o sistema de movimento
            this.bacteria.pos.x = this.movement.position.x;
            this.bacteria.pos.y = this.movement.position.y;
        } catch (error) {
            console.error("Erro ao mover em direção ao alvo:", error);
        }
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
     * Faz com que a bactéria evite obstáculos
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} deltaTime - Delta de tempo
     * @returns {boolean} - Se evitou algum obstáculo
     */
    avoidObstacles(obstacles, deltaTime) {
        if (!obstacles || obstacles.length === 0) {
            return false;
        }
        
        // Garante que o movimento está inicializado
        if (!this.movement || !this.movement.obstacle) {
            console.warn("Sistema de movimento não inicializado corretamente para evitar obstáculos");
            return false;
        }
        
        let obstaclesToAvoid = [];
        const size = this.bacteria.size || 10;
        
        // Filtra apenas obstáculos próximos para melhorar a performance
        for (const obstacle of obstacles) {
            // Verificação de segurança para obstáculo
            if (!obstacle || !obstacle.collidesWith) continue;
            
            // Calcula a distância aproximada para rápida verificação
            const approximateDistance = this.getApproximateDistance(obstacle);
            const detectionRadius = size * 15; // Aumentado o raio de detecção para detecção mais precoce
            
            // Se o obstáculo estiver próximo, adiciona à lista
            if (approximateDistance < detectionRadius) {
                // Verificação adicional de colisão
                const safetyMargin = size * 2.0; // Aumentado a margem de segurança
                if (obstacle.collidesWith(this.bacteria.pos, safetyMargin)) {
                    // Se já está em colisão, aplica uma força de repulsão muito mais forte
                    this.handleObstacleCollision(obstacle, size);
                    return true;
                }
                
                // Adiciona à lista de obstáculos a serem evitados
                obstaclesToAvoid.push(obstacle);
            }
        }
        
        // Se há obstáculos para evitar, use o sistema de movimento para evitá-los
        if (obstaclesToAvoid.length > 0) {
            // Usa o sistema de movimento para evitar os obstáculos
            let avoided = this.movement.obstacle.avoidObstacles(obstaclesToAvoid, size);
            
            // Verifica a direção atual e o próximo ponto de movimento
            if (!avoided) {
                const velocity = this.movement.velocity || this.movement.base.velocity;
                if (velocity && velocity.mag() > 0.1) {
                    // Prevê posição futura com alcance maior
                    const predictedPos = createVector(
                        this.bacteria.pos.x + velocity.x * 15, // Aumentado o alcance de previsão
                        this.bacteria.pos.y + velocity.y * 15
                    );
                    
                    // Verifica se a posição prevista colide com algum obstáculo
                    for (const obstacle of obstaclesToAvoid) {
                        if (obstacle.collidesWith(predictedPos, size * 1.2)) { // Margem de segurança aumentada
                            // Se colide, aplica uma força na direção oposta
                            const obstacleCenter = createVector(
                                obstacle.x + obstacle.w/2,
                                obstacle.y + obstacle.h/2
                            );
                            const awayVector = p5.Vector.sub(this.bacteria.pos, obstacleCenter);
                            awayVector.normalize();
                            awayVector.mult(5.0); // Força de repulsão aumentada
                            
                            this.movement.applyForce(awayVector);
                            avoided = true;
                            break;
                        }
                    }
                }
            }
            
            return avoided;
        }
        
        return false;
    }
    
    /**
     * Calcula a distância aproximada a um obstáculo (mais rápido que dist)
     * @param {Object} obstacle - O obstáculo
     * @returns {number} - A distância aproximada
     */
    getApproximateDistance(obstacle) {
        const obstacleCenter = {
            x: obstacle.x + obstacle.w/2,
            y: obstacle.y + obstacle.h/2
        };
        
        const dx = this.bacteria.pos.x - obstacleCenter.x;
        const dy = this.bacteria.pos.y - obstacleCenter.y;
        
        // Distância aproximada (ignora raiz quadrada para maior performance)
        return dx*dx + dy*dy;
    }
    
    /**
     * Lida com colisão direta com obstáculo
     * @param {Object} obstacle - O obstáculo
     * @param {number} size - Tamanho da bactéria
     */
    handleObstacleCollision(obstacle, size) {
        // Calcula o centro do obstáculo
        const obstacleCenter = createVector(
            obstacle.x + obstacle.w/2,
            obstacle.y + obstacle.h/2
        );
        
        // Calcula vetor de fuga
        const escapeVector = p5.Vector.sub(this.bacteria.pos, obstacleCenter);
        escapeVector.normalize();
        
        // Força muito mais forte para garantir que saia do obstáculo
        escapeVector.mult(size * 1.5); // Aumentado significativamente
        
        // Aplica o vetor de fuga diretamente à posição
        this.bacteria.pos.add(escapeVector);
        
        // Reduz velocidade atual drasticamente para evitar continuar na mesma direção
        if (this.movement && this.movement.velocity) {
            this.movement.velocity.mult(0.2); // Reduz mais a velocidade
        }
        
        // Se ainda está em colisão, move um pouco mais e tenta em diferentes ângulos
        if (obstacle.collidesWith(this.bacteria.pos, size)) {
            // Primeira tentativa: adicionar mais movimento na mesma direção
            this.bacteria.pos.add(escapeVector);
            
            // Segunda tentativa: tentar um ângulo ligeiramente diferente
            if (obstacle.collidesWith(this.bacteria.pos, size)) {
                const angle = random(-PI/4, PI/4);
                escapeVector.rotate(angle);
                escapeVector.mult(1.5); // Força ainda maior
                this.bacteria.pos.add(escapeVector);
                
                // Log para debug
                console.log(`Colisão persistente com obstáculo. Tentando ângulo alternativo: ${angle}`);
            }
        }
        
        // Garante que a posição está sincronizada com o sistema de movimento
        if (this.movement && this.movement.base) {
            this.movement.base.position.x = this.bacteria.pos.x;
            this.movement.base.position.y = this.bacteria.pos.y;
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

    /**
     * Atualiza o sistema de movimento
     * @param {Object} stateActions - Ações do estado atual
     * @param {Object} environment - Condições do ambiente
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(stateActions, environment, deltaTime = 1) {
        try {
            // Verifica se o movement e a bactéria existem
            if (!this.movement || !this.bacteria) {
                console.warn("Sistema de movimento ou bactéria não disponível");
                return;
            }
            
            // Sincroniza a posição antes da atualização para corrigir possíveis valores NaN
            this.syncPosition();
            
            // Inicializa stateActions caso não seja fornecido
            stateActions = stateActions || {};
            
            // Se não deve se mover, para o movimento
            if (stateActions && stateActions.shouldMove === false) {
                this.stop();
                return;
            } else {
                this.resume();
            }
            
            // Variável para rastrear se algum movimento foi aplicado
            let movementApplied = false;
            
            // Verifica se há outras bactérias para interagir
            if (environment && Array.isArray(environment.nearbyBacteria) && environment.nearbyBacteria.length > 0) {
                this.interactWithBacteria(environment.nearbyBacteria, environment);
            }
            
            // Determina o comportamento com base nas condições do ambiente
            if (stateActions.targetType === 'food' && stateActions.target) {
                // Move em direção à comida
                try {
                    this.seekTarget(stateActions.target, stateActions.speedMultiplier || 1.2);
                    movementApplied = true;
                } catch (err) {
                    console.error("Erro ao buscar comida:", err);
                }
            } else if (stateActions.targetType === 'mate' && stateActions.target) {
                // Move em direção ao parceiro
                try {
                    this.seekTarget(stateActions.target, stateActions.speedMultiplier || 0.8);
                    movementApplied = true;
                } catch (err) {
                    console.error("Erro ao buscar parceiro:", err);
                }
            } else if (stateActions.targetType === 'escape' && stateActions.target) {
                // Foge do perigo
                try {
                    this.fleeFrom(stateActions.target, stateActions.speedMultiplier || 1.5);
                    movementApplied = true;
                } catch (err) {
                    console.error("Erro ao fugir:", err);
                }
            }
            
            // Se nenhum movimento específico foi aplicado OU a velocidade está muito baixa,
            // aplica movimento aleatório como fallback
            if (!movementApplied || (this.movement && this.movement.velocity && this.movement.velocity.mag() < 0.3)) {
                // Calcula um multiplicador de velocidade baseado na energia
                let speedModifier = 1.0;
                
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
                }
                
                // Garante um multiplicador mínimo para evitar imobilidade
                speedModifier = Math.max(speedModifier, 0.5);
                
                // Aplica movimento aleatório
                this.moveRandom(deltaTime, speedModifier);
                
                if (frameCount % 180 === 0) {
                    console.log(`Bactéria ${this.bacteria.id} movendo aleatoriamente (fallback): speed=${speedModifier.toFixed(2)}`);
                }
            }
            
            // Sincroniza a posição da bactéria com o sistema de movimento e corrige valores NaN
            this.syncPosition();
            
            // Evita obstáculos
            if (environment && environment.obstacles && environment.obstacles.length > 0) {
                try {
                    this.avoidObstacles(environment.obstacles, deltaTime);
                } catch (err) {
                    console.error("Erro ao evitar obstáculos:", err);
                }
            }
            
            // Verifica mais uma vez se a posição está válida após todas as atualizações
            if (this.bacteria && this.bacteria.pos) {
                if (isNaN(this.bacteria.pos.x) || isNaN(this.bacteria.pos.y)) {
                    console.warn(`Posição inválida detectada após atualização na bactéria ${this.bacteria.id}. Corrigindo...`);
                    this.syncPosition();
                }
            }
        } catch (error) {
            console.error("Erro geral no sistema de movimento:", error);
            // Tenta recuperar o sistema em caso de erro grave
            if (this.bacteria && this.movement) {
                try {
                    // Reinicia a posição e velocidade para valores seguros
                    const pos = createVector(random(width), random(height));
                    this.bacteria.pos = pos.copy();
                    this.movement.position = pos.copy();
                    this.movement.velocity = p5.Vector.random2D().mult(1.0);
                } catch (e) {
                    console.error("Erro na recuperação de emergência:", e);
                }
            }
        }
    }

    /**
     * Move a bactéria em direção a um alvo específico
     * @param {Object} target - O alvo para seguir
     * @param {number} speedMultiplier - Multiplicador de velocidade
     */
    seekTarget(target, speedMultiplier = 1.0) {
        try {
            // Verificar se o alvo existe e tem posição
            if (!target) {
                console.warn("Alvo inválido para seekTarget");
                this.moveRandom(1);
                return;
            }
            
            // Obter a posição do alvo
            let targetPos;
            if (target.pos) {
                targetPos = target.pos;
            } else if (target.position) {
                targetPos = target.position;
            } else if (target.x !== undefined && target.y !== undefined) {
                targetPos = target;
            } else {
                console.warn("Alvo sem posição válida para seekTarget");
                this.moveRandom(1);
                return;
            }
            
            // Calcular vetor de direção para o alvo
            const dir = createVector(targetPos.x - this.bacteria.pos.x, targetPos.y - this.bacteria.pos.y);
            const distance = dir.mag();
            
            // Se estiver muito perto do alvo, diminui a velocidade
            const finalMultiplier = distance < this.bacteria.size * 2 ? speedMultiplier * 0.5 : speedMultiplier;
            
            // Normaliza a direção e aplica o multiplicador de velocidade
            dir.normalize();
            dir.mult(finalMultiplier);
            
            // Define a direção no sistema de movimento
            if (this.movement) {
                this.movement.setDirection(dir);
                
                // Atualiza o movimento
                const ageRatio = this.bacteria.age / (this.bacteria.lifespan || 3000);
                const obstacles = this.bacteria.environment?.obstacles || [];
                const size = this.bacteria.size || 10;
                const isResting = false; // Nunca descansa enquanto segue um alvo
                
                this.movement.update(ageRatio, obstacles, size, false, 1);
            }
            
            if (frameCount % 240 === 0) {
                console.log(`Bactéria ${this.bacteria.id}: seguindo alvo - distância=${distance.toFixed(2)}`);
            }
        } catch (error) {
            console.error("Erro em seekTarget:", error);
            // Fallback para movimento aleatório em caso de erro
            this.moveRandom(1);
        }
    }

    /**
     * Move a bactéria para longe de um alvo (fugir)
     * @param {Object} target - O alvo para fugir
     * @param {number} speedMultiplier - Multiplicador de velocidade
     */
    fleeFrom(target, speedMultiplier = 1.5) {
        try {
            // Verificar se o alvo existe e tem posição
            if (!target) {
                console.warn("Alvo inválido para fleeFrom");
                this.moveRandom(1);
                return;
            }
            
            // Obter a posição do alvo
            let targetPos;
            if (target.pos) {
                targetPos = target.pos;
            } else if (target.position) {
                targetPos = target.position;
            } else if (target.x !== undefined && target.y !== undefined) {
                targetPos = target;
            } else {
                console.warn("Alvo sem posição válida para fleeFrom");
                this.moveRandom(1);
                return;
            }
            
            // Calcular vetor de fuga (direção OPOSTA ao alvo)
            const dir = createVector(this.bacteria.pos.x - targetPos.x, this.bacteria.pos.y - targetPos.y);
            const distance = dir.mag();
            
            // Se estiver muito perto do perigo, aumenta a velocidade
            const finalMultiplier = distance < this.bacteria.size * 5 ? speedMultiplier * 1.8 : speedMultiplier;
            
            // Se estiver muito perto, adiciona componente aleatório para evitar ficar preso
            if (distance < this.bacteria.size * 3) {
                const randomEscape = p5.Vector.random2D();
                randomEscape.mult(0.7);
                dir.add(randomEscape);
            }
            
            // Normaliza a direção e aplica o multiplicador de velocidade
            dir.normalize();
            dir.mult(finalMultiplier);
            
            // Define a direção no sistema de movimento
            if (this.movement) {
                this.movement.setDirection(dir);
                
                // Atualiza o movimento com prioridade máxima
                const ageRatio = this.bacteria.age / (this.bacteria.lifespan || 3000);
                const obstacles = this.bacteria.environment?.obstacles || [];
                const size = this.bacteria.size || 10;
                const isResting = false; // Nunca descansa durante fuga
                
                this.movement.update(ageRatio, obstacles, size, false, 1);
            }
            
            if (frameCount % 180 === 0) {
                console.log(`Bactéria ${this.bacteria.id}: fugindo de perigo - distância=${distance.toFixed(2)}`);
            }
        } catch (error) {
            console.error("Erro em fleeFrom:", error);
            // Fallback para movimento aleatório em caso de erro
            this.moveRandom(1);
        }
    }

    /**
     * Sincroniza a posição da bactéria com o sistema de movimento
     * Garante que não haja valores NaN
     */
    syncPosition() {
        if (!this.bacteria || !this.movement || !this.movement.position) return;
        
        try {
            // Verifica se há valores NaN na posição do movimento
            if (isNaN(this.movement.position.x) || isNaN(this.movement.position.y)) {
                console.warn("Corrigindo valores NaN na posição do movimento");
                
                // Usa a posição da bactéria se for válida, ou gera nova posição
                if (this.bacteria.pos && !isNaN(this.bacteria.pos.x) && !isNaN(this.bacteria.pos.y)) {
                    this.movement.position.x = this.bacteria.pos.x;
                    this.movement.position.y = this.bacteria.pos.y;
                } else {
                    this.movement.position.x = random(width);
                    this.movement.position.y = random(height);
                    
                    // Atualiza também a posição da bactéria
                    if (this.bacteria.pos) {
                        this.bacteria.pos.x = this.movement.position.x;
                        this.bacteria.pos.y = this.movement.position.y;
                    }
                }
            } 
            // Verifica se há valores NaN na posição da bactéria
            else if (this.bacteria.pos && (isNaN(this.bacteria.pos.x) || isNaN(this.bacteria.pos.y))) {
                console.warn("Corrigindo valores NaN na posição da bactéria");
                
                // Usa a posição do sistema de movimento
                this.bacteria.pos.x = this.movement.position.x;
                this.bacteria.pos.y = this.movement.position.y;
            }
            
            // Sincroniza as posições em ambas as direções para garantir consistência
            if (this.movement.position && this.bacteria.pos) {
                this.bacteria.pos.x = this.movement.position.x;
                this.bacteria.pos.y = this.movement.position.y;
            }
        } catch (error) {
            console.error("Erro ao sincronizar posição:", error);
            
            // Em caso de erro grave, reinicia ambas as posições
            const newX = random(width);
            const newY = random(height);
            
            if (this.bacteria.pos) {
                this.bacteria.pos.x = newX;
                this.bacteria.pos.y = newY;
            }
            
            if (this.movement.position) {
                this.movement.position.x = newX;
                this.movement.position.y = newY;
            }
        }
    }

    /**
     * Interage com outras bactérias no ambiente
     * @param {Array} bacterias - Lista de bactérias próximas
     * @param {Object} conditions - Condições do ambiente
     */
    interactWithBacteria(bacterias, conditions) {
        if (!bacterias || !Array.isArray(bacterias) || bacterias.length === 0) return;
        
        try {
            // Recupera diferentes tipos de bactérias próximas
            const sameSpecies = conditions?.sameSpeciesBacteria || [];
            const differentSpecies = conditions?.differentSpeciesBacteria || [];
            
            // Comportamento de grupo com bactérias da mesma espécie
            this.flock(sameSpecies);
            
            // Evita bactérias de espécies diferentes se não estiver buscando acasalar
            if (this.bacteria.stateManager && 
                this.bacteria.stateManager.currentState !== 'reproducing' &&
                differentSpecies.length > 0) {
                
                this.avoidOtherSpecies(differentSpecies);
            }
        } catch (error) {
            console.error("Erro ao interagir com outras bactérias:", error);
        }
    }
    
    /**
     * Comportamento de grupo (flocking) com bactérias da mesma espécie
     * @param {Array} sameBacteria - Lista de bactérias da mesma espécie
     */
    flock(sameBacteria) {
        if (!sameBacteria || sameBacteria.length === 0) return;
        
        try {
            // Vetores para os comportamentos de grupo
            const separation = createVector(0, 0);
            const alignment = createVector(0, 0);
            const cohesion = createVector(0, 0);
            
            let separationCount = 0;
            let alignmentCount = 0;
            let cohesionCount = 0;
            
            // Parâmetros para cada comportamento
            const minDistance = this.bacteria.size * 2; // Distância mínima para separação
            const alignmentDistance = this.bacteria.size * 5; // Distância para alinhamento
            const cohesionDistance = this.bacteria.size * 7; // Distância para coesão
            
            // Calcula forças para cada bactéria próxima
            for (const other of sameBacteria) {
                if (!other || !other.pos) continue;
                
                const distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, other.pos.x, other.pos.y);
                
                // Separação (evitar ficar muito próximo)
                if (distance < minDistance) {
                    const diff = createVector(
                        this.bacteria.pos.x - other.pos.x,
                        this.bacteria.pos.y - other.pos.y
                    );
                    diff.normalize();
                    diff.div(Math.max(0.1, distance)); // Quanto mais perto, mais forte a separação
                    separation.add(diff);
                    separationCount++;
                }
                
                // Alinhamento (seguir a mesma direção)
                if (distance < alignmentDistance) {
                    // Tenta obter a velocidade da outra bactéria
                    let velocity;
                    
                    if (other.movement && other.movement.velocity) {
                        velocity = other.movement.velocity;
                    } else if (other.velocity) {
                        velocity = other.velocity;
                    } else {
                        // Se não tem velocidade, tenta inferir pela mudança de posição
                        const pos = other.pos;
                        if (other.prevPos) {
                            velocity = createVector(pos.x - other.prevPos.x, pos.y - other.prevPos.y);
                        } else {
                            continue; // Sem informação de direção, pula
                        }
                    }
                    
                    alignment.add(velocity);
                    alignmentCount++;
                }
                
                // Coesão (manter-se próximo do grupo)
                if (distance < cohesionDistance) {
                    cohesion.add(other.pos);
                    cohesionCount++;
                }
            }
            
            // Calcula a média para cada comportamento
            let finalForce = createVector(0, 0);
            
            // Aplica separação
            if (separationCount > 0) {
                separation.div(separationCount);
                separation.normalize();
                separation.mult(1.5); // Peso da separação
                finalForce.add(separation);
            }
            
            // Aplica alinhamento
            if (alignmentCount > 0) {
                alignment.div(alignmentCount);
                alignment.normalize();
                alignment.mult(1.0); // Peso do alinhamento
                finalForce.add(alignment);
            }
            
            // Aplica coesão
            if (cohesionCount > 0) {
                cohesion.div(cohesionCount);
                cohesion.sub(this.bacteria.pos); // Direção ao centro do grupo
                cohesion.normalize();
                cohesion.mult(0.8); // Peso da coesão
                finalForce.add(cohesion);
            }
            
            // Se há alguma força para aplicar
            if (finalForce.mag() > 0) {
                finalForce.normalize();
                finalForce.mult(0.3); // Força do comportamento de grupo (suave)
                
                // Adiciona um pouco de ruído para comportamento mais natural
                const noise = p5.Vector.random2D().mult(0.1);
                finalForce.add(noise);
                
                // Aplica a força resultante
                this.applyForce(finalForce);
                
                // Log de depuração
                if (this.bacteria && this.bacteria.age % 300 === 0) {
                    console.log(`Bactéria ${this.bacteria.id} aplicando comportamento de grupo com ${sameBacteria.length} bactérias - força: ${finalForce.mag().toFixed(2)}`);
                }
            }
        } catch (error) {
            console.error("Erro no comportamento de grupo:", error);
        }
    }
    
    /**
     * Evita bactérias de espécies diferentes
     * @param {Array} otherBacteria - Lista de bactérias de outras espécies
     */
    avoidOtherSpecies(otherBacteria) {
        if (!otherBacteria || otherBacteria.length === 0) return;
        
        try {
            const avoidanceForce = createVector(0, 0);
            let count = 0;
            
            for (const other of otherBacteria) {
                if (!other || !other.pos) continue;
                
                // Calcula distância
                const distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, other.pos.x, other.pos.y);
                
                // Se estiver dentro da área de evitação
                const avoidanceDistance = this.bacteria.size * 4;
                if (distance < avoidanceDistance) {
                    // Direção oposta à outra bactéria
                    const diff = createVector(
                        this.bacteria.pos.x - other.pos.x,
                        this.bacteria.pos.y - other.pos.y
                    );
                    diff.normalize();
                    diff.div(Math.max(0.1, distance / 2)); // Quanto mais perto, mais forte a repulsão
                    avoidanceForce.add(diff);
                    count++;
                }
            }
            
            // Se encontrou bactérias para evitar
            if (count > 0) {
                avoidanceForce.div(count);
                avoidanceForce.normalize();
                avoidanceForce.mult(1.2); // Força para evitar outras espécies
                
                // Aplica a força
                this.applyForce(avoidanceForce);
                
                // Log de depuração
                if (this.bacteria && this.bacteria.age % 300 === 0) {
                    console.log(`Bactéria ${this.bacteria.id} evitando ${count} bactérias de espécies diferentes - força: ${avoidanceForce.mag().toFixed(2)}`);
                }
            }
        } catch (error) {
            console.error("Erro ao evitar outras espécies:", error);
        }
    }
}

// Exporta a classe para uso global
window.BacteriaMovement = BacteriaMovement; 