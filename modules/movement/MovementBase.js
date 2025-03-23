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
        this.acceleration.add(force);
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

    /**
     * Atualiza o movimento base (sem comportamentos avançados)
     * @param {number} ageRatio - Razão da idade (0-1)
     * @param {boolean} isResting - Se está descansando
     * @param {number} deltaTime - Tempo desde o último frame
     */
    updateBase(ageRatio, isResting, deltaTime = 1/60) {
        if (this.isStopped || isResting) {
            // Desacelera gradualmente com base no deltaTime
            this.velocity.mult(Math.pow(0.95, deltaTime * 60));
            return false;
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
        
        return true;
    }
    
    /**
     * Mantém a entidade dentro dos limites do mundo
     * @param {number} size - Tamanho da entidade
     */
    constrainToBounds(size) {
        this.position.x = constrain(this.position.x, size/2, 800 - size/2);
        this.position.y = constrain(this.position.y, size/2, height - size/2);
    }
}

// Exportação da classe
window.MovementBase = MovementBase; 