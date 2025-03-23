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
     * Move a bactéria em uma direção aleatória com comportamento realista
     * @param {number} deltaTime - Tempo desde o último frame
     * @param {number} speedFactor - Multiplicador de velocidade
     */
    moveRandom(deltaTime = 1, speedFactor = 1.0) {
        try {
            // SOLUÇÃO RADICAL: Força o movimento independente de quaisquer sistemas
            console.log(`Movimento radical aplicado à bactéria ${this.bacteria.id}`);
            
            // Garante que a bactéria tem uma posição válida
            if (!this.bacteria.pos) {
                console.error("Bactéria sem posição. Criando posição...");
                this.bacteria.pos = createVector(random(width), random(height));
            }
            
            // Mantém um ângulo de movimento consistente, mas com variações aleatórias
            if (!this._movementAngle) {
                this._movementAngle = random(TWO_PI);
                this._changeDirectionCounter = 0;
            }
            
            // Ocasionalmente muda a direção para tornar o movimento mais interessante
            this._changeDirectionCounter += deltaTime;
            if (this._changeDirectionCounter > 60) { // Muda a cada segundo (60 frames)
                this._movementAngle += random(-PI/4, PI/4); // Varia até 45 graus
                this._changeDirectionCounter = 0;
                
                // Chance pequena de mudar completamente de direção
                if (random() < 0.1) {
                    this._movementAngle = random(TWO_PI);
                }
            }
            
            // Ajusta a velocidade com base no tipo de bactéria
            let speed = 2.0 * speedFactor; // Velocidade base
            
            // Se tiver informação de tipo de bactéria, ajusta velocidade
            if (this.bacteria.visualization && this.bacteria.visualization.bacteriaType !== undefined) {
                const bacteriaType = this.bacteria.visualization.bacteriaType;
                switch (bacteriaType) {
                    case 0: // Bacilo - mais rápido
                        speed = 2.5 * speedFactor;
                        break;
                    case 1: // Coco - mais lento
                        speed = 1.5 * speedFactor;
                        break;
                    case 2: // Espirilo - movimento rápido
                        speed = 3.0 * speedFactor;
                        // Adiciona movimento em espiral
                        this._movementAngle += sin(frameCount * 0.05) * 0.1;
                        break;
                    case 3: // Vibrião - movimento variável
                        // Ocasionalmente acelera
                        speed = (frameCount % 120 < 20) ? 3.0 * speedFactor : 2.0 * speedFactor;
                        break;
                }
            }
            
            // Cria um vetor de movimento direto com base no ângulo e na velocidade
            const moveX = cos(this._movementAngle) * speed * deltaTime;
            const moveY = sin(this._movementAngle) * speed * deltaTime;
            
            // Aplica o movimento DIRETAMENTE à posição da bactéria
            this.bacteria.pos.x += moveX;
            this.bacteria.pos.y += moveY;
            
            // Garante que a bactéria não saia da tela
            const margin = this.bacteria.size || 20;
            const worldWidth = width || 800;
            const worldHeight = height || 600;
            
            // Limites da tela com rebote
            if (this.bacteria.pos.x < margin) {
                this.bacteria.pos.x = margin;
                this._movementAngle = PI - this._movementAngle; // Rebote horizontal
            } else if (this.bacteria.pos.x > worldWidth - margin) {
                this.bacteria.pos.x = worldWidth - margin;
                this._movementAngle = PI - this._movementAngle; // Rebote horizontal
            }
            
            if (this.bacteria.pos.y < margin) {
                this.bacteria.pos.y = margin;
                this._movementAngle = TWO_PI - this._movementAngle; // Rebote vertical
            } else if (this.bacteria.pos.y > worldHeight - margin) {
                this.bacteria.pos.y = worldHeight - margin;
                this._movementAngle = TWO_PI - this._movementAngle; // Rebote vertical
            }
            
            // Sincroniza a posição do sistema de movimento (se existir)
            if (this.movement && this.movement.position) {
                this.movement.position.x = this.bacteria.pos.x;
                this.movement.position.y = this.bacteria.pos.y;
            }
            
            // Log de movimento a cada 60 frames para não sobrecarregar o console
            if (frameCount % 60 === 0) {
                console.log(`Bactéria ${this.bacteria.id} se movendo: (${this.bacteria.pos.x.toFixed(1)}, ${this.bacteria.pos.y.toFixed(1)}), velocidade: ${speed.toFixed(1)}`);
            }
            
        } catch (error) {
            console.error("Erro fatal em moveRandom:", error);
            
            // Último recurso: movimento aleatório simples
            if (this.bacteria && this.bacteria.pos) {
                const randomStep = p5.Vector.random2D().mult(3);
                this.bacteria.pos.add(randomStep);
            }
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
        if (!target) {
            console.warn("Target inválido em moveTowards, usando movimento aleatório");
            this.moveRandom(deltaTime, speedMultiplier);
            return;
        }
        
        try {
            // SOLUÇÃO RADICAL: aplica movimento direto e simples em direção ao alvo
            console.log(`Movimento direcionado radical para bactéria ${this.bacteria.id}`);
            
            // Garante que temos posição válida para a bactéria
            if (!this.bacteria.pos) {
                console.error("Bactéria sem posição em moveTowards. Criando posição...");
                this.bacteria.pos = createVector(random(width), random(height));
            }
            
            // Obtém valores X e Y do target (suporta diferentes formatos)
            const targetX = target.x !== undefined ? target.x : 
                           (target.pos ? target.pos.x : 
                           (target.position ? target.position.x : width/2));
                           
            const targetY = target.y !== undefined ? target.y : 
                           (target.pos ? target.pos.y : 
                           (target.position ? target.position.y : height/2));
            
            // Calcula vetor direção
            const dirX = targetX - this.bacteria.pos.x;
            const dirY = targetY - this.bacteria.pos.y;
            
            // Calcula distância
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Se já chegou no destino, faz pequenos movimentos aleatórios
            if (distance < 5) {
                this.moveRandom(deltaTime, 0.2); // Movimento lento ao redor do alvo
                return;
            }
            
            // Normaliza o vetor direção
            const normalizedDirX = dirX / distance;
            const normalizedDirY = dirY / distance;
            
            // Determina velocidade base com base no tipo de bactéria
            let speed = 2.5 * speedMultiplier; // Velocidade base
            
            // Ajusta com base no tipo se disponível
            if (this.bacteria.visualization && this.bacteria.visualization.bacteriaType !== undefined) {
                const bacteriaType = this.bacteria.visualization.bacteriaType;
                switch (bacteriaType) {
                    case 0: // Bacilo - mais rápido em linha reta
                        speed = 3.0 * speedMultiplier;
                        break;
                    case 1: // Coco - mais lento 
                        speed = 2.0 * speedMultiplier;
                        break;
                    case 2: // Espirilo - rápido mas com caminho espiral
                        speed = 3.5 * speedMultiplier;
                        // Adiciona componente perpendicular ao movimento
                        const perpFactor = sin(frameCount * 0.05) * 0.3;
                        const perpX = -normalizedDirY * perpFactor;
                        const perpY = normalizedDirX * perpFactor;
                        normalizedDirX += perpX;
                        normalizedDirY += perpY;
                        break;
                    case 3: // Vibrião - movimento com acelerações
                        speed = (frameCount % 90 < 30) ? 3.5 * speedMultiplier : 2.0 * speedMultiplier;
                        break;
                }
            }
            
            // Reduz velocidade se estiver perto do alvo para parar suavemente
            if (distance < 50) {
                speed *= distance / 50; // Desacelera gradualmente
                speed = Math.max(speed, 0.5); // Garante velocidade mínima
            }
            
            // Calcula o deslocamento
            const moveX = normalizedDirX * speed * deltaTime;
            const moveY = normalizedDirY * speed * deltaTime;
            
            // Adiciona pequena variação aleatória para movimento mais natural
            const jitterX = random(-0.5, 0.5) * speedMultiplier;
            const jitterY = random(-0.5, 0.5) * speedMultiplier;
            
            // Aplica o movimento DIRETAMENTE à posição da bactéria
            this.bacteria.pos.x += moveX + jitterX;
            this.bacteria.pos.y += moveY + jitterY;
            
            // Garante que a bactéria não saia da tela
            const margin = this.bacteria.size || 20;
            const worldWidth = width || 800;
            const worldHeight = height || 600;
            
            if (this.bacteria.pos.x < margin) this.bacteria.pos.x = margin;
            if (this.bacteria.pos.x > worldWidth - margin) this.bacteria.pos.x = worldWidth - margin;
            if (this.bacteria.pos.y < margin) this.bacteria.pos.y = margin;
            if (this.bacteria.pos.y > worldHeight - margin) this.bacteria.pos.y = worldHeight - margin;
            
            // Sincroniza a posição com o sistema de movimento (se existir)
            if (this.movement && this.movement.position) {
                this.movement.position.x = this.bacteria.pos.x;
                this.movement.position.y = this.bacteria.pos.y;
            }
            
            // Log do movimento a cada 60 frames para não sobrecarregar o console
            if (frameCount % 60 === 0) {
                console.log(`Bactéria ${this.bacteria.id} movendo-se em direção ao alvo: distância=${distance.toFixed(1)}, velocidade=${speed.toFixed(1)}`);
            }
            
        } catch (error) {
            console.error("Erro fatal em moveTowards:", error);
            
            // Movimento de emergência em caso de erro
            if (this.bacteria && this.bacteria.pos) {
                const randomStep = p5.Vector.random2D().mult(2);
                this.bacteria.pos.add(randomStep);
            }
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
        try {
            // Verifica se há obstáculos válidos para evitar
            if (!obstacles || obstacles.length === 0) {
                return false;
            }
            
            // Verifica e garante que a posição da bactéria é válida antes de prosseguir
            if (this.bacteria && (!this.bacteria.pos || typeof this.bacteria.pos.x !== 'number' || typeof this.bacteria.pos.y !== 'number')) {
                console.warn(`Posição inválida durante avoidObstacles - Corrigindo...`);
                
                // Tenta corrigir a posição se for um objeto aninhado
                if (this.bacteria.pos && typeof this.bacteria.pos.x === 'object' && this.bacteria.pos.x && typeof this.bacteria.pos.x.x === 'number') {
                    console.log(`Corrigindo posição aninhada em avoidObstacles:`, this.bacteria.pos);
                    
                    // Usa a posição interna se disponível
                    const newX = this.bacteria.pos.x.x;
                    const newY = typeof this.bacteria.pos.y === 'number' ? this.bacteria.pos.y : 
                                (typeof this.bacteria.pos.x.y === 'number' ? this.bacteria.pos.x.y : height/2);
                    
                    // Atualiza a posição com os valores corretos
                    if (typeof createVector === 'function') {
                        this.bacteria.pos = createVector(newX, newY);
                    } else {
                        this.bacteria.pos = { x: newX, y: newY };
                    }
                    
                    console.log(`Posição corrigida para: (${this.bacteria.pos.x}, ${this.bacteria.pos.y})`);
                } else {
                    // Se não conseguir recuperar, cria uma nova posição válida
                    const worldWidth = typeof width !== 'undefined' ? width : 800;
                    const worldHeight = typeof height !== 'undefined' ? height : 600;
                    
                    if (typeof createVector === 'function') {
                        this.bacteria.pos = createVector(
                            random(worldWidth * 0.1, worldWidth * 0.9),
                            random(worldHeight * 0.1, worldHeight * 0.9)
                        );
                    } else {
                        this.bacteria.pos = { 
                            x: random(worldWidth * 0.1, worldWidth * 0.9),
                            y: random(worldHeight * 0.1, worldHeight * 0.9)
                        };
                    }
                    
                    console.log(`Nova posição gerada: (${this.bacteria.pos.x}, ${this.bacteria.pos.y})`);
                }
                
                // Também sincroniza com o sistema de movimento
                if (this.movement && this.movement.position) {
                    this.movement.position.x = this.bacteria.pos.x;
                    this.movement.position.y = this.bacteria.pos.y;
                }
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
                
                // Verifica novamente a posição após a lógica de evasão
                if (this.bacteria && this.bacteria.pos && typeof this.bacteria.pos.x === 'object') {
                    console.warn("Posição inválida após evitar obstáculos. Corrigindo...");
                    const safeX = typeof this.bacteria.pos.x.x === 'number' ? this.bacteria.pos.x.x : random(width);
                    const safeY = typeof this.bacteria.pos.y === 'number' ? this.bacteria.pos.y : random(height);
                    
                    // Atualiza para valores seguros
                    this.bacteria.pos = typeof createVector === 'function' 
                        ? createVector(safeX, safeY) 
                        : { x: safeX, y: safeY };
                    
                    // Sincroniza com o sistema de movimento
                    if (this.movement && this.movement.position) {
                        this.movement.position.x = this.bacteria.pos.x;
                        this.movement.position.y = this.bacteria.pos.y;
                    }
                }
                
                return avoided;
            }
            
            return false;
        } catch (error) {
            console.error("Erro ao evitar obstáculos:", error);
            return false;
        }
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
        
        // Força mais forte para garantir que saia do obstáculo, mas não exagerada
        escapeVector.mult(size * 1.0);
        
        // Aplica o vetor de fuga diretamente à posição
        this.bacteria.pos.add(escapeVector);
        
        // Reduz velocidade atual, mas não drasticamente (0.5 em vez de 0.2)
        if (this.movement && this.movement.velocity) {
            this.movement.velocity.mult(0.5);
            
            // Garante velocidade mínima para evitar paralisia
            if (this.movement.velocity.mag() < 0.5) {
                // Adiciona uma pequena velocidade mínima na direção de fuga
                this.movement.velocity.add(p5.Vector.mult(escapeVector, 0.5));
            }
        }
        
        // Adiciona um componente aleatório para evitar ficar travado em situações de equilíbrio
        const randomForce = p5.Vector.random2D();
        randomForce.mult(size * 0.3);
        
        // Aplica a força aleatória
        if (this.movement && this.movement.applyForce) {
            this.movement.applyForce(randomForce);
        } else if (this.movement && this.movement.velocity) {
            this.movement.velocity.add(randomForce);
        }
        
        // Log para depuração da colisão
        if (frameCount % 60 === 0) {
            console.log(`Bactéria ${this.bacteria.id} colidiu com obstáculo e foi reposicionada`);
        }
        
        return true;
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
            
            // Inicializa environment caso não seja fornecido
            environment = environment || {
                nearbyFood: [],
                nearbyBacteria: [],
                nearbyPredators: [],
                obstacles: []
            };
            
            // Se não deve se mover, para o movimento
            if (stateActions && stateActions.shouldMove === false) {
                this.stop();
                return;
            } else {
                this.resume();
            }
            
            // Variável para rastrear se algum movimento foi aplicado
            let movementApplied = false;
            
            // Garante que o deltaTime seja válido
            deltaTime = typeof deltaTime === 'number' && !isNaN(deltaTime) ? deltaTime : 1;
            
            // Movimento básico de emergência se não houver interações
            if (!movementApplied) {
                // Aplica um movimento aleatório básico para garantir que há movimento
                this.moveRandom(deltaTime, 0.5);
                movementApplied = true;
            }
            
            // Atualiza a posição da bacteria
            if (this.bacteria && this.bacteria.pos && this.movement && this.movement.position) {
                this.bacteria.pos.x = this.movement.position.x;
                this.bacteria.pos.y = this.movement.position.y;
            }
            
            // Garante que velocidade nunca é um valor inválido
            if (!this.movement.velocity || 
                isNaN(this.movement.velocity.x) || 
                isNaN(this.movement.velocity.y)) {
                
                this.movement.velocity = p5.Vector.random2D();
                this.movement.velocity.mult(2); // Velocidade inicial razoável
            }
            
            // Aplica velocidade máxima para evitar movimento excessivo
            if (typeof this.movement.velocity.limit === 'function') {
                this.movement.velocity.limit(this.maxSpeed);
            }
        } catch (error) {
            console.error("Erro na atualização do movimento da bactéria:", error);
            
            // Movimento de emergência em caso de erro
            this.moveRandom(1, 1);
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
     * Mantém a bactéria dentro dos limites da tela
     */
    constrainToBounds() {
        try {
            // Verifica se há posição para restringir
            if (!this.movement || !this.movement.position) return;
            
            // Recupera dimensões do mundo
            const worldWidth = typeof width !== 'undefined' ? width : 800;
            const worldHeight = typeof height !== 'undefined' ? height : 600;
            
            // Determina o raio da bactéria para evitar que fique parcialmente fora da tela
            const radius = this.bacteria && typeof this.bacteria.size === 'number' ? 
                          this.bacteria.size / 2 : 10;
            
            // Calcula limites seguros
            const minX = radius;
            const maxX = worldWidth - radius;
            const minY = radius;
            const maxY = worldHeight - radius;
            
            // Restringe a posição
            if (this.movement.position.x < minX) {
                this.movement.position.x = minX;
                // Inverte a direção para comportamento de ricochete
                if (this.movement.velocity) this.movement.velocity.x *= -0.8;
            } else if (this.movement.position.x > maxX) {
                this.movement.position.x = maxX;
                if (this.movement.velocity) this.movement.velocity.x *= -0.8;
            }
            
            if (this.movement.position.y < minY) {
                this.movement.position.y = minY;
                if (this.movement.velocity) this.movement.velocity.y *= -0.8;
            } else if (this.movement.position.y > maxY) {
                this.movement.position.y = maxY;
                if (this.movement.velocity) this.movement.velocity.y *= -0.8;
            }
            
            // Atualiza a posição da bactéria para refletir os limites
            if (this.bacteria && this.bacteria.pos) {
                this.bacteria.pos.x = this.movement.position.x;
                this.bacteria.pos.y = this.movement.position.y;
            }
        } catch (error) {
            console.error("Erro ao restringir aos limites:", error);
        }
    }
    
    /**
     * Sincroniza a posição da bactéria com o sistema de movimento
     */
    syncPosition() {
        try {
            // Garante que tanto a bactéria quanto o sistema de movimento têm posições válidas
            if (!this.bacteria || !this.bacteria.pos || !this.movement || !this.movement.position) {
                return;
            }
            
            // Verifica se as posições têm componentes NaN
            if (isNaN(this.bacteria.pos.x) || isNaN(this.bacteria.pos.y)) {
                // Corrige os componentes NaN na posição da bactéria
                this.bacteria.pos.x = isNaN(this.bacteria.pos.x) ? 
                    (typeof width !== 'undefined' ? random(width) : 400) : this.bacteria.pos.x;
                this.bacteria.pos.y = isNaN(this.bacteria.pos.y) ? 
                    (typeof height !== 'undefined' ? random(height) : 300) : this.bacteria.pos.y;
            }
            
            if (isNaN(this.movement.position.x) || isNaN(this.movement.position.y)) {
                // Corrige os componentes NaN na posição do movimento
                this.movement.position.x = isNaN(this.movement.position.x) ? 
                    this.bacteria.pos.x : this.movement.position.x;
                this.movement.position.y = isNaN(this.movement.position.y) ? 
                    this.bacteria.pos.y : this.movement.position.y;
            }
            
            // Sincroniza as posições em ambas as direções para garantir consistência
            this.bacteria.pos.x = this.movement.position.x;
            this.bacteria.pos.y = this.movement.position.y;
        } catch (error) {
            console.error("Erro ao sincronizar posições:", error);
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

    /**
     * Verifica e corrige a posição para garantir que seja um objeto válido com coordenadas numéricas
     * @param {Object} pos - O objeto de posição para verificar
     * @param {number} defaultX - Valor X padrão se inválido
     * @param {number} defaultY - Valor Y padrão se inválido
     * @returns {Object} - Objeto de posição corrigido
     */
    validatePosition(pos, defaultX = width/2, defaultY = height/2) {
        // Verifica se a posição existe
        if (!pos) {
            console.warn("Posição é null ou undefined, criando nova posição");
            return { x: defaultX, y: defaultY };
        }
        
        // Verifica se é um objeto
        if (typeof pos !== 'object') {
            console.warn("Posição não é um objeto, criando nova posição");
            return { x: defaultX, y: defaultY };
        }
        
        // Se pos.x for um objeto (erro comum observado), tenta corrigi-lo
        if (typeof pos.x === 'object') {
            console.warn("Erro: pos.x é um objeto:", pos.x);
            // Tenta usar pos.x.x se disponível, caso contrário usa padrão
            const correctedX = (pos.x && typeof pos.x.x === 'number') ? pos.x.x : defaultX;
            return { 
                x: correctedX,
                y: (typeof pos.y === 'number' && !isNaN(pos.y)) ? pos.y : defaultY
            };
        }
        
        // Verifica se as coordenadas são numéricas
        const validX = typeof pos.x === 'number' && !isNaN(pos.x) && isFinite(pos.x);
        const validY = typeof pos.y === 'number' && !isNaN(pos.y) && isFinite(pos.y);
        
        // Se ambos forem válidos, retorna a posição original
        if (validX && validY) {
            return pos;
        }
        
        // Cria uma nova posição com valores corrigidos
        return {
            x: validX ? pos.x : defaultX,
            y: validY ? pos.y : defaultY
        };
    }

    /**
     * Atualiza a posição da bactéria com base em sua velocidade
     * @param {number} deltaTime - Tempo desde a última atualização
     */
    updatePosition(deltaTime = 1) {
        try {
            // Validar posição e velocidade atuais
            const bacteria = this.bacteria;
            
            if (!bacteria) {
                console.error("Referência à bactéria inválida no movimento");
                return;
            }
            
            // Verificações mais robustas para posição
            if (!bacteria.pos) {
                console.warn("Bactéria sem objeto de posição, criando novo");
                bacteria.pos = { x: width/2, y: height/2 };
            }
            
            // Tratamento específico para caso onde pos.x é um objeto (erro comum)
            if (typeof bacteria.pos.x === 'object') {
                console.warn("Erro: bacteria.pos.x é um objeto. Tentando corrigir:", bacteria.pos.x);
                
                // Tenta extrair o valor numérico de pos.x.x se disponível
                if (bacteria.pos.x && typeof bacteria.pos.x.x === 'number') {
                    const tempX = bacteria.pos.x.x;
                    const tempY = typeof bacteria.pos.y === 'number' ? bacteria.pos.y : height/2;
                    
                    // Cria um novo objeto de posição com valores corretos
                    bacteria.pos = { 
                        x: tempX, 
                        y: tempY 
                    };
                    
                    console.log(`Posição corrigida para: (${bacteria.pos.x}, ${bacteria.pos.y})`);
                } else {
                    // Não foi possível recuperar o valor, usa posição padrão
                    bacteria.pos = { 
                        x: width/2, 
                        y: height/2 
                    };
                    console.warn("Usando posição padrão após falha na correção");
                }
            }
            
            // Verifica e corrige coordenadas NaN ou não-finitas
            if (isNaN(bacteria.pos.x) || !isFinite(bacteria.pos.x) || 
                isNaN(bacteria.pos.y) || !isFinite(bacteria.pos.y)) {
                
                console.warn(`Coordenadas inválidas: (${bacteria.pos.x}, ${bacteria.pos.y}). Corrigindo...`);
                
                // Preserva coordenadas válidas, substitui inválidas
                bacteria.pos.x = (!isNaN(bacteria.pos.x) && isFinite(bacteria.pos.x)) ? 
                                   bacteria.pos.x : width/2;
                bacteria.pos.y = (!isNaN(bacteria.pos.y) && isFinite(bacteria.pos.y)) ? 
                                   bacteria.pos.y : height/2;
                
                console.log(`Coordenadas corrigidas para: (${bacteria.pos.x}, ${bacteria.pos.y})`);
            }
            
            // Validação e correção de velocidade
            if (!bacteria.vel || typeof bacteria.vel !== 'object') {
                console.warn("Objeto de velocidade inválido, recriando");
                this.initVelocity(bacteria);
            } else if (typeof bacteria.vel.x === 'object' || typeof bacteria.vel.y === 'object') {
                // Trata caso onde vel.x ou vel.y são objetos
                console.warn("Velocidade contém objetos aninhados, corrigindo");
                this.initVelocity(bacteria);
            } else if (isNaN(bacteria.vel.x) || isNaN(bacteria.vel.y) || 
                      !isFinite(bacteria.vel.x) || !isFinite(bacteria.vel.y)) {
                console.warn(`Velocidade com valores inválidos: (${bacteria.vel.x}, ${bacteria.vel.y}), corrigindo`);
                
                // Tenta preservar componentes válidos
                const vx = (!isNaN(bacteria.vel.x) && isFinite(bacteria.vel.x)) ? bacteria.vel.x : 0;
                const vy = (!isNaN(bacteria.vel.y) && isFinite(bacteria.vel.y)) ? bacteria.vel.y : 0;
                
                // Se ambos componentes se tornaram zero, inicializa com velocidade aleatória
                if (vx === 0 && vy === 0) {
                    this.initVelocity(bacteria);
                } else {
                    bacteria.vel.x = vx;
                    bacteria.vel.y = vy;
                }
            }
            
            // Verifica se os métodos necessários existem na velocidade
            if (typeof bacteria.vel.add !== 'function' || typeof bacteria.vel.limit !== 'function') {
                console.warn("Métodos de velocidade ausentes, adicionando");
                this.addVectorMethods(bacteria.vel);
            }
            
            // Atualiza posição com base na velocidade
            bacteria.pos.x += bacteria.vel.x * deltaTime;
            bacteria.pos.y += bacteria.vel.y * deltaTime;
            
            // Verifica limites do mundo
            this.checkWorldBoundaries();
            
            // Verificação final da posição
            if (typeof bacteria.pos.x !== 'number' || typeof bacteria.pos.y !== 'number' ||
                isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y) ||
                !isFinite(bacteria.pos.x) || !isFinite(bacteria.pos.y)) {
                
                console.error(`ERRO GRAVE: Posição inválida após atualização: (${bacteria.pos.x}, ${bacteria.pos.y})`);
                bacteria.pos = { 
                    x: width/2, 
                    y: height/2 
                };
            }
        } catch (error) {
            console.error("Erro ao atualizar posição:", error);
            
            // Recuperação de erro crítico
            if (this.bacteria) {
                this.bacteria.pos = { 
                    x: width/2, 
                    y: height/2 
                };
            }
        }
    }
    
    /**
     * Inicializa um objeto de velocidade para a bactéria
     * @param {Bacteria} bacteria - A bactéria para inicializar velocidade
     */
    initVelocity(bacteria) {
        const angle = random(TWO_PI);
        const speed = 3.0;
        
        bacteria.vel = {
            x: cos(angle) * speed,
            y: sin(angle) * speed
        };
        
        this.addVectorMethods(bacteria.vel);
        console.log(`Nova velocidade criada: (${bacteria.vel.x.toFixed(2)}, ${bacteria.vel.y.toFixed(2)})`);
    }
    
    /**
     * Adiciona métodos de vetor a um objeto simples de velocidade
     * @param {Object} vel - Objeto de velocidade
     */
    addVectorMethods(vel) {
        if (!vel) return;
        
        vel.add = function(v) {
            if (!v) return this;
            this.x += (typeof v.x === 'number') ? v.x : 0;
            this.y += (typeof v.y === 'number') ? v.y : 0;
            return this;
        };
        
        vel.limit = function(max) {
            const mSq = this.x * this.x + this.y * this.y;
            if (mSq > max * max) {
                const norm = max / Math.sqrt(mSq);
                this.x *= norm;
                this.y *= norm;
            }
            return this;
        };
    }
}

// Exporta a classe para uso global
window.BacteriaMovement = BacteriaMovement; 