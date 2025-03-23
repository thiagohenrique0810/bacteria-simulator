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
        this.neuralStatsContainer = null;
        this.toggleButton = null;
        this.statsButton = null;
        this.neuralStatsButton = null;
        this.messages = [];
        this.maxDisplayMessages = 5;
        this.isVisible = true;
        this.statsVisible = false;
        this.neuralStatsVisible = false;
        
        // Estatísticas de comunicação
        this.stats = {
            totalMessages: 0,
            messagesByType: {},
            positiveInteractions: 0,
            negativeInteractions: 0,
            neutralInteractions: 0
        };
        
        // Estatísticas de comunicação neural
        this.neuralStats = {
            enabled: false,
            bacteriaCount: 0,
            vocabSize: 0,
            rewardAvg: 0
        };
        
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
        
        // Adiciona botões para mostrar/ocultar o chat, estatísticas e estatísticas neurais
        this.createToggleButtons();
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
        if (message.senderId === 'USER') {
            // Para mensagens do usuário, mostra apenas o conteúdo
            messageElement.textContent = message.content || message.text || '';
        } else {
            // Para mensagens de bactérias, inclui o ID e o conteúdo
            const senderName = `Bactéria #${message.senderId}${message.isFemale ? ' ♀' : ' ♂'}`;
            let content = message.content || message.text || '...';
            
            // Interpreta conteúdo neural
            if (content.startsWith('NEURAL:')) {
                const neuralIndex = parseInt(content.split(':')[1]);
                // Mapeia o índice neural para uma descrição mais informativa
                const neuralMessages = [
                    "Exploração do ambiente",
                    "Busca por comida",
                    "Alerta de predador!",
                    "Procurando parceiro",
                    "Descansando para recuperar energia",
                    "Compartilhando informação",
                    "Proposta de cooperação",
                    "Aviso sobre território",
                    "Solicitação de ajuda"
                ];
                
                // Usa uma mensagem descritiva com base no índice, ou uma mensagem genérica
                content = neuralIndex >= 0 && neuralIndex < neuralMessages.length 
                    ? neuralMessages[neuralIndex]
                    : `Comunicação neural (${neuralIndex})`;
            }
            
            // Use um span para o nome do remetente com estilo apropriado
            messageElement.innerHTML = `<strong>${senderName}</strong><br>${content}`;
        }
        
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
    
    /**
     * Adiciona botões para mostrar/ocultar o chat, estatísticas e estatísticas neurais
     */
    createToggleButtons() {
        if (!this.chatInterface) return;
        
        // Cria um container para os botões
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'chat-toggle-buttons';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.padding = '5px';
        buttonContainer.style.backgroundColor = '#2a2f3a';
        buttonContainer.style.borderBottom = '1px solid #363a45';
        
        // Botão para mostrar/ocultar o chat
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'toggle-btn';
        this.toggleButton.textContent = 'Ocultar Chat';
        this.toggleButton.style.padding = '5px 8px';
        this.toggleButton.style.fontSize = '12px';
        this.toggleButton.style.border = 'none';
        this.toggleButton.style.borderRadius = '3px';
        this.toggleButton.style.backgroundColor = '#3a3f4b';
        this.toggleButton.style.color = '#e1e1e6';
        this.toggleButton.style.cursor = 'pointer';
        this.toggleButton.addEventListener('click', () => this.toggleVisibility());
        
        // Botão para mostrar/ocultar estatísticas de comunicação
        this.statsButton = document.createElement('button');
        this.statsButton.className = 'stats-btn';
        this.statsButton.textContent = 'Estatísticas';
        this.statsButton.style.padding = '5px 8px';
        this.statsButton.style.fontSize = '12px';
        this.statsButton.style.border = 'none';
        this.statsButton.style.borderRadius = '3px';
        this.statsButton.style.backgroundColor = '#3a3f4b';
        this.statsButton.style.color = '#e1e1e6';
        this.statsButton.style.cursor = 'pointer';
        this.statsButton.addEventListener('click', () => this.toggleStats());
        
        // Botão para mostrar/ocultar estatísticas de comunicação neural
        this.neuralStatsButton = document.createElement('button');
        this.neuralStatsButton.className = 'neural-stats-btn';
        this.neuralStatsButton.textContent = 'Neuro Stats';
        this.neuralStatsButton.style.padding = '5px 8px';
        this.neuralStatsButton.style.fontSize = '12px';
        this.neuralStatsButton.style.border = 'none';
        this.neuralStatsButton.style.borderRadius = '3px';
        this.neuralStatsButton.style.backgroundColor = '#3a3f4b';
        this.neuralStatsButton.style.color = '#e1e1e6';
        this.neuralStatsButton.style.cursor = 'pointer';
        this.neuralStatsButton.addEventListener('click', () => this.toggleNeuralStats());
        
        // Adiciona os botões ao container
        buttonContainer.appendChild(this.toggleButton);
        buttonContainer.appendChild(this.statsButton);
        buttonContainer.appendChild(this.neuralStatsButton);
        
        // Adiciona o container após o cabeçalho do chat
        const chatHeader = document.getElementById('chat-header');
        if (chatHeader) {
            chatHeader.parentNode.insertBefore(buttonContainer, chatHeader.nextSibling);
        } else {
            this.chatInterface.insertBefore(buttonContainer, this.chatInterface.firstChild);
        }
    }
    
    /**
     * Alterna a visibilidade do chat
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.chatInterface.style.display = this.isVisible ? 'block' : 'none';
        this.toggleButton.textContent = this.isVisible ? 'Ocultar Chat' : 'Mostrar Chat';
    }
    
    /**
     * Alterna a visibilidade das estatísticas
     */
    toggleStats() {
        this.statsVisible = !this.statsVisible;
        this.statsContainer.style.display = this.statsVisible ? 'block' : 'none';
    }
    
    /**
     * Alterna a visibilidade das estatísticas neurais
     */
    toggleNeuralStats() {
        this.neuralStatsVisible = !this.neuralStatsVisible;
        this.neuralStatsContainer.style.display = this.neuralStatsVisible ? 'block' : 'none';
    }
    
    /**
     * Adiciona uma mensagem ao chat
     * @param {Object} message - Objeto da mensagem
     */
    addMessage(message) {
        if (!message) return;
        
        this.messages.push(message);
        
        // Limita o número de mensagens
        if (this.messages.length > 50) {
            this.messages.shift();
        }
        
        // Atualiza estatísticas
        this.stats.totalMessages++;
        
        if (!this.stats.messagesByType[message.type]) {
            this.stats.messagesByType[message.type] = 0;
        }
        this.stats.messagesByType[message.type]++;
        
        // Classifica a interação pelo tipo
        if (message.type === 'cooperation' || message.type === 'assistance') {
            this.stats.positiveInteractions++;
        } else if (message.type === 'aggression' || message.type === 'warning') {
            this.stats.negativeInteractions++;
        } else {
            this.stats.neutralInteractions++;
        }
        
        // Atualiza a interface
        this.updateChat();
        this.updateStats();
    }
    
    /**
     * Atualiza o conteúdo do chat
     */
    updateChat() {
        if (!this.chatInterface) return;
        
        // Limpa o conteúdo atual
        this.chatInterface.innerHTML = '';
        
        // Se não há mensagens, mostra um texto padrão
        if (this.messages.length === 0) {
            this.chatInterface.innerHTML = '<p style="color: #999;">Nenhuma comunicação ainda...</p>';
            return;
        }
        
        // Mostra as últimas mensagens
        const visibleMessages = this.messages.slice(-this.maxDisplayMessages);
        
        visibleMessages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <div>${message.time} - ${message.senderId} → ${message.receiverId || 'Sistema'}</div>
                <div>${message.text}</div>
            `;
            this.chatInterface.appendChild(messageDiv);
        });
        
        // Rola para a mensagem mais recente
        this.chatInterface.scrollTop = this.chatInterface.scrollHeight;
    }
    
    /**
     * Atualiza as estatísticas de comunicação
     */
    updateStats() {
        if (!this.statsContainer) return;
        
        // Formata as estatísticas por tipo
        let typeStats = '';
        for (const type in this.stats.messagesByType) {
            typeStats += `${type}: ${this.stats.messagesByType[type]}<br>`;
        }
        
        // Calcula a porcentagem de interações positivas
        const totalInteractions = this.stats.positiveInteractions + 
                                  this.stats.negativeInteractions + 
                                  this.stats.neutralInteractions;
        
        const positivePercent = totalInteractions > 0 
            ? Math.round((this.stats.positiveInteractions / totalInteractions) * 100) 
            : 0;
        
        const negativePercent = totalInteractions > 0 
            ? Math.round((this.stats.negativeInteractions / totalInteractions) * 100) 
            : 0;
        
        // Define o HTML das estatísticas
        const statsHtml = `
            <div style="font-weight: bold; margin-bottom: 5px;">Estatísticas de Comunicação</div>
            <div>Total de mensagens: ${this.stats.totalMessages}</div>
            <div>Interações positivas: ${this.stats.positiveInteractions} (${positivePercent}%)</div>
            <div>Interações negativas: ${this.stats.negativeInteractions} (${negativePercent}%)</div>
            <div>Interações neutras: ${this.stats.neutralInteractions}</div>
            <div style="margin-top: 5px; font-weight: bold;">Por tipo:</div>
            <div>${typeStats}</div>
        `;
        
        this.statsContainer.innerHTML = statsHtml;
    }
    
    /**
     * Atualiza as estatísticas de comunicação neural
     * @param {Object} neuralStats - Estatísticas atualizadas do sistema neural
     */
    updateNeuralStats(neuralStats = null) {
        if (!this.neuralStatsContainer) return;
        
        // Atualiza as estatísticas neurais se fornecidas
        if (neuralStats) {
            this.neuralStats = neuralStats;
        }
        
        // Define o HTML das estatísticas neurais
        let statsHtml;
        
        if (this.neuralStats.enabled) {
            // Sistema neural ativo
            const modeText = this.neuralStats.forced ? 
                '<span style="color: #FFA500;">MODO FORÇADO</span>' : 
                '<span style="color: #2ECC71;">AUTO</span>';
                
            statsHtml = `
                <div style="font-weight: bold; margin-bottom: 5px;">Comunicação Neural</div>
                <div style="color: #5DADE2;">Status: <span style="color: #2ECC71;">ATIVO</span></div>
                <div>Modo: ${modeText}</div>
                <div>Bactérias usando: ${this.neuralStats.bacteriaCount}</div>
                <div>Tamanho do vocabulário: ${this.neuralStats.vocabSize}</div>
                <div>Recompensa média: ${this.neuralStats.rewardAvg}</div>
                <div style="margin-top: 10px;">
                    <div style="width: 100%; height: 10px; background-color: #444; border-radius: 5px;">
                        <div style="width: ${parseFloat(this.neuralStats.rewardAvg) * 100}%; height: 10px; background-color: #2ECC71; border-radius: 5px;"></div>
                    </div>
                </div>
            `;
        } else {
            // Sistema neural inativo
            statsHtml = `
                <div style="font-weight: bold; margin-bottom: 5px;">Comunicação Neural</div>
                <div style="color: #5DADE2;">Status: <span style="color: #E74C3C;">INATIVO</span></div>
                <div>O sistema de comunicação neural não está ativo.</div>
                <div>Verifique se o módulo foi carregado corretamente.</div>
            `;
        }
        
        this.neuralStatsContainer.innerHTML = statsHtml;
    }
    
    /**
     * Limpa o histórico de mensagens
     */
    clearChat() {
        this.messages = [];
        this.updateChat();
    }
}

// Exportar para o escopo global
window.CommunicationInterface = CommunicationInterface;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = CommunicationInterface;
} 