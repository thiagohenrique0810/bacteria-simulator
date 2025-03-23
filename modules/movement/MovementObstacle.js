/**
 * Classe com comportamentos de desvio de obstáculos para o sistema de movimento
 */
class MovementObstacle {
    /**
     * Inicializa o sistema de desvio de obstáculos
     * @param {MovementBase} movementBase - Referência para o sistema base de movimento
     */
    constructor(movementBase) {
        this.base = movementBase;
        this.lookAhead = 30;
        this.avoidForce = 1;
    }
    
    /**
     * Configura os parâmetros de detecção de obstáculos
     * @param {number} lookAhead - Distância de antecipação
     * @param {number} avoidForce - Força aplicada para evitar obstáculos
     */
    setParameters(lookAhead, avoidForce) {
        this.lookAhead = lookAhead || this.lookAhead;
        this.avoidForce = avoidForce || this.avoidForce;
    }

    /**
     * Evita obstáculos
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da bactéria
     * @returns {boolean} - Se encontrou e evitou algum obstáculo
     */
    avoidObstacles(obstacles, size) {
        // Verifica se há obstáculos e velocidade
        if (!obstacles || obstacles.length === 0 || this.base.velocity.mag() < 0.01) {
            return false;
        }
        
        // Aumenta o alcance de detecção e a força de repulsão para detecção precoce
        const lookAheadDist = this.lookAhead * (1 + size/15); // Ajusta baseado no tamanho da bactéria
        
        // Vetor na direção do movimento
        const ahead = createVector(
            this.base.position.x + this.base.velocity.x * lookAheadDist,
            this.base.position.y + this.base.velocity.y * lookAheadDist
        );
        
        // Cria um segundo ponto de verificação para melhorar a detecção
        const aheadHalf = createVector(
            this.base.position.x + this.base.velocity.x * lookAheadDist * 0.5,
            this.base.position.y + this.base.velocity.y * lookAheadDist * 0.5
        );
        
        // Adiciona um terceiro ponto com um ângulo ligeiramente diferente para melhorar a detecção
        const aheadAngled = createVector(
            this.base.velocity.x,
            this.base.velocity.y
        );
        aheadAngled.rotate(PI/6); // 30 graus
        aheadAngled.mult(lookAheadDist * 0.7);
        aheadAngled.add(this.base.position);

        // Ponto mais próximo
        let nearestObstacle = null;
        let nearestDistance = Infinity;
        let colisionDetected = false;

        for (let obstacle of obstacles) {
            // Verifica se o obstáculo é uma instância válida
            if (!(obstacle instanceof window.Obstacle)) {
                console.error('Obstáculo inválido:', obstacle);
                continue;
            }

            // Verifica também se a linha de movimento colide com o obstáculo
            const lineCollision = obstacle.lineCollides(this.base.position, ahead, size * 1.2);
            
            // Verifica colisão com todos os pontos à frente
            const collisionAhead = obstacle.collidesWith(ahead, size * 1.2);
            const collisionAheadHalf = obstacle.collidesWith(aheadHalf, size * 1.2);
            const collisionAheadAngled = obstacle.collidesWith(aheadAngled, size * 1.2);
            
            // Verifica também a colisão com a posição atual para capturar colisões já ocorrendo
            const collisionCurrent = obstacle.collidesWith(this.base.position, size * 1.2);
            
            // Força a bactéria para fora se estiver dentro do obstáculo
            const wasInObstacle = obstacle.pushEntityOut(this.base, size * 1.0);
            if (wasInObstacle) {
                colisionDetected = true;
                // Reduz a velocidade moderadamente (não zera)
                this.base.velocity.mult(0.6);
                
                // Garante velocidade mínima após colisão
                if (this.base.velocity.mag() < 0.5) {
                    const randomDirection = p5.Vector.random2D();
                    randomDirection.mult(0.5);
                    this.base.velocity.add(randomDirection);
                }
            }
            
            if (collisionAhead || collisionAheadHalf || collisionAheadAngled || collisionCurrent || lineCollision) {
                colisionDetected = true;
                
                // Calcula distância até o obstáculo
                const obstacleCenter = createVector(
                    obstacle.x + obstacle.w/2,
                    obstacle.y + obstacle.h/2
                );
                const d = this.base.position.dist(obstacleCenter);
                
                if (d < nearestDistance) {
                    nearestDistance = d;
                    nearestObstacle = obstacle;
                }
            }
        }

        // Se encontrou obstáculo, evita
        if (nearestObstacle) {
            const obstacleCenter = createVector(
                nearestObstacle.x + nearestObstacle.w/2,
                nearestObstacle.y + nearestObstacle.h/2
            );
            
            // Calcula vetor de fuga
            const escape = p5.Vector.sub(this.base.position, obstacleCenter);
            escape.normalize();
            
            // Ajusta a força de escape baseado na proximidade
            // Quanto mais próximo, mais forte a repulsão
            const distanceFactor = Math.max(1.0, Math.min(5.0, 5 * (1 - nearestDistance / (lookAheadDist * 2))));
            escape.mult(this.avoidForce * distanceFactor * 3.0); // Reduzido de 3.5 para 3.0
            
            // Aplica a força de fuga
            this.base.applyForce(escape);
            
            // Se estiver muito próximo, reduz velocidade (menos drasticamente) e aplica força adicional
            if (nearestDistance < size * 2.5) {
                this.base.velocity.mult(0.7); // Redução menos agressiva (antes era 0.5)
                
                // Aplica força adicional perpendicular à direção atual para tentar desviar
                const perpVector = createVector(-this.base.velocity.y, this.base.velocity.x);
                perpVector.normalize();
                perpVector.mult(this.avoidForce * 2);
                this.base.applyForce(perpVector);
                
                // Adiciona um pouco de aleatoriedade para evitar ficar preso
                const randomVector = p5.Vector.random2D();
                randomVector.mult(this.avoidForce * 0.5);
                this.base.applyForce(randomVector);
                
                // Garante velocidade mínima após multiplicação
                if (this.base.velocity.mag() < 0.5) {
                    const minVelocity = p5.Vector.random2D();
                    minVelocity.mult(0.5);
                    this.base.velocity.add(minVelocity);
                }
                
                // Log para debugging
                if (frameCount % 60 === 0) {
                    console.log(`Obstáculo muito próximo! Distância: ${nearestDistance.toFixed(2)}, Aplicando força perpendicular`);
                }
            }
            
            return true;
        }
        
        return colisionDetected;
    }
    
    /**
     * Verifica colisão com obstáculos e responde
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da entidade
     * @returns {boolean} - Se está em colisão
     */
    handleCollisions(obstacles, size) {
        // Verifica se há obstáculos
        if (!obstacles || obstacles.length === 0) {
            return false;
        }
        
        let inCollision = false;
        
        for (let obstacle of obstacles) {
            // Verifica se o obstáculo é uma instância válida
            if (!(obstacle instanceof window.Obstacle)) continue;
            
            // Usa o novo método pushEntityOut para garantir que a entidade seja forçada para fora
            const wasInObstacle = obstacle.pushEntityOut(this.base, size * 0.8);
            
            if (wasInObstacle) {
                inCollision = true;
                
                // Reduz a velocidade moderadamente (não zera)
                this.base.velocity.mult(0.6);
                
                // Adiciona um componente aleatório para evitar ficar preso
                const randomEscape = p5.Vector.random2D();
                randomEscape.mult(this.avoidForce * 0.5);
                this.base.applyForce(randomEscape);
                
                // Garante velocidade mínima após redução
                if (this.base.velocity.mag() < 0.5) {
                    const escapeDirection = p5.Vector.sub(
                        this.base.position,
                        createVector(obstacle.x + obstacle.w/2, obstacle.y + obstacle.h/2)
                    );
                    escapeDirection.normalize();
                    escapeDirection.mult(0.8);
                    this.base.velocity.add(escapeDirection);
                }
                
                // Alerta sobre a colisão para debugging (com menos frequência)
                if (frameCount % 120 === 0) {
                    console.log(`Colisão direta com obstáculo resolvida com pushEntityOut.`);
                }
            } else {
                // Verificação mais precisa de colisão
                const colliding = obstacle.collidesWith(this.base.position, size * 0.8);
                
                if (colliding) {
                    inCollision = true;
                    
                    // Calcula vetor de saída da colisão
                    const obstacleCenter = createVector(
                        obstacle.x + obstacle.w/2,
                        obstacle.y + obstacle.h/2
                    );
                    
                    const escapeVector = p5.Vector.sub(this.base.position, obstacleCenter);
                    escapeVector.normalize();
                    
                    // Força para sair da colisão (reduzida de 4.0 para 3.0)
                    escapeVector.mult(this.avoidForce * 3.0); 
                    
                    // Aplica a força e também move diretamente a posição para garantir saída imediata
                    this.base.applyForce(escapeVector);
                    this.base.position.add(p5.Vector.mult(escapeVector, 0.5));
                    
                    // Reduz a velocidade atual moderadamente (antes era 0.2)
                    this.base.velocity.mult(0.6);
                    
                    // Garante velocidade mínima após redução
                    if (this.base.velocity.mag() < 0.5) {
                        escapeVector.normalize();
                        escapeVector.mult(0.8);
                        this.base.velocity.add(escapeVector);
                    }
                    
                    // Alerta sobre a colisão para debugging (com menos frequência)
                    if (frameCount % 120 === 0) {
                        console.log(`Colisão direta com obstáculo detectada! Aplicando força de escape.`);
                    }
                }
            }
        }
        
        return inCollision;
    }
}

// Exportação da classe
window.MovementObstacle = MovementObstacle; 