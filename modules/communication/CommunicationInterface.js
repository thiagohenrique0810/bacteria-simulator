/**
 * Interface de usuário do sistema de comunicação
 * Responsável por gerenciar os elementos de UI do chat
 */
class CommunicationInterface {
    /**
     * Inicializa a interface do sistema de comunicação
     * @param {MessageManager} messageManager - Gerenciador de mensagens
     */
    constructor(messageManager) {
        this.messageManager = messageManager;
        this.chatInterface = null;
        this.messagesContainer = null;
        this.userMessageInput = null;
        this.sendButton = null;
        this.clearButton = null;
        this.statsContainer = null;
        
        // Inicializa os elementos da interface
        this.initializeInterface();
    }

    /**
     * Inicializa a interface de chat usando os elementos HTML existentes
     */
    initializeInterface() {
        // Referências para os elementos HTML existentes
        this.chatInterface = document.getElementById('chat-container');
        this.messagesContainer = document.getElementById('chat-messages');
        this.userMessageInput = document.getElementById('chat-input');
        
        // Habilita o campo de entrada
        if (this.userMessageInput) {
            this.userMessageInput.removeAttribute('disabled');
            this.userMessageInput.setAttribute('placeholder', 'Digite sua mensagem...');
        }
        
        // Configura os botões existentes
        const sendButton = document.querySelector('.enviar-btn') || document.getElementById('send-chat-btn');
        const clearButton = document.querySelector('.limpar-btn') || document.getElementById('clear-chat-btn');
        
        // Se os botões existirem, configura os event listeners
        if (sendButton) {
            this.sendButton = sendButton;
            this.sendButton.addEventListener('click', () => this.messageManager.sendUserMessage());
        }
        
        if (clearButton) {
            this.clearButton = clearButton;
            this.clearButton.addEventListener('click', () => this.messageManager.clearChat());
        }
        
        // Permite enviar com a tecla Enter
        if (this.userMessageInput) {
            this.userMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.messageManager.sendUserMessage();
                }
            });
        }
        
        // Adiciona estatísticas ao container existente
        this.createStatsContainer();
    }
    
    /**
     * Cria o container de estatísticas se não existir
     */
    createStatsContainer() {
        if (!this.chatInterface) return;
        
        const existingStats = document.getElementById('chat-stats');
        if (existingStats) {
            this.statsContainer = existingStats;
            return;
        }
        
        const statsElement = document.createElement('div');
        statsElement.id = 'chat-stats';
        statsElement.className = 'estatisticas-de-comunicacao';
        statsElement.style.fontSize = '11px';
        statsElement.style.padding = '10px';
        statsElement.style.backgroundColor = 'rgba(40, 40, 50, 0.7)';
        statsElement.style.borderRadius = '4px';
        statsElement.style.marginTop = '10px';
        
        this.chatInterface.appendChild(statsElement);
        this.statsContainer = statsElement;
        this.updateStats(0, 0, 0);
    }
    
    /**
     * Atualiza as estatísticas exibidas no painel
     * @param {number} totalMessages - Total de mensagens
     * @param {number} friendships - Número de amizades
     * @param {number} conflicts - Número de conflitos
     */
    updateStats(totalMessages, friendships, conflicts) {
        if (!this.statsContainer) return;
        
        this.statsContainer.innerHTML = `
            <div>Total de mensagens: <strong>${totalMessages}</strong></div>
            <div>Amizades formadas: <strong>${friendships}</strong></div>
            <div>Conflitos: <strong>${conflicts}</strong></div>
        `;
    }
    
    /**
     * Adiciona uma mensagem ao container do chat
     * @param {Object} message - Objeto da mensagem
     */
    displayMessage(message) {
        if (!this.messagesContainer) return;
        
        // Cria o elemento da mensagem
        const messageElement = document.createElement('div');
        
        // Define a classe apropriada
        let messageClass = 'message';
        if (message.senderId === 'USER') {
            messageClass += ' user';
        } else if (message.type === 'danger') {
            messageClass += ' predator';
        } else {
            messageClass += ' bacteria';
        }
        
        messageElement.className = messageClass;
        
        // Define o conteúdo da mensagem
        messageElement.textContent = message.content;
        
        // Adiciona ao container
        this.messagesContainer.appendChild(messageElement);
        
        // Scroll para a última mensagem
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    /**
     * Limpa todas as mensagens da interface
     * @param {boolean} preserveSystem - Se deve preservar a mensagem do sistema
     */
    clearMessageDisplay(preserveSystem = true) {
        if (!this.messagesContainer) return;
        
        if (preserveSystem) {
            const systemMessage = this.messagesContainer.querySelector('.message.system');
            this.messagesContainer.innerHTML = '';
            
            if (systemMessage) {
                this.messagesContainer.appendChild(systemMessage);
            }
        } else {
            this.messagesContainer.innerHTML = '';
        }
    }
    
    /**
     * Obtém o valor atual do campo de entrada de mensagem
     * @returns {string} - Valor do campo de texto
     */
    getInputValue() {
        return this.userMessageInput ? this.userMessageInput.value.trim() : '';
    }
    
    /**
     * Limpa o campo de entrada de mensagem
     */
    clearInput() {
        if (this.userMessageInput) {
            this.userMessageInput.value = '';
        }
    }
}

// Exporta a classe
if (typeof module !== 'undefined') {
    module.exports = CommunicationInterface;
} 