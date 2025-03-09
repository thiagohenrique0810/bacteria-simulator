/**
 * Classe que representa um obstáculo no ambiente
 */
class Obstacle {
    /**
     * Inicializa um novo obstáculo
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} w - Largura
     * @param {number} h - Altura
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color(100);
    }

    /**
     * Desenha o obstáculo
     */
    draw() {
        push();
        fill(this.color);
        noStroke();
        rect(this.x, this.y, this.w, this.h);
        
        // Adiciona sombreamento para dar profundidade
        fill(0, 0, 0, 30);
        rect(this.x, this.y + this.h - 5, this.w, 5);
        rect(this.x + this.w - 5, this.y, 5, this.h);
        pop();
    }

    /**
     * Verifica se um ponto colide com o obstáculo
     * @param {p5.Vector} point - Ponto a ser verificado
     * @param {number} radius - Raio de colisão
     * @returns {boolean} Se há colisão
     */
    collidesWith(point, radius = 0) {
        return (
            point.x + radius > this.x &&
            point.x - radius < this.x + this.w &&
            point.y + radius > this.y &&
            point.y - radius < this.y + this.h
        );
    }

    /**
     * Retorna o ponto mais próximo no obstáculo a um ponto dado
     * @param {p5.Vector} point - Ponto de referência
     * @returns {p5.Vector} Ponto mais próximo
     */
    getClosestPoint(point) {
        // Encontra o ponto mais próximo no retângulo
        const closestX = constrain(point.x, this.x, this.x + this.w);
        const closestY = constrain(point.y, this.y, this.y + this.h);
        
        return createVector(closestX, closestY);
    }

    /**
     * Retorna a distância até um ponto
     * @param {p5.Vector} point - Ponto de referência
     * @returns {number} Distância até o ponto
     */
    distanceTo(point) {
        const closest = this.getClosestPoint(point);
        return dist(point.x, point.y, closest.x, closest.y);
    }

    /**
     * Retorna a normal da superfície mais próxima
     * @param {p5.Vector} point - Ponto de referência
     * @returns {p5.Vector} Vetor normal
     */
    getNormalAt(point) {
        const closest = this.getClosestPoint(point);
        
        // Se o ponto está exatamente no obstáculo, retorna uma direção aleatória
        if (point.x === closest.x && point.y === closest.y) {
            const angle = random(TWO_PI);
            return p5.Vector.fromAngle(angle);
        }

        // Calcula a normal baseada na face mais próxima
        const normal = p5.Vector.sub(point, closest);
        normal.normalize();
        return normal;
    }

    /**
     * Retorna informações sobre o obstáculo
     * @returns {Object} Informações do obstáculo
     */
    getInfo() {
        return {
            position: {
                x: this.x,
                y: this.y
            },
            size: {
                width: this.w,
                height: this.h
            }
        };
    }
}

// Tornando a classe global
window.Obstacle = Obstacle; 