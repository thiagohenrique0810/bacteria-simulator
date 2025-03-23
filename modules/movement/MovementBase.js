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
        
        // Aplica a força à aceleração
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
        
        // Armazena a posição anterior para detecção de movimento
        const prevPosition = this.position.copy();
        
        // Verifica e corrige vetores principais
        this.validateVector(this.position, width/2, height/2);
        this.validateVector(this.velocity, 0, 0);
        this.validateVector(this.acceleration, 0, 0);
        
        if (this.isStopped || isResting) {
            // Desacelera gradualmente com base no deltaTime
            this.velocity.mult(Math.pow(0.95, deltaTime * 60));
            return false;
        }

        // Se a velocidade é zero ou muito baixa, aplica uma velocidade inicial
        // mesmo sem aceleração, para evitar que fique totalmente parado
        if (this.velocity.mag() < 0.1) {
            // Direção aleatória com velocidade maior para garantir movimento
            const randomDirection = p5.Vector.random2D();
            randomDirection.mult(1.5); // Velocidade maior para garantir movimento
            this.velocity = randomDirection;
            console.log("Aplicando velocidade inicial para sair do repouso: " + randomDirection.mag().toFixed(2));
        }

        // Reduz velocidade com a idade
        let currentMaxSpeed = this.maxSpeed * (1 - ageRatio * 0.5);
        
        // Garante que a velocidade máxima nunca seja zero ou negativa
        currentMaxSpeed = Math.max(currentMaxSpeed, 0.8);

        // Aplica aceleração ajustada pelo deltaTime
        let scaledAcceleration = this.acceleration.copy().mult(deltaTime * 60);
        
        // Verificação de segurança para aceleração
        this.validateVector(scaledAcceleration, 0, 0);
        
        // Se não há aceleração significativa, adiciona um movimento aleatório mais forte
        if (scaledAcceleration.mag() < 0.001) {
            const randomJitter = p5.Vector.random2D().mult(0.5); // Aumento da força aleatória
            scaledAcceleration.add(randomJitter);
            
            if (frameCount % 60 === 0) {
                console.log(`Adicionando aceleração aleatória: ${randomJitter.mag().toFixed(4)}`);
            }
        }
        
        this.velocity.add(scaledAcceleration);
        this.validateVector(this.velocity, 0.5, 0.5); // Verifica após adicionar aceleração
        this.velocity.limit(currentMaxSpeed);
        
        // Se a velocidade ainda é muito baixa após tudo isso,
        // força uma velocidade mínima na direção atual
        if (this.velocity.mag() < 0.5) { // Aumentado o limite mínimo
            console.log(`Velocidade muito baixa: ${this.velocity.mag().toFixed(4)}, forçando movimento mínimo`);
            
            // Normaliza a direção atual (ou cria uma nova se não houver direção)
            if (this.velocity.mag() > 0) {
                this.velocity.normalize();
            } else {
                this.velocity = p5.Vector.random2D();
            }
            
            // Aplica uma velocidade mínima aumentada
            this.velocity.mult(0.8);
        }
        
        // Atualiza posição com base no deltaTime e velocidade
        let movement = this.velocity.copy().mult(deltaTime * 60);
        
        // Verificação de segurança para movement
        this.validateVector(movement, 0.1, 0.1);
        
        // Garante que o movimento não seja muito pequeno
        if (movement.mag() < 0.7) { // Aumentado o limite mínimo
            movement.normalize();
            movement.mult(0.7);
        }
        
        // Aplica o movimento à posição
        try {
            this.position.add(movement);
            
            // Verificação após adição
            if (this.validateVector(this.position, prevPosition.x, prevPosition.y)) {
                console.warn("Posição corrigida após movimento");
            }
        } catch (error) {
            console.error("Erro ao atualizar posição:", error);
            // Restaura posição anterior em caso de erro
            this.position.set(prevPosition.x, prevPosition.y);
        }
        
        // Reseta a aceleração para o próximo ciclo
        this.acceleration.mult(0);
        
        // Verifica se a posição realmente mudou
        const distMoved = p5.Vector.dist(prevPosition, this.position);
        
        // Se não houver movimento significativo, registra um alerta
        if (distMoved < 0.01) {
            console.warn("Movimento insuficiente detectado! Posição não foi atualizada.");
            
            // Forçar movimento quando isso ocorrer
            const forceMove = p5.Vector.random2D().mult(1.0);
            this.position.add(forceMove);
            console.log("Forçando movimento direto na posição: " + forceMove.mag().toFixed(2));
        }
        
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