/**
 * Sistema de comunicação entre bactérias - Módulo Principal
 * Integra todos os componentes do sistema de comunicação
 */

// Importa os componentes do sistema
// O caminho relativo "./" é usado porque todos os arquivos estão na mesma pasta
const CommunicationUtils = window.CommunicationUtils || (typeof require !== 'undefined' ? require('./CommunicationUtils') : null);
const CommunicationInterface = window.CommunicationInterface || (typeof require !== 'undefined' ? require('./CommunicationInterface') : null);
const MessageManager = window.MessageManager || (typeof require !== 'undefined' ? require('./MessageManager') : null);
const MessageGenerator = window.MessageGenerator || (typeof require !== 'undefined' ? require('./MessageGenerator') : null);
const RelationshipManager = window.RelationshipManager || (typeof require !== 'undefined' ? require('./RelationshipManager') : null);
const CommunicationSystem = window.CommunicationSystem || (typeof require !== 'undefined' ? require('./CommunicationSystem') : null);

/**
 * Wrapper para manter compatibilidade com o sistema original
 * Esta classe mantém a mesma API da classe BacteriaCommunication original,
 * mas internamente usa a nova estrutura modular
 */
class BacteriaCommunication {
    /**
     * Inicializa o sistema de comunicação
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        // Expõe todas as classes para o escopo global
        window.CommunicationUtils = window.CommunicationUtils || CommunicationUtils;
        window.CommunicationInterface = window.CommunicationInterface || CommunicationInterface;
        window.MessageManager = window.MessageManager || MessageManager;
        window.MessageGenerator = window.MessageGenerator || MessageGenerator;
        window.RelationshipManager = window.RelationshipManager || RelationshipManager;
        window.CommunicationSystem = window.CommunicationSystem || CommunicationSystem;
        
        // Cria uma instância do sistema modularizado
        this.system = new CommunicationSystem(simulation);
        
        // Define atalhos para facilitar o acesso às principais funcionalidades
        this.messages = this.system.messageManager.messages;
        this.messageTypes = this.system.messageManager.messageTypes;
        this.relationships = this.system.relationshipManager.relationships;
        this.communicationRange = this.system.communicationRange;
        this.randomMessageChance = this.system.randomMessageChance;
        
        console.log("Sistema de comunicação modularizado inicializado com sucesso");
    }
    
    /**
     * Atualiza o sistema de comunicação a cada frame
     */
    update() {
        this.system.update();
    }
    
    /**
     * Adiciona uma mensagem ao histórico
     * @param {Object} message - Objeto da mensagem
     */
    addMessage(message) {
        this.system.messageManager.addMessage(message);
    }
    
    /**
     * Envia uma mensagem do usuário
     */
    sendUserMessage() {
        this.system.messageManager.sendUserMessage();
    }
    
    /**
     * Limpa o chat
     */
    clearChat() {
        this.system.messageManager.clearChat();
    }
    
    /**
     * Cria uma comunicação entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     */
    createCommunication(sender, receiver) {
        this.system.messageManager.createBacteriaMessage(sender, receiver);
    }
    
    /**
     * Agenda uma resposta da bactéria
     * @param {Bacteria} bacteria - Bactéria que responderá
     */
    scheduleResponse(bacteria) {
        this.system.messageManager.scheduleResponse(bacteria);
    }
    
    /**
     * Obtém o ID de uma bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {string} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        return this.system.utils.getBacteriaId(bacteria);
    }
    
    /**
     * Obtém o relacionamento entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {Object|null} - Objeto de relacionamento ou null
     */
    getRelationship(b1, b2) {
        return this.system.relationshipManager.getRelationship(b1, b2);
    }
    
    /**
     * Conta o número de relacionamentos de determinado tipo
     * @param {string} type - Tipo de relacionamento
     * @returns {number} - Quantidade de relacionamentos
     */
    countRelationships(type) {
        return this.system.relationshipManager.countRelationships(type);
    }
    
    /**
     * Retorna uma direção aleatória
     * @returns {string} - Direção (norte, sul, leste, oeste)
     */
    getRandomDirection() {
        return this.system.messageGenerator.getRandomDirection();
    }
    
    /**
     * Atualiza a interface do chat
     */
    updateChatInterface() {
        this.system.messageManager.updateInterfaceStats();
    }
    
    /**
     * Retorna a hora formatada
     * @returns {string} - Hora formatada
     */
    getFormattedTime() {
        return this.system.utils.getFormattedTime();
    }
}

// Exporta a classe para o escopo global
window.BacteriaCommunication = BacteriaCommunication;

// Exporta para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = {
        BacteriaCommunication,
        CommunicationSystem,
        CommunicationInterface,
        MessageManager,
        MessageGenerator,
        RelationshipManager,
        CommunicationUtils
    };
} 