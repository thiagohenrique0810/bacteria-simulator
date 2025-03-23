/**
 * Classe que representa um obstáculo no ambiente
 * Versão melhorada com validação de coordenadas
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
        // Validação para garantir que os valores são números válidos
        this.x = typeof x === 'number' && !isNaN(x) ? x : 100;
        this.y = typeof y === 'number' && !isNaN(y) ? y : 100;
        this.w = typeof w === 'number' && !isNaN(w) ? Math.max(10, w) : 50;
        this.h = typeof h === 'number' && !isNaN(h) ? Math.max(10, h) : 50;
        
        this.color = color(100);
        
        // Margem de segurança para detecção de colisão
        this.collisionMargin = 5;
        
        // Array de pontos anteriores que colidiram (para debugging)
        this.recentCollisions = [];
        
        console.log(`Obstáculo criado em (${this.x}, ${this.y}) com tamanho ${this.w}x${this.h}`);
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
     * @param {p5.Vector|Object} point - Ponto a ser verificado
     * @param {number} radius - Raio de colisão
     * @returns {boolean} Se há colisão
     */
    collidesWith(point, radius = 0) {
        // Verifica se o ponto é válido antes de tentar acessar suas propriedades
        if (!point) {
            console.error("Ponto nulo passado para verificação de colisão");
            return false;
        }
        
        // Verifica se point.x é um objeto (erro comum)
        if (typeof point.x === 'object') {
            console.warn("Erro: point.x é um objeto durante verificação de colisão:", point.x);
            
            // Tenta extrair x.x se disponível
            if (point.x && typeof point.x.x === 'number') {
                point = {
                    x: point.x.x,
                    y: (typeof point.y === 'number' && !isNaN(point.y)) ? point.y : 0
                };
                console.log("Ponto corrigido para colisão:", point);
            } else {
                return false; // Não é possível verificar colisão
            }
        }
        
        // Verifica se as coordenadas são números válidos
        if (typeof point.x !== 'number' || typeof point.y !== 'number' || 
            isNaN(point.x) || isNaN(point.y)) {
            console.error("Ponto com coordenadas inválidas:", point);
            return false;
        }
        
        // Validação adicional para radius
        const safeRadius = typeof radius === 'number' && !isNaN(radius) ? radius : 0;
        
        // Adiciona margem de segurança ao raio
        const safetyRadius = safeRadius + this.collisionMargin;
        
        // Verifica colisão com o retângulo expandido pelo raio
        return (
            point.x + safetyRadius > this.x &&
            point.x - safetyRadius < this.x + this.w &&
            point.y + safetyRadius > this.y &&
            point.y - safetyRadius < this.y + this.h
        );
    }

    /**
     * Retorna o ponto mais próximo no obstáculo a um ponto dado
     * @param {p5.Vector|Object} point - Ponto de referência
     * @returns {p5.Vector} Ponto mais próximo
     */
    getClosestPoint(point) {
        // Validação de entrada
        if (!point) return createVector(this.x, this.y);
        
        // Verifica se point.x é um objeto (erro comum)
        if (typeof point.x === 'object') {
            console.warn("Erro: point.x é um objeto ao obter ponto mais próximo:", point.x);
            
            // Tenta extrair x.x se disponível
            if (point.x && typeof point.x.x === 'number') {
                point = {
                    x: point.x.x,
                    y: (typeof point.y === 'number' && !isNaN(point.y)) ? point.y : 0
                };
            } else {
                // Usa o centro do obstáculo como fallback
                return createVector(this.x + this.w/2, this.y + this.h/2);
            }
        }
        
        // Garantir que point tem coordenadas válidas
        const safeX = typeof point.x === 'number' && !isNaN(point.x) ? point.x : this.x + this.w/2;
        const safeY = typeof point.y === 'number' && !isNaN(point.y) ? point.y : this.y + this.h/2;
        
        // Encontra o ponto mais próximo no retângulo
        const closestX = constrain(safeX, this.x, this.x + this.w);
        const closestY = constrain(safeY, this.y, this.y + this.h);
        
        return createVector(closestX, closestY);
    }

    /**
     * Retorna a normal da superfície mais próxima (vetor apontando para fora do obstáculo)
     * @param {p5.Vector|Object} point - Ponto de referência
     * @returns {p5.Vector} Vetor normal
     */
    getNormalAt(point) {
        // Validar entrada
        const safePoint = this.validatePoint(point);
        
        // Obter o ponto mais próximo do obstáculo
        const closest = this.getClosestPoint(safePoint);
        
        // Se o ponto está dentro ou exatamente na borda do obstáculo
        if ((safePoint.x >= this.x && safePoint.x <= this.x + this.w &&
             safePoint.y >= this.y && safePoint.y <= this.y + this.h) ||
            (safePoint.x === closest.x && safePoint.y === closest.y)) {
            
            // Determina qual borda está mais próxima
            const dl = safePoint.x - this.x;
            const dr = this.x + this.w - safePoint.x;
            const dt = safePoint.y - this.y;
            const db = this.y + this.h - safePoint.y;
            
            const min = Math.min(dl, dr, dt, db);
            
            if (min === dl) return createVector(-1, 0);
            if (min === dr) return createVector(1, 0);
            if (min === dt) return createVector(0, -1);
            if (min === db) return createVector(0, 1);
        }

        // Para pontos fora do obstáculo, calcula a normal com base na direção
        const normal = p5.Vector.sub(safePoint, closest);
        
        // Garantir que a normal não seja um vetor zero
        if (normal.mag() < 0.001) {
            // Determina a borda mais próxima como fallback
            const distLeft = Math.abs(safePoint.x - this.x);
            const distRight = Math.abs(safePoint.x - (this.x + this.w));
            const distTop = Math.abs(safePoint.y - this.y);
            const distBottom = Math.abs(safePoint.y - (this.y + this.h));
            
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
     * Valida um ponto para garantir que seja utilizável
     * @param {Object} point - Ponto a ser validado
     * @returns {Object} Ponto validado
     */
    validatePoint(point) {
        // Se for nulo, usar centro do obstáculo
        if (!point) {
            return createVector(this.x + this.w/2, this.y + this.h/2);
        }
        
        // Se point.x for objeto, tentar extrair
        if (typeof point.x === 'object') {
            if (point.x && typeof point.x.x === 'number') {
                return {
                    x: point.x.x,
                    y: (typeof point.y === 'number' && !isNaN(point.y)) ? 
                       point.y : (typeof point.x.y === 'number' ? point.x.y : this.y + this.h/2)
                };
            } else {
                return createVector(this.x + this.w/2, this.y + this.h/2);
            }
        }
        
        // Garantir que as coordenadas são válidas
        const safeX = typeof point.x === 'number' && !isNaN(point.x) ? point.x : this.x + this.w/2;
        const safeY = typeof point.y === 'number' && !isNaN(point.y) ? point.y : this.y + this.h/2;
        
        return { x: safeX, y: safeY };
    }

    /**
     * Força uma entidade para fora do obstáculo se estiver colidindo
     * @param {Object} entity - A entidade (bactéria ou outro objeto com posição)
     * @param {number} radius - Raio da entidade
     * @returns {boolean} Se a entidade estava colidindo
     */
    pushEntityOut(entity, radius = 0) {
        // Validar entrada
        if (!entity) return false;
        
        // Verificar se a posição é válida
        if (typeof entity.pos === 'undefined' || !entity.pos) {
            console.warn("Entidade sem posição válida em pushEntityOut");
            return false;
        }
        
        // Verificar se pos.x é um objeto (erro comum)
        if (typeof entity.pos.x === 'object') {
            console.warn("Erro: entity.pos.x é um objeto em pushEntityOut:", entity.pos.x);
            
            // Tenta extrair x.x se disponível
            if (entity.pos.x && typeof entity.pos.x.x === 'number') {
                entity.pos = {
                    x: entity.pos.x.x,
                    y: (typeof entity.pos.y === 'number' && !isNaN(entity.pos.y)) ? 
                       entity.pos.y : (typeof entity.pos.x.y === 'number' ? entity.pos.x.y : 0)
                };
                console.log("Posição da entidade corrigida para:", entity.pos);
            } else {
                return false; // Não é possível corrigir
            }
        }
        
        // Verifica se há colisão
        if (!this.collidesWith(entity.pos, radius)) {
            return false;
        }
        
        // Obtém o vetor normal apontando para fora do obstáculo
        const normal = this.getNormalAt(entity.pos);
        
        // Calcula a distância mínima para sair
        const safeRadius = typeof radius === 'number' && !isNaN(radius) ? radius : 0;
        const closestPoint = this.getClosestPoint(entity.pos);
        const distance = p5.Vector.dist(entity.pos, closestPoint);
        const penetrationDepth = safeRadius - distance + this.collisionMargin;
        
        // Aplica o deslocamento para remover da colisão
        if (penetrationDepth > 0) {
            // Multiplica a normal pela profundidade de penetração
            normal.mult(penetrationDepth + 1); // +1 para garantir saída completa
            
            // Aplica o deslocamento
            entity.pos.x += normal.x;
            entity.pos.y += normal.y;
            
            // Se a entidade tiver velocidade, ajusta para refletir
            if (entity.vel) {
                // Reflexão básica de velocidade
                const dot = entity.vel.x * normal.x + entity.vel.y * normal.y;
                
                // Inverte o componente da velocidade na direção normal
                entity.vel.x -= 2 * dot * normal.x;
                entity.vel.y -= 2 * dot * normal.y;
                
                // Reduz um pouco a velocidade (fator de restituição)
                entity.vel.x *= 0.8;
                entity.vel.y *= 0.8;
            }
            
            return true;
        }
        
        return false;
    }
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.Obstacle = Obstacle;
} 