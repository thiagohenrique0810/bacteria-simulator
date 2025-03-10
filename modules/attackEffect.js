/**
 * Efeito visual para ataques de predadores
 */
class AttackEffect {
    /**
     * Cria um novo efeito de ataque
     * @param {number} x - Posição X do efeito
     * @param {number} y - Posição Y do efeito
     */
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.lifetime = 30; // Duração em frames
        this.age = 0;
        this.size = 30;
        this.particles = [];
        
        // Cria partículas
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                pos: createVector(x, y),
                vel: p5.Vector.fromAngle(TWO_PI * i / 8, 3),
                size: random(3, 6)
            });
        }
    }

    /**
     * Atualiza o efeito
     * @returns {boolean} - Se o efeito ainda está ativo
     */
    update() {
        this.age++;
        
        // Atualiza partículas
        for (let p of this.particles) {
            p.pos.add(p.vel);
            p.vel.mult(0.95); // Desaceleração
            p.size *= 0.95; // Diminui tamanho
        }
        
        return this.age < this.lifetime;
    }

    /**
     * Desenha o efeito
     */
    draw() {
        const alpha = map(this.age, 0, this.lifetime, 255, 0);
        
        // Desenha círculo central
        noFill();
        stroke(255, 0, 0, alpha);
        strokeWeight(2);
        const size = this.size * (1 - this.age / this.lifetime);
        ellipse(this.pos.x, this.pos.y, size, size);
        
        // Desenha partículas
        fill(255, 0, 0, alpha);
        noStroke();
        for (let p of this.particles) {
            ellipse(p.pos.x, p.pos.y, p.size, p.size);
        }
    }
}

// Torna a classe global
window.AttackEffect = AttackEffect; 