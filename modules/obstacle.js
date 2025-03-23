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
        
        // Margem de segurança para detecção de colisão
        this.collisionMargin = 2;
        
        // Array de pontos anteriores que colidiram (para debugging)
        this.recentCollisions = [];
        
        console.log(`Obstáculo criado em (${x}, ${y}) com tamanho ${w}x${h}`);
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
        
        // Desenha as colisões recentes para debug (descomente para debugar)
        /* 
        stroke(255, 0, 0);
        strokeWeight(3);
        for (let collision of this.recentCollisions) {
            point(collision.x, collision.y);
        }
        */
        
        pop();
    }

    /**
     * Verifica se um ponto colide com o obstáculo
     * @param {p5.Vector} point - Ponto a ser verificado
     * @param {number} radius - Raio de colisão
     * @returns {boolean} Se há colisão
     */
    collidesWith(point, radius = 0) {
        // Verifica se o ponto é válido antes de tentar acessar suas propriedades
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            console.error("Ponto inválido passado para verificação de colisão:", point);
            return false;
        }
        
        // Adiciona margem de segurança ao raio
        const safetyRadius = radius + this.collisionMargin;
        
        // Verifica colisão com o retângulo expandido pelo raio
        const collides = (
            point.x + safetyRadius > this.x &&
            point.x - safetyRadius < this.x + this.w &&
            point.y + safetyRadius > this.y &&
            point.y - safetyRadius < this.y + this.h
        );
        
        // Para debugging, armazena os pontos de colisão recentes
        if (collides) {
            this.recentCollisions.push(createVector(point.x, point.y));
            // Mantém apenas as últimas 10 colisões
            if (this.recentCollisions.length > 10) {
                this.recentCollisions.shift();
            }
            
            // Log ocasional para debugging
            if (frameCount % 120 === 0) {
                console.log(`Colisão detectada em obstáculo (${this.x}, ${this.y})`);
            }
        }
        
        return collides;
    }

    /**
     * Verifica se uma linha colide com o obstáculo
     * @param {p5.Vector} start - Ponto inicial da linha
     * @param {p5.Vector} end - Ponto final da linha
     * @param {number} radius - Raio adicional de colisão
     * @returns {boolean} Se há colisão
     */
    lineCollides(start, end, radius = 0) {
        // Verifica se os pontos são válidos
        if (!start || !end || typeof start.x !== 'number' || typeof end.x !== 'number') {
            return false;
        }
        
        // Verifica se algum dos pontos está dentro do obstáculo
        if (this.collidesWith(start, radius) || this.collidesWith(end, radius)) {
            return true;
        }
        
        // Retângulo expandido pelo raio
        const expandedRect = {
            left: this.x - radius,
            right: this.x + this.w + radius,
            top: this.y - radius,
            bottom: this.y + this.h + radius
        };
        
        // Parâmetros da linha: y = mx + b
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        
        // Previne divisão por zero
        if (Math.abs(dx) < 0.0001) {
            // Linha vertical
            if (start.x >= expandedRect.left && start.x <= expandedRect.right) {
                // Verifica se a linha cruza o retângulo verticalmente
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                return maxY >= expandedRect.top && minY <= expandedRect.bottom;
            }
            return false;
        }
        
        const m = dy / dx;
        const b = start.y - m * start.x;
        
        // Função para calcular y dado x
        const getY = (x) => m * x + b;
        // Função para calcular x dado y
        const getX = (y) => (y - b) / m;
        
        // Verifica interseção com as bordas do retângulo
        const leftY = getY(expandedRect.left);
        if (leftY >= expandedRect.top && leftY <= expandedRect.bottom) {
            const t = (expandedRect.left - start.x) / dx;
            if (t >= 0 && t <= 1) return true;
        }
        
        const rightY = getY(expandedRect.right);
        if (rightY >= expandedRect.top && rightY <= expandedRect.bottom) {
            const t = (expandedRect.right - start.x) / dx;
            if (t >= 0 && t <= 1) return true;
        }
        
        const topX = getX(expandedRect.top);
        if (topX >= expandedRect.left && topX <= expandedRect.right) {
            const t = (expandedRect.top - start.y) / dy;
            if (t >= 0 && t <= 1) return true;
        }
        
        const bottomX = getX(expandedRect.bottom);
        if (bottomX >= expandedRect.left && bottomX <= expandedRect.right) {
            const t = (expandedRect.bottom - start.y) / dy;
            if (t >= 0 && t <= 1) return true;
        }
        
        return false;
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
        
        // Se o ponto está exatamente no obstáculo ou muito próximo, calcula normal precisa
        if (point.x === closest.x && point.y === closest.y) {
            // Determina qual borda está mais próxima
            const dl = point.x - this.x;
            const dr = this.x + this.w - point.x;
            const dt = point.y - this.y;
            const db = this.y + this.h - point.y;
            
            const min = Math.min(dl, dr, dt, db);
            
            if (min === dl) return createVector(-1, 0);
            if (min === dr) return createVector(1, 0);
            if (min === dt) return createVector(0, -1);
            if (min === db) return createVector(0, 1);
        }

        // Calcula a normal baseada na face mais próxima
        const normal = p5.Vector.sub(point, closest);
        
        // Garantir que a normal não seja um vetor zero
        if (normal.mag() < 0.001) {
            // Determina a borda mais próxima
            const distLeft = Math.abs(point.x - this.x);
            const distRight = Math.abs(point.x - (this.x + this.w));
            const distTop = Math.abs(point.y - this.y);
            const distBottom = Math.abs(point.y - (this.y + this.h));
            
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            
            if (minDist === distLeft) normal.set(-1, 0);
            else if (minDist === distRight) normal.set(1, 0);
            else if (minDist === distTop) normal.set(0, -1);
            else normal.set(0, 1);
        } else {
            normal.normalize();
        }
        
        return normal;
    }

    /**
     * Força uma entidade para fora do obstáculo se estiver colidindo
     * @param {Object} entity - A entidade (bactéria ou outro objeto com posição)
     * @param {number} radius - Raio da entidade
     * @returns {boolean} Se a entidade estava colidindo
     */
    pushEntityOut(entity, radius = 0) {
        if (!entity || !entity.pos) return false;
        
        // Verifica se está colidindo
        if (this.collidesWith(entity.pos, radius)) {
            // Obtém a normal
            const normal = this.getNormalAt(entity.pos);
            // Calcula a distância mínima necessária para empurrar para fora
            const closestPoint = this.getClosestPoint(entity.pos);
            const overlap = radius - entity.pos.dist(closestPoint) + this.collisionMargin + 1;
            
            if (overlap > 0) {
                // Empurra a entidade para fora ao longo da normal
                const pushVector = p5.Vector.mult(normal, overlap);
                entity.pos.add(pushVector);
                
                // Se a entidade tiver um sistema de movimento, reduz sua velocidade moderadamente
                if (entity.movement) {
                    if (entity.movement.velocity) {
                        // Reduz para 60% em vez de 20% (era muito drástico)
                        entity.movement.velocity.mult(0.6);
                        
                        // Garante velocidade mínima na direção de saída
                        if (entity.movement.velocity.mag() < 0.5) {
                            const escapeVelocity = p5.Vector.mult(normal, 0.8);
                            entity.movement.velocity.add(escapeVelocity);
                        }
                    } else if (entity.velocity) {
                        entity.velocity.mult(0.6);
                        
                        // Garante velocidade mínima na direção de saída
                        if (entity.velocity.mag() < 0.5) {
                            const escapeVelocity = p5.Vector.mult(normal, 0.8);
                            entity.velocity.add(escapeVelocity);
                        }
                    }
                    
                    // Adiciona uma pequena força aleatória para evitar ficar "preso" em um equilíbrio
                    const randomAngle = random(-PI/4, PI/4);
                    const randomVector = p5.Vector.fromAngle(normal.heading() + randomAngle, 0.3);
                    
                    if (entity.movement.applyForce) {
                        entity.movement.applyForce(randomVector);
                    }
                }
                
                // Log para debugging (reduzida frequência para evitar spam)
                if (frameCount % 120 === 0) {
                    console.log(`Entidade empurrada para fora de obstáculo. Sobreposição: ${overlap.toFixed(2)}`);
                }
                return true;
            }
        }
        
        return false;
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