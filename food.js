/**
 * Classe que representa uma unidade de comida na simulação
 */
class Food {
    /**
     * Cria uma nova comida
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} nutrition - Valor nutricional
     */
    constructor(x, y, nutrition = 30) {
        this.position = createVector(x, y);
        this.nutrition = nutrition;
        this.size = map(nutrition, 10, 50, 5, 15);
        this.color = color(0, 255, 0);
    }

    /**
     * Desenha a comida
     */
    draw() {
        fill(this.color);
        noStroke();
        circle(this.position.x, this.position.y, this.size);
    }

    /**
     * Retorna uma cópia da comida
     * @returns {Food} - Cópia da comida
     */
    copy() {
        return new Food(this.position.x, this.position.y, this.nutrition);
    }

    /**
     * Serializa a comida para salvar
     * @returns {Object} - Dados serializados
     */
    serialize() {
        return {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            nutrition: this.nutrition
        };
    }

    /**
     * Carrega dados serializados
     * @param {Object} data - Dados serializados
     */
    deserialize(data) {
        this.position = createVector(data.position.x, data.position.y);
        this.nutrition = data.nutrition;
        this.size = map(this.nutrition, 10, 50, 5, 15);
    }
}

// Tornando a classe global
window.Food = Food; 