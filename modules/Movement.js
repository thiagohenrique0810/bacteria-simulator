/**
 * Sistema de movimento para as bactérias
 */
class Movement {
    /**
     * Inicializa o sistema de movimento
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
     * Atualiza o movimento
     * @param {number} ageRatio - Razão da idade (0-1)
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da bactéria
     * @param {boolean} isResting - Se está descansando
     * @param {number} deltaTime - Tempo desde o último frame
     */
    update(ageRatio, obstacles, size, isResting, deltaTime = 1/60) {
        if (this.isStopped || isResting) {
            // Desacelera gradualmente com base no deltaTime
            this.velocity.mult(Math.pow(0.95, deltaTime * 60));
            return;
        }

        // Reduz velocidade com a idade
        let currentMaxSpeed = this.maxSpeed * (1 - ageRatio * 0.5);

        // Aplica aceleração ajustada pelo deltaTime
        let scaledAcceleration = this.acceleration.copy().mult(deltaTime * 60);
        this.velocity.add(scaledAcceleration);
        this.velocity.limit(currentMaxSpeed);
        
        // Atualiza posição com base no deltaTime
        let movement = this.velocity.copy().mult(deltaTime * 60);
        this.position.add(movement);
        
        this.acceleration.mult(0);

        // Evita obstáculos
        this.avoidObstacles(obstacles, size);

        // Mantém dentro dos limites
        this.position.x = constrain(this.position.x, size/2, 800 - size/2);
        this.position.y = constrain(this.position.y, size/2, height - size/2);
    }

    /**
     * Aplica uma força ao movimento
     * @param {p5.Vector} force - Força a ser aplicada
     */
    applyForce(force) {
        this.acceleration.add(force);
    }

    /**
     * Busca um alvo
     * @param {p5.Vector} target - Posição do alvo
     * @param {number} perception - Raio de percepção
     * @param {number} attraction - Força de atração
     */
    seek(target, perception, attraction = 1) {
        let d = dist(this.position.x, this.position.y, target.x, target.y);
        
        if (d < perception) {
            let desired = p5.Vector.sub(target, this.position);
            desired.normalize();
            desired.mult(this.maxSpeed * attraction);
            
            let steer = p5.Vector.sub(desired, this.velocity);
            steer.limit(this.maxForce * attraction);
            this.applyForce(steer);
        }
    }

    /**
     * Mantém distância de outras bactérias
     * @param {Array} others - Lista de outras bactérias
     * @param {number} desiredSeparation - Distância desejada
     */
    separate(others, desiredSeparation) {
        let steer = createVector(0, 0);
        let count = 0;

        for (let other of others) {
            let d = dist(this.position.x, this.position.y, other.pos.x, other.pos.y);
            
            if (d > 0 && d < desiredSeparation) {
                let diff = p5.Vector.sub(this.position, other.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count);
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
            this.applyForce(steer);
        }
    }

    /**
     * Evita obstáculos
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da bactéria
     */
    avoidObstacles(obstacles, size) {
        const LOOK_AHEAD = 30;
        const AVOID_FORCE = 1;

        // Vetor na direção do movimento
        let ahead = createVector(
            this.position.x + this.velocity.x * LOOK_AHEAD,
            this.position.y + this.velocity.y * LOOK_AHEAD
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
                let obstacleCenter = createVector(
                    obstacle.x + obstacle.w/2,
                    obstacle.y + obstacle.h/2
                );
                let d = this.position.dist(obstacleCenter);
                
                if (d < nearestDistance) {
                    nearestDistance = d;
                    nearestObstacle = obstacle;
                }
            }
        }

        // Se encontrou obstáculo, evita
        if (nearestObstacle) {
            let obstacleCenter = createVector(
                nearestObstacle.x + nearestObstacle.w/2,
                nearestObstacle.y + nearestObstacle.h/2
            );
            
            // Calcula vetor de fuga
            let escape = p5.Vector.sub(this.position, obstacleCenter);
            escape.normalize();
            escape.mult(AVOID_FORCE);
            this.applyForce(escape);
        }
    }

    /**
     * Define a direção do movimento
     * @param {p5.Vector} direction - Vetor de direção normalizado
     */
    setDirection(direction) {
        if (!direction) return;
        
        // Aplica a direção como força de aceleração
        const force = direction.copy();
        force.limit(this.maxForce);
        this.applyForce(force);
    }

    /**
     * Obtém a posição atual
     * @returns {p5.Vector} - A posição atual
     */
    getPosition() {
        return this.position.copy();
    }
}

// Tornando a classe global
window.Movement = Movement; 