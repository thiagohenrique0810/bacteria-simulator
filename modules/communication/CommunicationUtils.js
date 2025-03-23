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
     * Obtém o ID de uma bactéria de forma segura
     * @param {Bacteria} bacteria - Bactéria
     * @returns {string} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        if (!bacteria) return "unknown";
        
        try {
            // Tenta obter o ID diretamente
            if (bacteria.id) {
                return String(bacteria.id);
            }
            
            // Se não tiver ID, usa a posição como identificador
            if (bacteria.pos) {
                return `pos_${Math.round(bacteria.pos.x)}_${Math.round(bacteria.pos.y)}`;
            }
        } catch (error) {
            console.error("Erro ao obter ID da bactéria:", error);
        }
        
        return "unknown";
    }
    
    /**
     * Calcula a distância entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {number} - Distância calculada
     */
    calculateDistance(b1, b2) {
        if (!b1 || !b2) return Infinity;
        
        try {
            // Verificação mais robusta para objetos de posição
            if (!b1.pos || !b2.pos) {
                console.warn("Objetos de posição ausentes ao calcular distância");
                return Infinity;
            }
            
            // Função auxiliar para extrair coordenada válida
            const getValidCoord = (pos, coord) => {
                // Se for um valor numérico direto, usa ele
                if (typeof pos[coord] === 'number' && !isNaN(pos[coord])) {
                    return pos[coord];
                }
                
                // Se for um objeto, tenta extrair a coordenada interna
                if (typeof pos[coord] === 'object' && pos[coord] !== null) {
                    console.warn(`Detectado objeto aninhado em pos.${coord}:`, pos[coord]);
                    
                    // Tenta acessar a propriedade interna (ex: pos.x.x)
                    if (typeof pos[coord][coord] === 'number' && !isNaN(pos[coord][coord])) {
                        return pos[coord][coord];
                    }
                }
                
                // Se não conseguiu um valor válido, retorna NaN para sinalizar o problema
                console.warn(`Não foi possível extrair coordenada válida para ${coord}`);
                return NaN;
            };
            
            // Extrai as coordenadas com validação
            const x1 = getValidCoord(b1.pos, 'x');
            const y1 = getValidCoord(b1.pos, 'y');
            const x2 = getValidCoord(b2.pos, 'x');
            const y2 = getValidCoord(b2.pos, 'y');
            
            // Se qualquer coordenada for inválida, retorna Infinity
            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
                console.warn(`Coordenadas inválidas ao calcular distância: (${x1}, ${y1}) - (${x2}, ${y2})`);
                return Infinity;
            }
            
            // Calcula a distância euclidiana
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance;
        } catch (error) {
            console.error("Erro ao calcular distância:", error);
            return Infinity; // Retorna Infinity em caso de erro para evitar problemas
        }
    }
    
    /**
     * Obtém um ID único para um par de bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {string} - ID único do par
     */
    getBacteriaPairId(b1, b2) {
        const id1 = this.getBacteriaId(b1);
        const id2 = this.getBacteriaId(b2);
        
        // Ordena os IDs para garantir que o par A-B seja igual ao par B-A
        return [id1, id2].sort().join('-');
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
     * Verifica se um valor está aproximadamente dentro de um intervalo
     * @param {number} value - Valor a verificar
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @param {number} tolerance - Tolerância (padrão: 0.1)
     * @returns {boolean} - Verdadeiro se estiver dentro do intervalo
     */
    isWithinRange(value, min, max, tolerance = 0.1) {
        // Aplica tolerância aos limites
        const adjustedMin = min - tolerance;
        const adjustedMax = max + tolerance;
        
        return value >= adjustedMin && value <= adjustedMax;
    }
    
    /**
     * Gera uma chance baseada na personalidade da bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @param {string} trait - Característica a considerar ('sociability', 'aggressiveness', etc)
     * @param {number} baseChance - Chance base
     * @returns {number} - Chance ajustada
     */
    getPersonalityBasedChance(bacteria, trait, baseChance) {
        if (!bacteria || !bacteria.dna || !bacteria.dna.genes) {
            return baseChance;
        }
        
        const traitValue = bacteria.dna.genes[trait];
        
        if (typeof traitValue !== 'number') {
            return baseChance;
        }
        
        // Ajusta a chance com base no traço de personalidade
        // Valores maiores do traço aumentam a chance
        return baseChance * (1 + traitValue);
    }
    
    /**
     * Verifica se uma bactéria está em perigo com base em seu estado
     * @param {Bacteria} bacteria - Bactéria a ser verificada
     * @returns {boolean} - Verdadeiro se estiver em perigo
     */
    isInDanger(bacteria) {
        if (!bacteria) return false;
        
        try {
            // Verifica baixa saúde
            if (bacteria.health < 30) return true;
            
            // Verifica energia baixa
            if (bacteria.energy && bacteria.energy < 20) return true;
            
            // Verifica se está em estado de fuga
            if (bacteria.stateManager && 
                typeof bacteria.stateManager.getCurrentState === 'function' &&
                bacteria.stateManager.getCurrentState() === 'fleeing') {
                return true;
            }
            
            // Verifica se está infectada por doença
            if (bacteria.isInfected && bacteria.activeDiseases && 
                bacteria.activeDiseases.size > 0) {
                return true;
            }
        } catch (error) {
            console.warn("Erro ao verificar perigo:", error);
        }
        
        return false;
    }
}

// Exportar para o escopo global
window.CommunicationUtils = CommunicationUtils;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = CommunicationUtils;
} 