/**
 * Gerenciador de mensagens do sistema de comunicação
 * Responsável por armazenar, criar e gerenciar mensagens
 */
class MessageManager {
    /**
     * Inicializa o gerenciador de mensagens
     * @param {CommunicationSystem} communicationSystem - Sistema de comunicação principal
     */
    constructor(communicationSystem) {
        this.communicationSystem = communicationSystem;
        this.messages = [];          // Histórico de mensagens recentes
        this.maxMessages = 50;       // Número máximo de mensagens no histórico
        
        // Tipos de mensagens possíveis
        this.messageTypes = {
            GREETING: 'greeting',         // Cumprimento básico
            FOOD_INFO: 'food_info',       // Informação sobre comida
            DANGER_WARNING: 'danger',     // Aviso sobre predadores
            HELP_REQUEST: 'help',         // Pedido de ajuda
            FRIENDSHIP: 'friendship',     // Proposta de amizade
            AGGRESSIVE: 'aggressive',     // Mensagem agressiva
            MATING: 'mating',             // Relacionado à reprodução
            RANDOM: 'random',             // Conversa aleatória
            USER: 'user'                  // Mensagem do usuário
        };
    }
    
    /**
     * Envia uma mensagem do usuário para uma bactéria aleatória
     */
    sendUserMessage() {
        const interfaceManager = this.communicationSystem.interfaceManager;
        const message = interfaceManager.getInputValue();
        const simulation = this.communicationSystem.simulation;
        const messageGenerator = this.communicationSystem.messageGenerator;
        
        if (message && simulation.bacteria.length > 0) {
            // Seleciona uma bactéria aleatória para receber a mensagem
            const targetBacteria = random(simulation.bacteria);
            
            // Cria o objeto da mensagem
            const userMessage = {
                senderId: 'USER',
                receiverId: this.communicationSystem.utils.getBacteriaId(targetBacteria),
                isFemale: false,
                type: this.messageTypes.USER,
                content: message,
                time: this.communicationSystem.utils.getFormattedTime()
            };
            
            // Adiciona a mensagem ao histórico
            this.addMessage(userMessage);
            
            // Limpa o campo de texto
            interfaceManager.clearInput();
            
            // Programa uma resposta da bactéria
            this.scheduleResponse(targetBacteria);
        }
    }
    
    /**
     * Agenda uma resposta da bactéria para a mensagem do usuário
     * @param {Bacteria} bacteria - Bactéria que responderá
     */
    scheduleResponse(bacteria) {
        const messageGenerator = this.communicationSystem.messageGenerator;
        const utils = this.communicationSystem.utils;
        
        // Atraso baseado na sociabilidade da bactéria (mais sociável = responde mais rápido)
        const sociability = bacteria.dna?.genes?.sociability || 1;
        const delay = map(sociability, 0.5, 1.5, 3000, 1000); // Entre 1 e 3 segundos
        
        setTimeout(() => {
            if (this.communicationSystem.simulation.bacteria.includes(bacteria)) {
                // Apenas responde se a bactéria ainda estiver viva
                const response = messageGenerator.generateBacteriaResponse(bacteria);
                
                const responseMessage = {
                    senderId: utils.getBacteriaId(bacteria),
                    receiverId: 'USER',
                    isFemale: bacteria.isFemale,
                    type: this.messageTypes.RANDOM,
                    content: response,
                    time: utils.getFormattedTime()
                };
                
                this.addMessage(responseMessage);
            }
        }, delay);
    }
    
    /**
     * Adiciona uma mensagem ao histórico e à interface
     * @param {Object} message - Objeto da mensagem
     */
    addMessage(message) {
        // Adiciona no array de mensagens
        this.messages.push(message);
        
        // Limita o tamanho do histórico
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        // Exibe a mensagem na interface
        this.communicationSystem.interfaceManager.displayMessage(message);
        
        // Atualiza estatísticas
        this.updateInterfaceStats();
    }
    
    /**
     * Cria uma mensagem entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     */
    createBacteriaMessage(sender, receiver) {
        const relationshipManager = this.communicationSystem.relationshipManager;
        const messageGenerator = this.communicationSystem.messageGenerator;
        const utils = this.communicationSystem.utils;
        
        // Determina o tipo de comunicação baseado no contexto
        const msgType = messageGenerator.determineMessageType(sender, receiver);
        
        // Gera o conteúdo da mensagem
        const content = messageGenerator.generateMessage(sender, receiver, msgType);
        
        // Cria o objeto da mensagem
        const message = {
            senderId: utils.getBacteriaId(sender),
            receiverId: utils.getBacteriaId(receiver),
            isFemale: sender.isFemale,
            type: msgType,
            content: content,
            time: utils.getFormattedTime()
        };
        
        // Adiciona a mensagem ao histórico
        this.addMessage(message);
        
        // Atualiza relacionamentos
        relationshipManager.updateRelationship(sender, receiver, msgType);
    }
    
    /**
     * Limpa todas as mensagens do chat
     */
    clearChat() {
        // Limpa o array de mensagens
        this.messages = [];
        
        // Limpa a interface do chat
        this.communicationSystem.interfaceManager.clearMessageDisplay();
        
        // Atualiza estatísticas
        this.updateInterfaceStats();
    }
    
    /**
     * Atualiza as estatísticas na interface
     */
    updateInterfaceStats() {
        const relationshipManager = this.communicationSystem.relationshipManager;
        const interfaceManager = this.communicationSystem.interfaceManager;
        
        const totalMessages = this.messages.length;
        const friendships = relationshipManager.countRelationships('friendship');
        const conflicts = relationshipManager.countRelationships('conflict');
        
        interfaceManager.updateStats(totalMessages, friendships, conflicts);
    }
    
    /**
     * Retorna o número total de mensagens
     * @returns {number} - Número de mensagens
     */
    getTotalMessages() {
        return this.messages.length;
    }
}

// Exportar para o escopo global
window.MessageManager = MessageManager;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = MessageManager;
} 