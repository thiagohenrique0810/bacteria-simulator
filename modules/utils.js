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
function radians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Converte radianos para graus
 * @param {number} radians - Ângulo em radianos
 * @returns {number} - Ângulo em graus
 */
function degrees(radians) {
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

// Exporta as funções
window.calculateAngle = calculateAngle;
window.radians = radians;
window.degrees = degrees;
window.randomColor = randomColor; 