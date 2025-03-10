/**
 * Classe que representa uma unidade de comida no sistema
 */
class Food {
    /**
     * Cria uma nova comida
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {number} nutrition - Valor nutricional
     */
    constructor(x, y, nutrition = 30) {
        this.position = createVector(x, y);
        this.nutrition = nutrition;
        this.size = map(nutrition, 10, 50, 5, 15);
        this.color = color(0, 255, 0, 200);
    }

    /**
     * Desenha a comida
     */
    draw() {
        push();
        fill(this.color);
        noStroke();
        circle(this.position.x, this.position.y, this.size);
        pop();
    }

    /**
     * Cria uma cópia da comida
     * @returns {Food} Nova instância de comida
     */
    copy() {
        return new Food(this.position.x, this.position.y, this.nutrition);
    }

    /**
     * Serializa a comida para salvar
     * @returns {Object} Objeto com dados da comida
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

// Torna a classe global
window.Food = Food; 