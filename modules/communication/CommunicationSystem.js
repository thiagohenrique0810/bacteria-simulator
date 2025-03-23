/**
 * Sistema de comunicação entre bactérias
 * Classe principal que coordena todos os componentes do sistema de comunicação
 */
class CommunicationSystem {
    /**
     * Inicializa o sistema de comunicação
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.communicationRange = 100;    // Distância máxima para comunicação direta
        this.randomMessageChance = 0.003; // Chance de enviar mensagem aleatória por frame
        this.userCanChat = true;          // Se o usuário pode enviar mensagens
        
        // Inicializa os componentes
        this.utils = new CommunicationUtils(this);
        this.messageManager = new MessageManager(this);
        this.relationshipManager = new RelationshipManager(this);
        this.messageGenerator = new MessageGenerator(this);
        this.interfaceManager = new CommunicationInterface(this);
    }
    
    /**
     * Atualiza o sistema de comunicação a cada frame
     */
    update() {
        // Verifica se há bactérias próximas para comunicação
        this.checkBacteriaCommunication();
    }
    
    /**
     * Verifica bactérias próximas umas das outras para possível comunicação
     */
    checkBacteriaCommunication() {
        const bacteria = this.simulation.bacteria;
        
        // Usa o grid espacial se disponível
        if (this.simulation.spatialGrid) {
            for (let i = 0; i < bacteria.length; i++) {
                const b1 = bacteria[i];
                
                // Chance de iniciar comunicação baseada no gene de sociabilidade
                const communicationChance = this.utils.getPersonalityBasedChance(
                    b1, 'sociability', this.randomMessageChance
                );
                
                // Tenta iniciar comunicação aleatória
                if (random() < communicationChance) {
                    // Busca bactérias próximas usando o grid espacial
                    const nearbyBacteria = this.utils.findNearbyBacteria(b1, this.communicationRange);
                    
                    if (nearbyBacteria.length > 0) {
                        // Seleciona uma bactéria aleatória próxima
                        const b2 = random(nearbyBacteria);
                        this.messageManager.createBacteriaMessage(b1, b2);
                    }
                }
            }
        } else {
            // Fallback se o grid espacial não estiver disponível (método menos eficiente)
            for (let i = 0; i < bacteria.length; i++) {
                const b1 = bacteria[i];
                
                // Menor chance de comunicação para evitar sobrecarga no método não otimizado
                const communicationChance = this.utils.getPersonalityBasedChance(
                    b1, 'sociability', this.randomMessageChance * 0.5
                );
                
                if (random() < communicationChance) {
                    for (let j = 0; j < bacteria.length; j++) {
                        if (i === j) continue;
                        
                        const b2 = bacteria[j];
                        if (this.utils.isInCommunicationRange(b1, b2, this.communicationRange)) {
                            this.messageManager.createBacteriaMessage(b1, b2);
                            break; // Apenas uma comunicação por vez
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Fornece acesso ao relacionamento entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {Object|null} - Relacionamento ou null se não existir
     */
    getRelationship(b1, b2) {
        return this.relationshipManager.getRelationship(b1, b2);
    }
    
    /**
     * Verifica se duas bactérias são amigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem amigas
     */
    areBacteriaFriends(b1, b2) {
        return this.relationshipManager.areFriends(b1, b2);
    }
    
    /**
     * Verifica se duas bactérias são inimigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem inimigas
     */
    areBacteriaEnemies(b1, b2) {
        return this.relationshipManager.areEnemies(b1, b2);
    }
    
    /**
     * Define o raio de comunicação entre bactérias
     * @param {number} range - Novo raio de comunicação
     */
    setCommunicationRange(range) {
        this.communicationRange = range;
    }
    
    /**
     * Define a chance de mensagens aleatórias
     * @param {number} chance - Nova chance de mensagens aleatórias
     */
    setRandomMessageChance(chance) {
        this.randomMessageChance = chance;
    }
    
    /**
     * Ativa ou desativa a capacidade do usuário de enviar mensagens
     * @param {boolean} canChat - Se o usuário pode chatear
     */
    setUserCanChat(canChat) {
        this.userCanChat = canChat;
    }
}

// Exportar para o escopo global
window.CommunicationSystem = CommunicationSystem;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = CommunicationSystem;
} 