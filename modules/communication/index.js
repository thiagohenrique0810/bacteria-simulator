/**
 * Sistema de comunicação entre bactérias - Módulo Principal
 * Integra todos os componentes do sistema de comunicação
 */

// Importa os componentes do sistema
// O caminho relativo "./" é usado porque todos os arquivos estão na mesma pasta
// Verifica se os componentes já estão disponíveis no escopo global
const CommunicationUtilsModule = window.CommunicationUtils || (typeof require !== 'undefined' ? require('./CommunicationUtils') : null);
const CommunicationInterfaceModule = window.CommunicationInterface || (typeof require !== 'undefined' ? require('./CommunicationInterface') : null);
const MessageManagerModule = window.MessageManager || (typeof require !== 'undefined' ? require('./MessageManager') : null);
const MessageGeneratorModule = window.MessageGenerator || (typeof require !== 'undefined' ? require('./MessageGenerator') : null);
const RelationshipManagerModule = window.RelationshipManager || (typeof require !== 'undefined' ? require('./RelationshipManager') : null);
const CommunicationSystemModule = window.CommunicationSystem || (typeof require !== 'undefined' ? require('./CommunicationSystem') : null);

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
        // Verificar se todos os componentes necessários estão disponíveis
        const requiredComponents = [
            { name: 'CommunicationSystem', obj: window.CommunicationSystem },
            { name: 'CommunicationUtils', obj: window.CommunicationUtils },
            { name: 'CommunicationInterface', obj: window.CommunicationInterface },
            { name: 'MessageManager', obj: window.MessageManager },
            { name: 'MessageGenerator', obj: window.MessageGenerator },
            { name: 'RelationshipManager', obj: window.RelationshipManager }
        ];
        
        // Verifica se todos os componentes estão disponíveis
        const missingComponents = requiredComponents.filter(comp => !comp.obj);
        
        if (missingComponents.length > 0) {
            console.error(`Os seguintes componentes não foram encontrados: ${missingComponents.map(c => c.name).join(', ')}`);
            console.error("Verifique se todos os arquivos JavaScript foram carregados na ordem correta.");
            return;
        }
        
        try {
            // Cria uma instância do sistema modularizado
            this.system = new window.CommunicationSystem(simulation);
            
            // Define atalhos para facilitar o acesso às principais funcionalidades
            this.messages = this.system.messageManager.messages;
            this.messageTypes = this.system.messageManager.messageTypes;
            this.relationships = this.system.relationshipManager.relationships;
            this.communicationRange = this.system.communicationRange;
            this.randomMessageChance = this.system.randomMessageChance;
            
            console.log("Sistema de comunicação modularizado inicializado com sucesso");
        } catch (error) {
            console.error("Erro ao inicializar o sistema de comunicação:", error);
        }
    }
    
    /**
     * Atualiza o sistema de comunicação a cada frame
     */
    update() {
        // Verifica se o sistema foi inicializado corretamente
        if (this.system) {
            this.system.update();
        } else {
            console.warn("Sistema de comunicação não foi inicializado corretamente");
        }
    }
    
    /**
     * Adiciona uma mensagem ao histórico
     * @param {Object} message - Objeto da mensagem
     */
    addMessage(message) {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.addMessage(message);
        }
    }
    
    /**
     * Envia uma mensagem do usuário
     */
    sendUserMessage() {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.sendUserMessage();
        }
    }
    
    /**
     * Limpa o chat
     */
    clearChat() {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.clearChat();
        }
    }
    
    /**
     * Cria uma comunicação entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     */
    createCommunication(sender, receiver) {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.createBacteriaMessage(sender, receiver);
        }
    }
    
    /**
     * Agenda uma resposta da bactéria
     * @param {Bacteria} bacteria - Bactéria que responderá
     */
    scheduleResponse(bacteria) {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.scheduleResponse(bacteria);
        }
    }
    
    /**
     * Obtém o ID de uma bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {string} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        if (this.system && this.system.utils) {
            return this.system.utils.getBacteriaId(bacteria);
        }
        return "unknown";
    }
    
    /**
     * Obtém o relacionamento entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {Object|null} - Objeto de relacionamento ou null
     */
    getRelationship(b1, b2) {
        if (this.system && this.system.relationshipManager) {
            return this.system.relationshipManager.getRelationship(b1, b2);
        }
        return null;
    }
    
    /**
     * Conta o número de relacionamentos de determinado tipo
     * @param {string} type - Tipo de relacionamento
     * @returns {number} - Quantidade de relacionamentos
     */
    countRelationships(type) {
        if (this.system && this.system.relationshipManager) {
            return this.system.relationshipManager.countRelationships(type);
        }
        return 0;
    }
    
    /**
     * Retorna uma direção aleatória
     * @returns {string} - Direção (norte, sul, leste, oeste)
     */
    getRandomDirection() {
        if (this.system && this.system.messageGenerator) {
            return this.system.messageGenerator.getRandomDirection();
        }
        return "norte";
    }
    
    /**
     * Atualiza a interface do chat
     */
    updateChatInterface() {
        if (this.system && this.system.messageManager) {
            this.system.messageManager.updateInterfaceStats();
        }
    }
    
    /**
     * Retorna a hora formatada
     * @returns {string} - Hora formatada
     */
    getFormattedTime() {
        if (this.system && this.system.utils) {
            return this.system.utils.getFormattedTime();
        }
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
}

// Exporta a classe para o escopo global
window.BacteriaCommunication = BacteriaCommunication;

// Exporta para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = {
        BacteriaCommunication,
        CommunicationSystem: window.CommunicationSystem,
        CommunicationInterface: window.CommunicationInterface,
        MessageManager: window.MessageManager,
        MessageGenerator: window.MessageGenerator,
        RelationshipManager: window.RelationshipManager,
        CommunicationUtils: window.CommunicationUtils
    };
} 