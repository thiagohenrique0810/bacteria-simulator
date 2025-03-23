/**
 * Classe com comportamentos de direcionamento para o sistema de movimento
 */
class MovementSteering {
    /**
     * Inicializa o sistema de direcionamento
     * @param {MovementBase} movementBase - Referência para o sistema base de movimento
     */
    constructor(movementBase) {
        this.base = movementBase;
    }

    /**
     * Busca um alvo
     * @param {p5.Vector} target - Posição do alvo
     * @param {number} perception - Raio de percepção
     * @param {number} attraction - Força de atração
     */
    seek(target, perception, attraction = 1) {
        const d = dist(this.base.position.x, this.base.position.y, target.x, target.y);
        
        if (d < perception) {
            const desired = p5.Vector.sub(target, this.base.position);
            desired.normalize();
            desired.mult(this.base.maxSpeed * attraction);
            
            const steer = p5.Vector.sub(desired, this.base.velocity);
            steer.limit(this.base.maxForce * attraction);
            this.base.applyForce(steer);
        }
    }

    /**
     * Mantém distância de outras bactérias
     * @param {Array} others - Lista de outras bactérias
     * @param {number} desiredSeparation - Distância desejada
     */
    separate(others, desiredSeparation) {
        const steer = createVector(0, 0);
        let count = 0;

        for (let other of others) {
            const d = dist(this.base.position.x, this.base.position.y, other.pos.x, other.pos.y);
            
            if (d > 0 && d < desiredSeparation) {
                const diff = p5.Vector.sub(this.base.position, other.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count);
            steer.normalize();
            steer.mult(this.base.maxSpeed);
            steer.sub(this.base.velocity);
            steer.limit(this.base.maxForce);
            this.base.applyForce(steer);
        }
    }
    
    /**
     * Faz a entidade vagar aleatoriamente
     * @param {number} wanderStrength - Força do movimento aleatório
     */
    wander(wanderStrength = 0.1) {
        // Adiciona uma pequena variação aleatória na direção
        const wanderForce = p5.Vector.random2D();
        wanderForce.mult(wanderStrength * this.base.maxForce);
        this.base.applyForce(wanderForce);
    }
    
    /**
     * Faz a entidade seguir um fluxo de campo
     * @param {Function} fieldFunction - Função que retorna um vetor para cada posição
     * @param {number} strength - Força do campo
     */
    followField(fieldFunction, strength = 1.0) {
        if (typeof fieldFunction !== 'function') return;
        
        // Obtém um vetor de campo na posição atual
        const fieldForce = fieldFunction(this.base.position.x, this.base.position.y);
        if (fieldForce) {
            fieldForce.normalize();
            fieldForce.mult(this.base.maxForce * strength);
            this.base.applyForce(fieldForce);
        }
    }
}

// Exportação da classe
window.MovementSteering = MovementSteering; 