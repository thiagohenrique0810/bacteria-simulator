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
     * Adiciona uma mensagem ao histórico
     * @param {Object} message - A mensagem a ser adicionada
     */
    addMessage(message) {
        // Verifica se a mensagem é válida
        if (!message) {
            console.warn("Tentativa de adicionar uma mensagem inexistente");
            return;
        }
        
        // Garante que a mensagem tenha o campo text para compatibilidade
        if (!message.text && message.content) {
            message.text = message.content;
        }
        
        this.messages.push(message);
        
        // Limita o tamanho do histórico
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        // Exibe a mensagem na interface, com verificação de segurança
        if (this.communicationSystem && 
            this.communicationSystem.interfaceManager && 
            typeof this.communicationSystem.interfaceManager.displayMessage === 'function') {
            try {
                this.communicationSystem.interfaceManager.displayMessage(message);
            } catch (error) {
                console.warn("Erro ao exibir mensagem na interface:", error);
            }
        }
        
        // Atualiza estatísticas
        this.updateInterfaceStats();
    }
    
    /**
     * Verifica se uma bactéria contém todas as propriedades necessárias para comunicação
     * @param {Bacteria} bacteria - Bactéria a ser verificada
     * @returns {boolean} - Se a bactéria é válida para comunicação
     */
    isBacteriaValid(bacteria) {
        if (!bacteria || typeof bacteria !== 'object') {
            console.warn("Bactéria inválida: não é um objeto");
            return false;
        }
        
        // Verifica ID
        if (!bacteria.id || (typeof bacteria.id !== 'string' && typeof bacteria.id !== 'number')) {
            console.warn(`Bactéria com ID inválido: ${bacteria.id}`);
            return false;
        }
        
        // Verifica posição - crítica para comunicação
        if (!bacteria.pos) {
            console.warn(`Bactéria ${bacteria.id} sem posição`);
            return false;
        }
        
        // Verifica coordenadas x e y da posição
        const hasValidX = typeof bacteria.pos.x === 'number' && !isNaN(bacteria.pos.x);
        const hasValidY = typeof bacteria.pos.y === 'number' && !isNaN(bacteria.pos.y);
        
        if (!hasValidX || !hasValidY) {
            console.warn(`Bactéria ${bacteria.id} com coordenadas inválidas: x=${bacteria.pos.x}, y=${bacteria.pos.y}`);
            return false;
        }
        
        // Verifica estado
        if (!bacteria.stateManager || typeof bacteria.stateManager.getCurrentState !== 'function') {
            console.warn(`Bactéria ${bacteria.id} sem gerenciador de estado válido`);
            return false;
        }
        
        // Verifica atributos de comunicação
        if (typeof bacteria.isFemale !== 'boolean') {
            console.warn(`Bactéria ${bacteria.id} sem atributo isFemale definido`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Cria uma mensagem de comunicação entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia a mensagem
     * @param {Bacteria} receiver - Bactéria que recebe a mensagem
     * @returns {boolean} - Sucesso da operação
     */
    createBacteriaMessage(sender, receiver) {
        try {
            // Validação mais robusta de sender e receiver
            if (!sender || !receiver || !sender.id || !receiver.id) {
                console.warn("MessageManager: Bactérias inválidas ou sem IDs");
                return false;
            }
            
            // Verifica se as bactérias têm propriedades essenciais
            if (!this.isBacteriaValid(sender) || !this.isBacteriaValid(receiver)) {
                console.warn("MessageManager: Bactéria(s) com propriedades inválidas");
                return false;
            }
            
            const senderId = sender.id;
            const receiverId = receiver.id;
            
            if (!senderId || !receiverId) {
                console.warn("MessageManager: Bactérias sem IDs válidos");
                return false;
            }
            
            // Verifica se o sistema de comunicação e o gerador de mensagens existem
            if (!this.communicationSystem) {
                console.error("MessageManager: Sistema de comunicação não definido");
                return false;
            }
            
            // Obtém acesso ao gerenciador de relacionamentos e gerador de mensagens, com verificação
            const relationshipManager = this.communicationSystem.relationshipManager;
            
            // Verifica se o messageGenerator existe no sistema de comunicação
            if (!this.communicationSystem.messageGenerator) {
                console.error("MessageManager: Gerador de mensagens não encontrado no sistema de comunicação");
                return false;
            }
            
            const messageGenerator = this.communicationSystem.messageGenerator;
            
            // Verifica se o método determineMessageType existe no gerador de mensagens
            if (typeof messageGenerator.determineMessageType !== 'function') {
                console.error("MessageManager: Método determineMessageType não encontrado no gerador de mensagens");
                return false;
            }
            
            // Determina o tipo de comunicação baseado no contexto (com tratamento de erro)
            let msgType;
            try {
                msgType = messageGenerator.determineMessageType(sender, receiver);
            } catch (error) {
                console.error("Erro ao determinar tipo de mensagem:", error);
                return false;
            }
            
            // Se não foi possível determinar o tipo, cancela
            if (!msgType) {
                console.warn("MessageManager: Não foi possível determinar o tipo de mensagem");
                return false;
            }
            
            // Verifica se o método generateMessage existe no gerador de mensagens
            if (typeof messageGenerator.generateMessage !== 'function') {
                console.error("MessageManager: Método generateMessage não encontrado no gerador de mensagens");
                return false;
            }
            
            // Gera o conteúdo da mensagem
            let content;
            try {
                content = messageGenerator.generateMessage(sender, receiver, msgType);
            } catch (error) {
                console.error("Erro ao gerar conteúdo da mensagem:", error);
                return false;
            }
            
            // Verifica se o conteúdo foi gerado
            if (!content) {
                console.warn("MessageManager: Não foi possível gerar o conteúdo da mensagem");
                return false;
            }
            
            // Verifica se os utilitários existem antes de tentar formatar o tempo
            if (!this.communicationSystem.utils || typeof this.communicationSystem.utils.getFormattedTime !== 'function') {
                console.error("MessageManager: Utilitários de comunicação não encontrados ou método getFormattedTime não disponível");
                // Use uma alternativa para o timestamp
                var time = new Date().toLocaleTimeString();
            } else {
                var time = this.communicationSystem.utils.getFormattedTime();
            }
            
            // Cria o objeto da mensagem com verificações seguras
            const message = {
                senderId: senderId,
                receiverId: receiverId,
                isFemale: sender.isFemale === true, // Garante que seja um booleano
                type: msgType,
                content: content,
                text: content, // Adiciona o campo 'text' para compatibilidade
                time: time
            };
            
            // Adiciona a mensagem ao histórico
            this.addMessage(message);
            
            // Atualiza relacionamentos
            if (relationshipManager && typeof relationshipManager.updateRelationship === 'function') {
                relationshipManager.updateRelationship(sender, receiver, msgType);
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao criar mensagem entre bactérias:", error);
            return false;
        }
    }
    
    /**
     * Limpa todas as mensagens do chat
     */
    clearChat() {
        // Limpa o array de mensagens
        this.messages = [];
        
        // Limpa a interface do chat, se disponível
        if (this.communicationSystem && 
            this.communicationSystem.interfaceManager && 
            typeof this.communicationSystem.interfaceManager.clearMessageDisplay === 'function') {
            try {
                this.communicationSystem.interfaceManager.clearMessageDisplay();
            } catch (error) {
                console.warn("Erro ao limpar a interface de mensagens:", error);
            }
        }
        
        // Atualiza estatísticas
        this.updateInterfaceStats();
    }
    
    /**
     * Atualiza as estatísticas na interface
     */
    updateInterfaceStats() {
        // Verifica se os componentes necessários estão disponíveis
        if (!this.communicationSystem || 
            !this.communicationSystem.relationshipManager || 
            !this.communicationSystem.interfaceManager) {
            return;
        }
        
        try {
            const relationshipManager = this.communicationSystem.relationshipManager;
            const interfaceManager = this.communicationSystem.interfaceManager;
            
            // Verifica se os métodos necessários existem
            if (typeof relationshipManager.countRelationships !== 'function' ||
                typeof interfaceManager.updateStats !== 'function') {
                return;
            }
            
            const totalMessages = this.messages.length;
            const friendships = relationshipManager.countRelationships('friendship');
            const conflicts = relationshipManager.countRelationships('conflict');
            
            interfaceManager.updateStats(totalMessages, friendships, conflicts);
        } catch (error) {
            console.warn("Erro ao atualizar estatísticas:", error);
        }
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