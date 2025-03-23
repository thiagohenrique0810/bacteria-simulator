/**
 * Gerenciador de relacionamentos para o sistema de comunicação
 * Responsável por gerenciar os relacionamentos entre bactérias
 */
class RelationshipManager {
    /**
     * Inicializa o gerenciador de relacionamentos
     * @param {CommunicationSystem} communicationSystem - Sistema de comunicação principal
     */
    constructor(communicationSystem) {
        this.communicationSystem = communicationSystem;
        this.relationships = new Map(); // Mapa de relacionamentos entre bactérias
    }
    
    /**
     * Atualiza o relacionamento entre duas bactérias com base na comunicação
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @param {string} messageType - Tipo de mensagem trocada
     */
    updateRelationship(b1, b2, messageType) {
        const utils = this.communicationSystem.utils;
        const messageTypes = this.communicationSystem.messageManager.messageTypes;
        
        // Obtém os IDs das bactérias
        const id1 = utils.getBacteriaId(b1);
        const id2 = utils.getBacteriaId(b2);
        
        // Inicializa relacionamentos se não existirem
        if (!this.relationships.has(id1)) {
            this.relationships.set(id1, []);
        }
        if (!this.relationships.has(id2)) {
            this.relationships.set(id2, []);
        }
        
        // Obtém os relacionamentos existentes
        let rel1 = this.relationships.get(id1).find(r => r.partnerId === id2);
        let rel2 = this.relationships.get(id2).find(r => r.partnerId === id1);
        
        // Se não existirem, cria novos
        if (!rel1) {
            rel1 = { partnerId: id2, level: 0, type: 'neutral', interactions: 0 };
            this.relationships.get(id1).push(rel1);
        }
        if (!rel2) {
            rel2 = { partnerId: id1, level: 0, type: 'neutral', interactions: 0 };
            this.relationships.get(id2).push(rel2);
        }
        
        // Atualiza o número de interações
        rel1.interactions++;
        rel2.interactions++;
        
        // Altera o nível de relação baseado no tipo de mensagem
        let change = 0;
        
        switch (messageType) {
            case messageTypes.GREETING:
                change = 1;
                break;
            case messageTypes.FOOD_INFO:
                change = 2;
                break;
            case messageTypes.DANGER_WARNING:
                change = 3;
                break;
            case messageTypes.HELP_REQUEST:
                change = random() < 0.5 ? 1 : -1; // Pode ser visto como fraqueza
                break;
            case messageTypes.FRIENDSHIP:
                change = 3;
                break;
            case messageTypes.AGGRESSIVE:
                change = -3;
                break;
            case messageTypes.MATING:
                change = 2;
                break;
            case messageTypes.RANDOM:
                change = random() < 0.7 ? 1 : -1;
                break;
        }
        
        // Aplica a mudança
        rel1.level += change;
        rel2.level += change;
        
        // Atualiza o tipo de relacionamento
        this.updateRelationshipType(rel1);
        this.updateRelationshipType(rel2);
    }
    
    /**
     * Atualiza o tipo de relacionamento baseado no nível
     * @param {Object} relationship - Objeto de relacionamento
     */
    updateRelationshipType(relationship) {
        if (relationship.level <= -10) {
            relationship.type = 'enemy';
        } else if (relationship.level <= -3) {
            relationship.type = 'hostile';
        } else if (relationship.level < 3) {
            relationship.type = 'neutral';
        } else if (relationship.level < 10) {
            relationship.type = 'friendly';
        } else {
            relationship.type = 'friend';
        }
    }
    
    /**
     * Obtém o relacionamento entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {Object|null} - Relacionamento ou null se não existir
     */
    getRelationship(b1, b2) {
        const utils = this.communicationSystem.utils;
        const id1 = utils.getBacteriaId(b1);
        const id2 = utils.getBacteriaId(b2);
        
        if (!this.relationships.has(id1)) {
            return null;
        }
        
        return this.relationships.get(id1).find(r => r.partnerId === id2);
    }
    
    /**
     * Conta o número de relacionamentos de determinado tipo
     * @param {string} type - Tipo de relacionamento ('friendship', 'conflict', etc)
     * @returns {number} - Número de relacionamentos desse tipo
     */
    countRelationships(type) {
        let count = 0;
        
        // Mapeia tipos de relacionamento para tipos internos
        const typeMapping = {
            'friendship': ['friend', 'friendly'],
            'conflict': ['enemy', 'hostile']
        };
        
        // Determina quais tipos contar
        const typesToCount = typeMapping[type] || [type];
        
        for (const relations of this.relationships.values()) {
            for (const relation of relations) {
                if (typesToCount.includes(relation.type)) {
                    count++;
                }
            }
        }
        
        // Como cada relacionamento é contado duas vezes (uma para cada bactéria)
        return Math.floor(count / 2);
    }
    
    /**
     * Verifica se duas bactérias são amigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem amigas
     */
    areFriends(b1, b2) {
        const relationship = this.getRelationship(b1, b2);
        return relationship && (relationship.type === 'friend' || relationship.type === 'friendly');
    }
    
    /**
     * Verifica se duas bactérias são inimigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem inimigas
     */
    areEnemies(b1, b2) {
        const relationship = this.getRelationship(b1, b2);
        return relationship && (relationship.type === 'enemy' || relationship.type === 'hostile');
    }
}

// Exportar para o escopo global
window.RelationshipManager = RelationshipManager;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = RelationshipManager;
} 