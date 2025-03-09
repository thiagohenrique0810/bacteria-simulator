/**
 * Classe que representa a comida no ambiente
 */
class Food {
    /**
     * Inicializa uma nova comida
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} nutrition - Valor nutricional
     */
    constructor(x, y, nutrition = 30) {
        this.position = createVector(x, y);
        this.nutrition = nutrition;
        this.size = map(nutrition, 20, 40, 8, 12);
        this.color = color(0, 255, 0);
        this.alpha = 255;
    }

    /**
     * Desenha a comida
     */
    draw() {
        push();
        noStroke();
        
        // Cor com transparência baseada no valor nutricional
        const c = color(this.color);
        c.setAlpha(map(this.nutrition, 0, 40, 100, 255));
        fill(c);
        
        // Círculo principal
        circle(this.position.x, this.position.y, this.size);
        
        // Brilho
        fill(255, 255, 255, 50);
        circle(
            this.position.x - this.size/4,
            this.position.y - this.size/4,
            this.size/3
        );
        pop();
    }

    /**
     * Atualiza o estado da comida
     */
    update() {
        // Pode ser expandido para adicionar comportamentos
        // como deterioração ao longo do tempo
    }

    /**
     * Retorna informações sobre a comida
     * @returns {Object} Informações da comida
     */
    getInfo() {
        return {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            nutrition: this.nutrition,
            size: this.size
        };
    }
}

// Tornando a classe global
window.Food = Food; 