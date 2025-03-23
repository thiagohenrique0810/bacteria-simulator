/**
 * Classe base do sistema de movimento para as bactérias
 */
class MovementBase {
    /**
     * Inicializa o sistema de movimento base
     * @param {p5.Vector} position - Posição inicial
     * @param {number} size - Tamanho da bactéria
     */
    constructor(position, size) {
        this.position = position;
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.size = size;
        this.isStopped = false;
        this.stuckCounter = 0;
        
        // Adiciona propriedades para movimentos mais naturais
        this.desiredVelocity = createVector(0, 0);
        this.inertiaFactor = 0.92; // Fator de inércia para suavizar mudanças
        this.noiseOffsetX = random(1000); // Offset para ruído Perlin X
        this.noiseOffsetY = random(1000); // Offset para ruído Perlin Y
        this.noiseStep = 0.005;      // Velocidade de mudança do ruído
        this.noiseMagnitude = 0.3;   // Intensidade do ruído no movimento
    }

    /**
     * Para o movimento da bactéria
     */
    stop() {
        this.isStopped = true;
        this.velocity.mult(0);
        this.acceleration.mult(0);
    }

    /**
     * Retoma o movimento da bactéria
     */
    resume() {
        this.isStopped = false;
    }

    /**
     * Aplica uma força ao movimento
     * @param {p5.Vector} force - Força a ser aplicada
     */
    applyForce(force) {
        if (!force) {
            console.warn("Tentativa de aplicar força nula");
            return;
        }
        
        // Cria uma cópia da força para não modificar o original
        let forceCopy;
        try {
            forceCopy = force.copy();
        } catch (error) {
            console.error("Erro ao copiar força:", error);
            // Tenta criar um novo vetor como fallback
            forceCopy = createVector(0, 0);
            if (typeof force.x === 'number' && typeof force.y === 'number') {
                forceCopy.x = force.x;
                forceCopy.y = force.y;
            } else {
                return; // Não pode continuar com força inválida
            }
        }
        
        // Verifica se a força tem valores NaN
        if (this.validateVector(forceCopy, 0, 0)) {
            console.warn("Força com valores NaN foi corrigida");
        }
        
        // Limita a magnitude da força para evitar valores extremos
        const maxForceLimit = 10; // Limite máximo para evitar explosões
        if (forceCopy.mag() > maxForceLimit) {
            forceCopy.setMag(maxForceLimit);
            console.warn(`Força excessiva limitada a ${maxForceLimit}`);
        }
        
        // Aplica a força à aceleração com suavização
        this.acceleration.add(forceCopy);
        
        // Verifica a aceleração após adicionar a força
        this.validateVector(this.acceleration, 0, 0);
    }

    /**
     * Aplica amortecimento à velocidade atual
     * @param {number} damping - Fator de amortecimento (0-1)
     */
    applyDamping(damping) {
        if (this.velocity) {
            this.velocity.mult(damping);
        }
    }

    /**
     * Define a direção do movimento usando inércia para suavizar transições
     * @param {p5.Vector} direction - Vetor de direção normalizado
     */
    setDirection(direction) {
        if (!direction) return;
        
        // Define a velocidade desejada
        this.desiredVelocity = direction.copy();
        this.desiredVelocity.normalize();
        this.desiredVelocity.mult(this.maxSpeed);
        
        // Calcula a força de direção com suavização (steering behavior)
        const steeringForce = p5.Vector.sub(this.desiredVelocity, this.velocity);
        steeringForce.limit(this.maxForce);
        
        // Aplica a força com inércia
        this.applyForce(steeringForce);
    }

    /**
     * Aplica ruído Perlin ao movimento para torná-lo mais natural e exploratório
     * @param {number} intensity - Intensidade do ruído (0-1)
     */
    applyPerlinNoise(intensity = 1.0) {
        // Avança os offsets do ruído
        this.noiseOffsetX += this.noiseStep;
        this.noiseOffsetY += this.noiseStep;
        
        // Adiciona variação extra para evitar padrões repetitivos
        if (frameCount % 120 === 0) {
            this.noiseOffsetX += random(-0.5, 0.5);
            this.noiseOffsetY += random(-0.5, 0.5);
        }
        
        // Calcula o ruído Perlin (valores entre 0 e 1)
        const noiseX = noise(this.noiseOffsetX) * 2 - 1; // Converte para -1 a 1
        const noiseY = noise(this.noiseOffsetY + 1000) * 2 - 1; // Usa offset diferente para Y
        
        // Cria um vetor de força baseado no ruído
        const noiseForce = createVector(noiseX, noiseY);
        
        // Adiciona tendência para explorar o centro do ambiente
        const worldWidth = typeof width !== 'undefined' ? width : 800;
        const worldHeight = typeof height !== 'undefined' ? height : 600;
        const center = createVector(worldWidth/2, worldHeight/2);
        
        // Vetor da posição atual ao centro
        const toCenter = p5.Vector.sub(center, this.position);
        const distToCenter = toCenter.mag();
        
        // Se estiver muito perto das bordas, aumenta a tendência de ir para o centro
        const borderDistance = min(
            this.position.x, 
            worldWidth - this.position.x, 
            this.position.y, 
            worldHeight - this.position.y
        );
        
        // Calcula um fator de exploração que incentiva ir para áreas inexploradas
        // Quanto mais longe do centro e das bordas, maior a exploração
        const explorationBias = map(
            distToCenter, 
            0, 
            worldWidth/2, 
            0.2,  // Menor tendência de explorar se estiver no centro
            0.7   // Maior tendência se estiver longe do centro
        );
        
        // Determina a contribuição da força de ruído
        noiseForce.mult(this.noiseMagnitude * intensity * explorationBias);
        
        // Adiciona um componente para evitar cantos
        if (borderDistance < 50) {
            toCenter.normalize();
            toCenter.mult(0.2 * (1 - borderDistance/50)); // Mais forte quanto mais perto da borda
            noiseForce.add(toCenter);
        }
        
        // Aplica a força do ruído
        this.applyForce(noiseForce);
    }

    /**
     * Obtém a posição atual
     * @returns {p5.Vector} - A posição atual
     */
    getPosition() {
        return this.position.copy();
    }

    /**
     * Verifica se um vetor tem valores NaN e corrige se necessário
     * @param {p5.Vector} vector - Vetor a ser verificado
     * @param {number} defaultX - Valor padrão para X se for NaN
     * @param {number} defaultY - Valor padrão para Y se for NaN
     * @returns {boolean} - True se o vetor foi corrigido
     */
    validateVector(vector, defaultX = 0, defaultY = 0) {
        if (!vector) return false;
        
        let wasFixed = false;
        
        if (isNaN(vector.x)) {
            console.warn("Valor NaN detectado em vector.x, corrigindo...");
            vector.x = defaultX;
            wasFixed = true;
        }
        
        if (isNaN(vector.y)) {
            console.warn("Valor NaN detectado em vector.y, corrigindo...");
            vector.y = defaultY;
            wasFixed = true;
        }
        
        return wasFixed;
    }

    /**
     * Verifica se a posição realmente mudou e aplica medidas para garantir movimento
     * @param {p5.Vector} prevPosition - Posição anterior
     * @param {boolean} isResting - Se está descansando
     * @returns {boolean} - Verdadeiro se houve movimento significativo
     */
    checkMovement(prevPosition, isResting) {
        try {
            // Verifica se as posições são válidas (não são NaN)
            if (isNaN(this.position.x) || isNaN(this.position.y)) {
                console.warn("Posição com valores NaN detectada. Corrigindo...");
                // Corrige a posição para um valor válido
                if (isNaN(this.position.x)) this.position.x = random(width);
                if (isNaN(this.position.y)) this.position.y = random(height);
                // Redefine velocidade para um valor válido também
                if (isNaN(this.velocity.x) || isNaN(this.velocity.y)) {
                    this.velocity = p5.Vector.random2D().mult(2.0);
                }
                // Considera que houve movimento para evitar impulsos adicionais imediatos
                return true;
            }
            
            // Verifica se a posição anterior é válida
            if (!prevPosition || isNaN(prevPosition.x) || isNaN(prevPosition.y)) {
                // Se a posição anterior for inválida, usa a posição atual
                prevPosition = this.position.copy();
                return true;
            }
            
            // Verifica se a posição realmente mudou
            const distMoved = p5.Vector.dist(prevPosition, this.position);
            
            // Ignora verificação se estiver descansando
            if (isResting) {
                return false;
            }
            
            // Se o contador for negativo, significa que acabamos de aplicar um impulso
            // e estamos dando um tempo antes de verificar novamente
            if (this.stuckCounter < 0) {
                this.stuckCounter++;
                return true;
            }
            
            // Se não houver movimento significativo e não deveria estar parado
            if (distMoved < 0.01 && !this.isStopped) {
                // Mantém contagem de ciclos sem movimento
                this.stuckCounter = this.stuckCounter || 0;
                this.stuckCounter++;
                
                // Após 3 ciclos sem movimento, aplica uma força para movimentar
                if (this.stuckCounter > 3) {
                    console.log("Movimento insuficiente detectado! Aplicando impulso.");
                    
                    // Cria um vetor de movimento aleatório mais forte
                    const angle = random(TWO_PI);
                    const forceMove = createVector(cos(angle), sin(angle)).mult(3.0);
                    
                    // Aplica o movimento diretamente à posição
                    this.position.add(forceMove);
                    
                    // Também redefine a velocidade para ter o mesmo sentido
                    this.velocity.set(forceMove);
                    this.velocity.setMag(3.5); // Define magnitude suficiente
                    
                    console.log("Movimento forçado aplicado: magnitude=" + forceMove.mag().toFixed(2));
                    
                    // Reseta contador e define um período de "imunidade"
                    this.stuckCounter = -15; // Valor negativo para dar um tempo antes de verificar novamente
                    return true;
                }
                return false;
            } else {
                // Reseta contador se houve movimento
                this.stuckCounter = 0;
                return distMoved > 0;
            }
        } catch (error) {
            console.error("Erro ao verificar movimento:", error);
            // Em caso de erro, corrige a posição para um valor seguro
            this.position.x = constrain(this.position.x || random(width), 0, width);
            this.position.y = constrain(this.position.y || random(height), 0, height);
            this.velocity = p5.Vector.random2D().mult(1.0);
            return true;
        }
    }

    /**
     * Atualiza o sistema de movimento com inércia e suavização
     * @param {number} ageRatio - Razão da idade (0-1)
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da entidade
     * @param {boolean} avoidEdges - Se deve evitar as bordas
     * @param {boolean} isResting - Se está descansando
     */
    update(ageRatio = 0, obstacles = [], size = 10, avoidEdges = true, isResting = false) {
        // Salva a posição anterior para verificar se houve movimento
        const prevPosition = this.position.copy();
        
        // Se estiver parado, não faz nada
        if (this.isStopped || isResting) {
            this.velocity.mult(0.9); // Diminui a velocidade gradualmente
            return;
        }
        
        // Aplica ruído Perlin para movimento mais natural
        if (!isResting) {
            this.applyPerlinNoise(0.3);
        }
        
        // Atualiza a velocidade com base na aceleração (inércia)
        this.velocity.add(this.acceleration);
        
        // Aplica inércia para suavizar movimentos
        if (this.desiredVelocity.mag() > 0) {
            // Interpola entre a velocidade atual e a desejada
            this.velocity = p5.Vector.lerp(
                this.velocity,
                this.desiredVelocity,
                1 - this.inertiaFactor // Quanto menor o fator, mais suave o movimento
            );
        }
        
        // Limita a velocidade baseada na idade
        let speedLimit = this.maxSpeed * (1 - ageRatio * 0.5);
        this.velocity.limit(speedLimit);
        
        // Aplica a velocidade à posição
        this.position.add(this.velocity);
        
        // Reseta a aceleração para o próximo ciclo
        this.acceleration.mult(0);
        
        // Verifica colisões com obstáculos
        this.handleObstacleCollisions(obstacles, size);
        
        // Mantém dentro dos limites da tela se necessário
        if (avoidEdges) {
            this.constrainToBounds(size);
        }
        
        // Verifica se houve movimento significativo
        this.checkMovement(prevPosition, isResting);
    }
    
    /**
     * Mantém a entidade dentro dos limites do mundo e evita que fique nos cantos
     * @param {number} size - Tamanho da entidade
     */
    constrainToBounds(size) {
        // Usa variáveis globais width e height do p5.js,
        // ou valores padrão se não estiverem disponíveis
        const worldWidth = typeof width !== 'undefined' ? width : 800;
        const worldHeight = typeof height !== 'undefined' ? height : 600;
        
        const margin = size; // Margem para detecção de bordas
        let nearEdge = false;
        let edgeRepulsion = createVector(0, 0);
        
        // Verifica se está próximo da borda esquerda
        if (this.position.x < margin) {
            edgeRepulsion.x += 0.3; // Força de repulsão para direita
            nearEdge = true;
        }
        
        // Verifica se está próximo da borda direita
        if (this.position.x > worldWidth - margin) {
            edgeRepulsion.x -= 0.3; // Força de repulsão para esquerda
            nearEdge = true;
        }
        
        // Verifica se está próximo da borda superior
        if (this.position.y < margin) {
            edgeRepulsion.y += 0.3; // Força de repulsão para baixo
            nearEdge = true;
        }
        
        // Verifica se está próximo da borda inferior
        if (this.position.y > worldHeight - margin) {
            edgeRepulsion.y -= 0.3; // Força de repulsão para cima
            nearEdge = true;
        }
        
        // Se estiver próximo a uma borda, aplica a força de repulsão
        if (nearEdge) {
            // Adiciona um componente aleatório para evitar padrões
            edgeRepulsion.x += random(-0.1, 0.1);
            edgeRepulsion.y += random(-0.1, 0.1);
            
            // Aplica a força de repulsão
            this.applyForce(edgeRepulsion);
        }
        
        // Restringe a posição para garantir que não saia dos limites
        // Usa margem menor para permitir movimento próximo das bordas
        const safeMargin = size / 2;
        this.position.x = constrain(this.position.x, safeMargin, worldWidth - safeMargin);
        this.position.y = constrain(this.position.y, safeMargin, worldHeight - safeMargin);
    }

    /**
     * Método de compatibilidade para código legado
     * Simplesmente chama o novo método update
     * @param {number} ageRatio - Razão da idade (0-1)
     * @param {boolean} isResting - Se está descansando
     * @param {number} deltaTime - Tempo desde o último frame
     * @returns {boolean} - Se houve movimento
     */
    updateBase(ageRatio, isResting, deltaTime = 1/60) {
        try {
            // Chama o novo método update com parâmetros padrão
            this.update(ageRatio, [], this.size, true, isResting);
            return true;
        } catch (error) {
            console.error("Erro em updateBase:", error);
            return false;
        }
    }

    /**
     * Verifica e responde a colisões com obstáculos
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da entidade
     */
    handleObstacleCollisions(obstacles, size) {
        if (!obstacles || !Array.isArray(obstacles) || obstacles.length === 0) {
            return;
        }
        
        try {
            // Processa cada obstáculo
            for (const obstacle of obstacles) {
                // Verifica se o obstáculo tem o método necessário
                if (obstacle && typeof obstacle.collidesWith === 'function') {
                    // Verifica colisão
                    if (obstacle.collidesWith(this.position, size/2)) {
                        // Calcula a direção para se afastar do obstáculo
                        let bounceDirection;
                        
                        // Determina a direção com base no tipo de obstáculo
                        if (obstacle.center) {
                            // Obstáculo com centro definido (circular ou similar)
                            bounceDirection = p5.Vector.sub(this.position, obstacle.center);
                        } else if (obstacle.x !== undefined && obstacle.y !== undefined) {
                            // Obstáculo com posição definida 
                            const obstacleCenter = createVector(
                                obstacle.x + (obstacle.w || obstacle.width || 0) / 2,
                                obstacle.y + (obstacle.h || obstacle.height || 0) / 2
                            );
                            bounceDirection = p5.Vector.sub(this.position, obstacleCenter);
                        } else {
                            // Direção aleatória como fallback
                            bounceDirection = p5.Vector.random2D();
                        }
                        
                        // Normaliza e aplica força de repulsão mais forte
                        bounceDirection.normalize();
                        bounceDirection.mult(this.maxSpeed * 3.0); // Aumentado de 1.5 para 3.0
                        
                        // Define a velocidade para se afastar do obstáculo
                        this.velocity = bounceDirection.copy();
                        
                        // Move a posição para fora do obstáculo com um deslocamento maior
                        const distanceToMove = size * 0.75; // Garantir que saia completamente
                        const displacement = bounceDirection.copy().mult(distanceToMove);
                        this.position.add(displacement);
                        
                        // Verifica novamente se ainda está em colisão e move mais se necessário
                        if (obstacle.collidesWith(this.position, size/2)) {
                            this.position.add(displacement); // Move ainda mais para garantir
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao lidar com colisões de obstáculos:", error);
        }
    }
}

// Exportação da classe
window.MovementBase = MovementBase; 