/**
 * Utilitários para o sistema de comunicação
 * Funções auxiliares compartilhadas entre os componentes
 */
class CommunicationUtils {
    /**
     * Inicializa os utilitários
     * @param {CommunicationSystem} communicationSystem - Sistema de comunicação principal
     */
    constructor(communicationSystem) {
        this.communicationSystem = communicationSystem;
    }
    
    /**
     * Obtém um ID único para uma bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {string} - ID único
     */
    getBacteriaId(bacteria) {
        // Verifica se a bactéria já tem um ID
        if (!bacteria.communicationId) {
            // Atribui um ID baseado na posição no array ou gera um ID aleatório
            const index = this.communicationSystem.simulation.bacteria.indexOf(bacteria);
            bacteria.communicationId = index >= 0 ? `B${index + 1}` : `B${Math.floor(Math.random() * 10000)}`;
        }
        
        return bacteria.communicationId;
    }
    
    /**
     * Retorna a hora formatada para o timestamp das mensagens
     * @returns {string} - Hora formatada (HH:MM:SS)
     */
    getFormattedTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    
    /**
     * Calcula a distância entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {number} - Distância entre as bactérias
     */
    calculateDistance(b1, b2) {
        // Verifica se as bactérias e suas posições são válidas
        if (!b1 || !b2 || !b1.pos || !b2.pos || 
            isNaN(b1.pos.x) || isNaN(b1.pos.y) || 
            isNaN(b2.pos.x) || isNaN(b2.pos.y)) {
            return Infinity; // Retorna distância infinita se algo for inválido
        }
        return dist(b1.pos.x, b1.pos.y, b2.pos.x, b2.pos.y);
    }
    
    /**
     * Verifica se uma bactéria está no raio de comunicação de outra
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @param {number} range - Raio de comunicação
     * @returns {boolean} - Verdadeiro se estiver no raio
     */
    isInCommunicationRange(b1, b2, range) {
        // Verifica se todos os parâmetros são válidos
        if (!b1 || !b2 || !range || range <= 0) {
            return false;
        }
        return this.calculateDistance(b1, b2) <= range;
    }
    
    /**
     * Encontra bactérias próximas de uma bactéria específica
     * @param {Bacteria} bacteria - Bactéria de referência
     * @param {number} range - Raio de busca
     * @returns {Bacteria[]} - Lista de bactérias próximas
     */
    findNearbyBacteria(bacteria, range) {
        // Verifica se os parâmetros são válidos
        if (!bacteria || !bacteria.pos || !range || range <= 0) {
            return [];
        }
        
        try {
            const allBacteria = this.communicationSystem?.simulation?.bacteria || [];
            const nearby = [];
            
            // Usa o grid espacial se disponível para otimização
            if (this.communicationSystem?.simulation?.spatialGrid) {
                try {
                    const nearbyEntities = this.communicationSystem.simulation.spatialGrid.queryRadius(bacteria.pos, range);
                    if (!nearbyEntities || !Array.isArray(nearbyEntities)) {
                        return [];
                    }
                    return nearbyEntities.filter(e => e && e instanceof Bacteria && e !== bacteria);
                } catch (error) {
                    console.warn('Erro ao consultar o grid espacial:', error);
                    // Continua para o método tradicional em caso de erro
                }
            }
            
            // Método tradicional se não houver grid espacial
            for (const other of allBacteria) {
                if (other && other !== bacteria && other.pos && this.isInCommunicationRange(bacteria, other, range)) {
                    nearby.push(other);
                }
            }
            
            return nearby;
        } catch (error) {
            console.error('Erro ao buscar bactérias próximas:', error);
            return [];
        }
    }
    
    /**
     * Gera uma chance baseada na personalidade da bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @param {string} trait - Característica a considerar ('sociability', 'aggressiveness', etc)
     * @param {number} baseChance - Chance base
     * @returns {number} - Chance ajustada
     */
    getPersonalityBasedChance(bacteria, trait, baseChance) {
        // Verifica se os parâmetros são válidos
        if (!bacteria || !trait || baseChance === undefined || baseChance === null) {
            return baseChance || 0.01; // Retorna a chance base ou um valor mínimo
        }
        
        try {
            const traitValue = bacteria.dna?.genes?.[trait] || 1;
            return baseChance * traitValue;
        } catch (error) {
            console.warn(`Erro ao calcular chance baseada na personalidade (${trait}):`, error);
            return baseChance || 0.01;
        }
    }
}

// Exportar para o escopo global
window.CommunicationUtils = CommunicationUtils;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = CommunicationUtils;
} 