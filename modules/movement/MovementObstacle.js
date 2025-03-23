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

        for (let obstacle of obstacles) {
            // Verifica se o obstáculo é uma instância válida
            if (!(obstacle instanceof window.Obstacle)) {
                console.error('Obstáculo inválido:', obstacle);
                continue;
            }

            // Verifica colisão com todos os pontos à frente
            const collisionAhead = obstacle.collidesWith(ahead, size * 1.2);
            const collisionAheadHalf = obstacle.collidesWith(aheadHalf, size * 1.2);
            const collisionAheadAngled = obstacle.collidesWith(aheadAngled, size * 1.2);
            
            // Verifica também a colisão com a posição atual para capturar colisões já ocorrendo
            const collisionCurrent = obstacle.collidesWith(this.base.position, size * 1.2);
            
            if (collisionAhead || collisionAheadHalf || collisionAheadAngled || collisionCurrent) {
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
            escape.mult(this.avoidForce * distanceFactor * 3.5);
            
            // Aplica a força de fuga
            this.base.applyForce(escape);
            
            // Se estiver muito próximo, reduz drasticamente a velocidade e aplica força adicional
            if (nearestDistance < size * 2.5) {
                this.base.velocity.mult(0.5); // Redução mais agressiva
                
                // Aplica força adicional perpendicular à direção atual para tentar desviar
                const perpVector = createVector(-this.base.velocity.y, this.base.velocity.x);
                perpVector.normalize();
                perpVector.mult(this.avoidForce * 2);
                this.base.applyForce(perpVector);
                
                // Log para debugging
                console.log(`Obstáculo muito próximo! Distância: ${nearestDistance.toFixed(2)}, Aplicando força perpendicular`);
            }
            
            return true;
        }
        
        return false;
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
                
                // Força muito maior para sair da colisão
                escapeVector.mult(this.avoidForce * 4.0); 
                
                // Aplica a força e também move diretamente a posição para garantir saída imediata
                this.base.applyForce(escapeVector);
                this.base.position.add(p5.Vector.mult(escapeVector, 0.5));
                
                // Para a velocidade atual para evitar entrar mais fundo no obstáculo
                this.base.velocity.mult(0.2);
                
                // Alerta sobre a colisão para debugging
                console.log(`Colisão direta com obstáculo detectada! Aplicando força de escape.`);
            }
        }
        
        return inCollision;
    }
}

// Exportação da classe
window.MovementObstacle = MovementObstacle; 