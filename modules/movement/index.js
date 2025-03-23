/**
 * Sistema de movimento para as bactérias - Módulo Principal
 * Este arquivo integra os componentes do sistema de movimento e mantém compatibilidade
 * com o código existente através da classe Movement.
 */
class Movement {
    /**
     * Inicializa o sistema de movimento
     * @param {p5.Vector} position - Posição inicial
     * @param {number} size - Tamanho da bactéria
     */
    constructor(position, size) {
        // Inicializa componentes
        this.base = new MovementBase(position, size);
        this.steering = new MovementSteering(this.base);
        this.obstacle = new MovementObstacle(this.base);
        
        // Expõe propriedades para compatibilidade
        this.position = this.base.position;
        this.velocity = this.base.velocity;
        this.acceleration = this.base.acceleration;
        this.maxSpeed = this.base.maxSpeed;
        this.maxForce = this.base.maxForce;
        this.size = this.base.size;
        this.isStopped = this.base.isStopped;
    }

    /**
     * Para o movimento da bactéria
     */
    stop() {
        this.base.stop();
        this.isStopped = this.base.isStopped;
    }

    /**
     * Retoma o movimento da bactéria
     */
    resume() {
        this.base.resume();
        this.isStopped = this.base.isStopped;
    }

    /**
     * Atualiza o movimento
     * @param {number} ageRatio - Razão da idade (0-1)
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da bactéria
     * @param {boolean} avoidEdges - Se deve evitar as bordas
     * @param {boolean} isResting - Se está descansando
     */
    update(ageRatio, obstacles, size, avoidEdges = true, isResting = false) {
        try {
            // Atualiza o movimento base com o novo método update
            this.base.update(ageRatio, obstacles, size, avoidEdges, isResting);
            
            // Atualiza propriedades para compatibilidade
            this.position = this.base.position;
            this.velocity = this.base.velocity;
            this.acceleration = this.base.acceleration;
        } catch (error) {
            console.error("Erro no movimento:", error);
            // Recuperação de erro: garante que a posição seja válida
            if (!this.position || isNaN(this.position.x) || isNaN(this.position.y)) {
                this.position = createVector(random(width), random(height));
            }
        }
    }

    /**
     * Aplica uma força ao movimento
     * @param {p5.Vector} force - Força a ser aplicada
     */
    applyForce(force) {
        this.base.applyForce(force);
    }

    /**
     * Aplica amortecimento à velocidade
     * @param {number} damping - Fator de amortecimento (0-1)
     */
    applyDamping(damping) {
        this.base.applyDamping(damping);
    }

    /**
     * Busca um alvo
     * @param {p5.Vector} target - Posição do alvo
     * @param {number} perception - Raio de percepção
     * @param {number} attraction - Força de atração
     */
    seek(target, perception, attraction = 1) {
        this.steering.seek(target, perception, attraction);
    }

    /**
     * Mantém distância de outras bactérias
     * @param {Array} others - Lista de outras bactérias
     * @param {number} desiredSeparation - Distância desejada
     */
    separate(others, desiredSeparation) {
        this.steering.separate(others, desiredSeparation);
    }

    /**
     * Evita obstáculos (método mantido por compatibilidade)
     * @param {Array} obstacles - Lista de obstáculos
     * @param {number} size - Tamanho da bactéria
     */
    avoidObstacles(obstacles, size) {
        this.obstacle.avoidObstacles(obstacles, size);
    }

    /**
     * Define a direção do movimento
     * @param {p5.Vector} direction - Vetor de direção normalizado
     */
    setDirection(direction) {
        this.base.setDirection(direction);
    }

    /**
     * Obtém a posição atual
     * @returns {p5.Vector} - A posição atual
     */
    getPosition() {
        return this.base.getPosition();
    }
}

// Tornando a classe global
window.Movement = Movement; 