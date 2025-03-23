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
        // Log para debugging ocasional
        if (frameCount % 180 === 0) {
            console.log(`MovementBase update: position=${this.position.x.toFixed(2)},${this.position.y.toFixed(2)}, velocity=${this.velocity.mag().toFixed(4)}, isStopped=${this.isStopped}, isResting=${isResting}`);
        }
        
        if (this.isStopped || isResting) {
            // Desacelera gradualmente com base no deltaTime
            this.velocity.mult(Math.pow(0.95, deltaTime * 60));
            return false;
        }

        // Se a velocidade é zero ou muito baixa, aplica uma velocidade inicial
        // mesmo sem aceleração, para evitar que fique totalmente parado
        if (this.velocity.mag() < 0.1) {
            // Direção aleatória
            const randomDirection = p5.Vector.random2D();
            randomDirection.mult(1.0); // Velocidade moderada
            this.velocity = randomDirection;
            console.log("Aplicando velocidade inicial para sair do repouso");
        }

        // Reduz velocidade com a idade
        let currentMaxSpeed = this.maxSpeed * (1 - ageRatio * 0.5);
        
        // Garante que a velocidade máxima nunca seja zero ou negativa
        currentMaxSpeed = Math.max(currentMaxSpeed, 0.7);

        // Aplica aceleração ajustada pelo deltaTime
        let scaledAcceleration = this.acceleration.copy().mult(deltaTime * 60);
        
        // Se não há aceleração significativa, adiciona um pequeno movimento aleatório
        if (scaledAcceleration.mag() < 0.001) {
            const randomJitter = p5.Vector.random2D().mult(0.3);
            scaledAcceleration.add(randomJitter);
            
            if (frameCount % 120 === 0) {
                console.log(`Adicionando aceleração aleatória: ${randomJitter.mag().toFixed(4)}`);
            }
        }
        
        this.velocity.add(scaledAcceleration);
        this.velocity.limit(currentMaxSpeed);
        
        // Se a velocidade ainda é muito baixa após tudo isso,
        // força uma velocidade mínima na direção atual
        if (this.velocity.mag() < 0.3) {
            if (frameCount % 60 === 0) {
                console.log(`Velocidade muito baixa: ${this.velocity.mag().toFixed(4)}, forçando movimento mínimo`);
            }
            
            // Normaliza a direção atual (ou cria uma nova se não houver direção)
            if (this.velocity.mag() > 0) {
                this.velocity.normalize();
            } else {
                this.velocity = p5.Vector.random2D();
            }
            
            // Aplica uma velocidade mínima
            this.velocity.mult(0.5);
        }
        
        // Atualiza posição com base no deltaTime e velocidade
        let movement = this.velocity.copy().mult(deltaTime * 60);
        
        // Garante que o movimento não seja muito pequeno
        if (movement.mag() < 0.5) {
            movement.normalize();
            movement.mult(0.5);
        }
        
        // Aplica o movimento à posição
        this.position.add(movement);
        
        // Reseta a aceleração para o próximo ciclo
        this.acceleration.mult(0);
        
        return true;
    }
    
    /**
     * Mantém a entidade dentro dos limites do mundo
     * @param {number} size - Tamanho da entidade
     */
    constrainToBounds(size) {
        // Usa variáveis globais width e height do p5.js,
        // ou valores padrão se não estiverem disponíveis
        const worldWidth = typeof width !== 'undefined' ? width : 800;
        const worldHeight = typeof height !== 'undefined' ? height : 600;
        
        this.position.x = constrain(this.position.x, size/2, worldWidth - size/2);
        this.position.y = constrain(this.position.y, size/2, worldHeight - size/2);
    }
}

// Exportação da classe
window.MovementBase = MovementBase; 