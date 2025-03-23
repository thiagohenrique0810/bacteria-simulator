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
        
        // Vetor na direção do movimento
        const ahead = createVector(
            this.base.position.x + this.base.velocity.x * this.lookAhead,
            this.base.position.y + this.base.velocity.y * this.lookAhead
        );

        // Ponto mais próximo
        let nearestObstacle = null;
        let nearestDistance = Infinity;

        for (let obstacle of obstacles) {
            // Verifica se o obstáculo é uma instância válida
            if (!(obstacle instanceof window.Obstacle)) {
                console.error('Obstáculo inválido:', obstacle);
                continue;
            }

            // Verifica colisão com o ponto à frente
            if (obstacle.collidesWith(ahead, size/2)) {
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
            escape.mult(this.avoidForce);
            this.base.applyForce(escape);
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
        
        for (let obstacle of obstacles) {
            // Verifica se o obstáculo é uma instância válida
            if (!(obstacle instanceof window.Obstacle)) continue;
            
            // Verifica colisão direta
            if (obstacle.collidesWith(this.base.position, size/2)) {
                // Calcula vetor de saída da colisão
                const obstacleCenter = createVector(
                    obstacle.x + obstacle.w/2,
                    obstacle.y + obstacle.h/2
                );
                
                const escapeVector = p5.Vector.sub(this.base.position, obstacleCenter);
                escapeVector.normalize();
                escapeVector.mult(this.avoidForce * 2); // Força maior para sair da colisão
                
                this.base.applyForce(escapeVector);
                return true;
            }
        }
        
        return false;
    }
}

// Exportação da classe
window.MovementObstacle = MovementObstacle; 