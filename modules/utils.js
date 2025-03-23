/**
 * Funções utilitárias para o simulador
 */

// Removendo funções que já existem no p5.js (constrain, random, dist)
// Adicionando outras funções utilitárias que possamos precisar

/**
 * Calcula o ângulo entre dois pontos
 * @param {number} x1 - Coordenada X do primeiro ponto
 * @param {number} y1 - Coordenada Y do primeiro ponto
 * @param {number} x2 - Coordenada X do segundo ponto
 * @param {number} y2 - Coordenada Y do segundo ponto
 * @returns {number} - Ângulo em radianos
 */
function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Converte graus para radianos
 * @param {number} degrees - Ângulo em graus
 * @returns {number} - Ângulo em radianos
 */
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Converte radianos para graus
 * @param {number} radians - Ângulo em radianos
 * @returns {number} - Ângulo em graus
 */
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Gera uma cor HSL aleatória
 * @param {number} saturation - Saturação (0-100)
 * @param {number} lightness - Luminosidade (0-100)
 * @returns {string} - Cor no formato HSL
 */
function randomColor(saturation = 100, lightness = 50) {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Sistema de particionamento espacial para otimizar colisões
 */
class SpatialGrid {
    /**
     * Cria um novo grid espacial
     * @param {number} width - Largura total do espaço
     * @param {number} height - Altura total do espaço
     * @param {number} cellSize - Tamanho de cada célula do grid
     */
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = [];
        
        // Inicializa o grid vazio
        this.clear();
    }
    
    /**
     * Limpa o grid
     */
    clear() {
        this.grid = new Array(this.cols * this.rows);
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
    }
    
    /**
     * Insere uma entidade no grid
     * @param {Object} entity - Entidade com propriedade pos (posição)
     */
    insert(entity) {
        const pos = entity.pos || entity.position;
        if (!pos) return;
        
        const x = Math.floor(pos.x / this.cellSize);
        const y = Math.floor(pos.y / this.cellSize);
        
        // Verifica se está dentro dos limites
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const index = x + y * this.cols;
            this.grid[index].push(entity);
        }
    }
    
    /**
     * Retorna todas as entidades próximas a uma posição
     * @param {Vector} pos - Posição a verificar
     * @param {number} radius - Raio de busca
     * @returns {Array} - Entidades próximas
     */
    queryRadius(pos, radius) {
        const result = [];
        // Determina células que podem conter entidades dentro do raio
        const startX = Math.max(0, Math.floor((pos.x - radius) / this.cellSize));
        const endX = Math.min(this.cols - 1, Math.floor((pos.x + radius) / this.cellSize));
        const startY = Math.max(0, Math.floor((pos.y - radius) / this.cellSize));
        const endY = Math.min(this.rows - 1, Math.floor((pos.y + radius) / this.cellSize));
        
        // Verifica cada célula
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const index = x + y * this.cols;
                const entities = this.grid[index];
                
                // Adiciona entidades desta célula
                for (let entity of entities) {
                    const entityPos = entity.pos || entity.position;
                    const d = dist(pos.x, pos.y, entityPos.x, entityPos.y);
                    if (d <= radius) {
                        result.push(entity);
                    }
                }
            }
        }
        
        return result;
    }
}

// Exporta as funções
window.calculateAngle = calculateAngle;
window.degreesToRadians = degreesToRadians;
window.radiansToDegrees = radiansToDegrees;
window.randomColor = randomColor;

// Exporta classe para o escopo global
window.SpatialGrid = SpatialGrid; 