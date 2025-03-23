/**
 * Gerador de mensagens para o sistema de comunicação
 * Responsável por gerar conteúdo para as mensagens entre bactérias
 */
class MessageGenerator {
    /**
     * Inicializa o gerador de mensagens
     * @param {CommunicationSystem} communicationSystem - Sistema de comunicação principal
     */
    constructor(communicationSystem) {
        this.communicationSystem = communicationSystem;
    }
    
    /**
     * Determina o tipo de mensagem baseado no contexto e estado das bactérias
     * @param {Bacteria} sender - Bactéria que envia a mensagem
     * @param {Bacteria} receiver - Bactéria que recebe a mensagem
     * @returns {string} - Tipo de mensagem
     */
    determineMessageType(sender, receiver) {
        try {
            // Verifica se sender e receiver são válidos
            if (!sender || !receiver) {
                console.warn("MessageGenerator: sender ou receiver inválido");
                return this.getDefaultMessageType();
            }
            
            // Verifica se o communicationSystem existe
            if (!this.communicationSystem) {
                console.error("MessageGenerator: communicationSystem não inicializado");
                return this.getDefaultMessageType();
            }
            
            // Verifica se o messageManager existe
            if (!this.communicationSystem.messageManager) {
                console.error("MessageGenerator: messageManager não encontrado");
                return this.getDefaultMessageType();
            }
            
            // Verifica se messageTypes existe
            const messageManager = this.communicationSystem.messageManager;
            if (!messageManager.messageTypes) {
                console.error("MessageGenerator: messageTypes não encontrado no messageManager");
                return this.getDefaultMessageType();
            }
            
            const messageTypes = messageManager.messageTypes;
            
            // Verifica se relationshipManager existe
            if (!this.communicationSystem.relationshipManager) {
                console.error("MessageGenerator: relationshipManager não encontrado");
                return messageTypes.GREETING;
            }
            
            const relationshipManager = this.communicationSystem.relationshipManager;
            
            // Verifica se simulation existe
            if (!this.communicationSystem.simulation) {
                console.error("MessageGenerator: simulation não encontrada");
                return messageTypes.GREETING;
            }
            
            const simulation = this.communicationSystem.simulation;
            
            // Verifica se há predadores
            if (!simulation.predators || !Array.isArray(simulation.predators)) {
                console.warn("MessageGenerator: simulation.predators não é um array");
                simulation.predators = [];
            }
            
            // Verifica relacionamento atual com tratamento de erro
            let relationship = null;
            try {
                relationship = relationshipManager.getRelationship(sender, receiver);
            } catch (e) {
                console.error("MessageGenerator: erro ao obter relacionamento:", e);
            }
            
            // Verifica se há predadores próximos com tratamento de erro
            let predatorNearby = false;
            try {
                predatorNearby = simulation.predators.some(p => {
                    if (!p || !p.pos) return false;
                    return dist(sender.pos.x, sender.pos.y, p.pos.x, p.pos.y) < (sender.perceptionRadius || 150);
                });
            } catch (e) {
                console.error("MessageGenerator: erro ao verificar predadores próximos:", e);
            }
            
            // Verifica o estado atual das bactérias com segurança
            let senderState = null;
            let receiverState = null;
            
            // Verifica sender.states de forma segura
            try {
                if (sender.states && typeof sender.states.getCurrentState === 'function') {
                    senderState = sender.states.getCurrentState();
                } else if (sender.stateManager && typeof sender.stateManager.getCurrentState === 'function') {
                    senderState = sender.stateManager.getCurrentState();
                }
            } catch (e) {
                console.error("MessageGenerator: erro ao obter estado do remetente:", e);
            }
            
            // Verifica receiver.states de forma segura
            try {
                if (receiver.states && typeof receiver.states.getCurrentState === 'function') {
                    receiverState = receiver.states.getCurrentState();
                } else if (receiver.stateManager && typeof receiver.stateManager.getCurrentState === 'function') {
                    receiverState = receiver.stateManager.getCurrentState();
                }
            } catch (e) {
                console.error("MessageGenerator: erro ao obter estado do destinatário:", e);
            }
            
            // Log para depuração
            console.debug("MessageGenerator: dados para determinar mensagem", {
                senderState,
                receiverState,
                relationship: relationship ? relationship.type : "nenhum",
                predatorNearby
            });
            
            // Se não foi possível determinar os estados, retorna uma mensagem padrão
            if (senderState === null || receiverState === null) {
                console.warn("MessageGenerator: estados não determinados, usando tipo padrão");
                return messageTypes.GREETING;
            }
            
            // Agora determina o tipo de mensagem baseado no contexto
            
            // Pode avisar sobre perigo
            if (predatorNearby) {
                return messageTypes.DANGER_WARNING;
            }
            
            // Verifique se há relacionamento existente e use-o para determinar o tipo
            if (relationship) {
                if (relationship.type === 'friendship') {
                    if (sender.isFemale !== receiver.isFemale) {
                        return messageTypes.MATING;
                    }
                    return messageTypes.FRIENDSHIP;
                }
                
                if (relationship.type === 'conflict') {
                    return messageTypes.AGGRESSIVE;
                }
            }
            
            // Verificação de estado
            if (senderState === 'hungry' || receiverState === 'hungry') {
                return messageTypes.FOOD_INFO;
            }
            
            if (senderState === 'fleeing' || receiverState === 'fleeing') {
                return messageTypes.HELP_REQUEST;
            }
            
            // Se nada específico foi encontrado, escolha aleatória entre saudação e aleatório
            return random() > 0.5 ? messageTypes.GREETING : messageTypes.RANDOM;
        } catch (e) {
            console.error("MessageGenerator: erro crítico ao determinar tipo de mensagem:", e);
            return this.getDefaultMessageType();
        }
    }
    
    /**
     * Obtém um tipo de mensagem padrão para fallback
     * @returns {string} - Tipo de mensagem padrão
     */
    getDefaultMessageType() {
        try {
            if (this.communicationSystem && 
                this.communicationSystem.messageManager && 
                this.communicationSystem.messageManager.messageTypes) {
                return this.communicationSystem.messageManager.messageTypes.GREETING;
            }
            return 'greeting'; // Valor mais básico possível
        } catch (e) {
            console.error("MessageGenerator: erro ao obter tipo de mensagem padrão:", e);
            return 'greeting';
        }
    }
    
    /**
     * Gera o conteúdo de uma mensagem com base no tipo
     * @param {Bacteria} sender - Bactéria que envia a mensagem
     * @param {Bacteria} receiver - Bactéria que recebe a mensagem
     * @param {string} messageType - Tipo de mensagem
     * @returns {string} - Conteúdo da mensagem
     */
    generateMessage(sender, receiver, messageType) {
        try {
            // Verifica parâmetros
            if (!sender || !receiver) {
                console.warn("MessageGenerator: sender ou receiver inválido para gerar mensagem");
                return "Olá!";
            }
            
            // Verifica se messageType é válido
            if (!messageType) {
                console.warn("MessageGenerator: tipo de mensagem inválido");
                return "Olá!";
            }
            
            // Verifica se messageTypes está disponível
            const messageTypes = this.communicationSystem?.messageManager?.messageTypes;
            if (!messageTypes) {
                console.warn("MessageGenerator: messageTypes não disponível");
                return "Olá!";
            }
            
            // Obtém nomes ou IDs para referência
            const senderId = this.getBacteriaName(sender);
            const receiverId = this.getBacteriaName(receiver);
            
            // Gera mensagem baseada no tipo
            switch (messageType) {
                case messageTypes.GREETING:
                    return this.generateGreeting(sender);
                    
                case messageTypes.FOOD_INFO:
                    return this.generateFoodInfo(sender);
                    
                case messageTypes.DANGER_WARNING:
                    return this.generateDangerWarning(sender);
                    
                case messageTypes.HELP_REQUEST:
                    return this.generateHelpRequest(sender);
                    
                case messageTypes.FRIENDSHIP:
                    return this.generateFriendshipMessage(sender);
                    
                case messageTypes.AGGRESSIVE:
                    return this.generateAggressiveMessage(sender);
                    
                case messageTypes.MATING:
                    return this.generateMatingMessage(sender, receiver);
                    
                case messageTypes.RANDOM:
                    return this.generateRandomMessage(sender);
                    
                default:
                    return this.generateRandomMessage(sender);
            }
        } catch (error) {
            console.error("MessageGenerator: erro ao gerar mensagem:", error);
            return "Olá! [Mensagem de Fallback]";
        }
    }
    
    /**
     * Obtém o nome ou ID de uma bactéria para uso nas mensagens
     * @param {Bacteria} bacteria - Bactéria
     * @returns {string} - Nome ou ID da bactéria
     */
    getBacteriaName(bacteria) {
        try {
            if (!bacteria) return "???";
            
            // Tenta usar o nome ou ID para identificação
            if (bacteria.name) return bacteria.name;
            if (bacteria.id) return `Bactéria ${String(bacteria.id).substring(0, 4)}`;
            return "Bactéria";
        } catch (error) {
            return "Bactéria";
        }
    }
    
    /**
     * Gera uma mensagem de saudação
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateGreeting(sender) {
        const greetings = [
            "Olá!",
            "Oi, tudo bem?",
            "E aí, como vai?",
            "Prazer em conhecê-lo!",
            "Oi, sou a bactéria " + this.getBacteriaName(sender)
        ];
        return random(greetings);
    }
    
    /**
     * Gera uma mensagem sobre comida
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateFoodInfo(sender) {
        const messages = [
            "Encontrei comida nesta área!",
            "Tem recursos alimentares por aqui",
            "Precisando de comida? Esta área tem nutrientes",
            "Estou compartilhando informação: há comida por aqui!"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem de aviso sobre perigo
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateDangerWarning(sender) {
        const messages = [
            "CUIDADO! Predador próximo!",
            "Perigo! Detecto ameaça nas proximidades!",
            "Alerta: predador detectado!",
            "Fuja! Há um predador nesta área!"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem de pedido de ajuda
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateHelpRequest(sender) {
        const messages = [
            "Preciso de ajuda! Estou com pouca energia",
            "Socorro! Estou em perigo!",
            "Pode me ajudar? Estou com dificuldades",
            "Preciso de assistência urgente!"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem de amizade
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateFriendshipMessage(sender) {
        const messages = [
            "Gosto de interagir com você!",
            "Podemos cooperar juntos",
            "Somos boas bactérias parceiras!",
            "Vamos formar uma aliança?"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem agressiva
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateAggressiveMessage(sender) {
        const messages = [
            "Fique longe do meu território!",
            "Esta área é minha!",
            "Não tente competir comigo!",
            "Eu sou mais forte que você!"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem relacionada à reprodução
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     * @returns {string} - Mensagem
     */
    generateMatingMessage(sender, receiver) {
        const messages = [
            "Nossos genes seriam compatíveis",
            "Poderíamos criar descendentes fortes juntos",
            "Que tal nos reproduzirmos?",
            "Estou pronto para reprodução, e você?"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma mensagem aleatória
     * @param {Bacteria} sender - Bactéria que envia
     * @returns {string} - Mensagem
     */
    generateRandomMessage(sender) {
        const messages = [
            "Como está o ambiente hoje?",
            "Observo muitas mudanças por aqui",
            "Este ecossistema é interessante",
            "O que você acha deste ambiente?",
            "Já viveu muito tempo por aqui?",
            "Quantos ciclos você já completou?"
        ];
        return random(messages);
    }
    
    /**
     * Gera uma resposta da bactéria para o usuário
     * @param {Bacteria} bacteria - Bactéria que responde
     * @returns {string} - Resposta gerada
     */
    generateBacteriaResponse(bacteria) {
        // Personalidade baseada no DNA
        const sociability = bacteria.dna?.genes?.sociability || 1;
        const aggressiveness = bacteria.dna?.genes?.aggressiveness || 1;
        const curiosity = bacteria.dna?.genes?.curiosity || 1;
        
        // Decide o tipo de resposta baseado na personalidade
        let responseType;
        
        if (aggressiveness > 1.2) {
            responseType = 'aggressive';
        } else if (sociability > 1.2) {
            responseType = 'friendly';
        } else if (curiosity > 1.2) {
            responseType = 'curious';
        } else {
            responseType = 'neutral';
        }
        
        // Respostas possíveis baseadas na personalidade
        const responses = {
            aggressive: [
                "Não me incomode, humano!",
                "O que você quer? Estou ocupada sobrevivendo aqui.",
                "Preciso de espaço, não de conversas.",
                "Se não tem comida para oferecer, me deixe em paz."
            ],
            friendly: [
                "Olá, humano! É bom conversar com você!",
                "Estou feliz que se interessou por mim!",
                "Que dia lindo para uma conversa, não é?",
                "Adoro conhecer novas formas de vida!"
            ],
            curious: [
                "Como é ser um humano? Deve ser fascinante!",
                "Você consegue ver todo o ambiente? Que incrível!",
                "O que mais existe além desta simulação?",
                "Por que você criou este mundo para nós?"
            ],
            neutral: [
                "Olá, estou tentando sobreviver aqui.",
                "Preciso continuar procurando comida.",
                "Este ambiente é interessante, não acha?",
                "Existem muitos desafios para uma bactéria."
            ]
        };
        
        // Saúde e energia afetam a resposta
        let healthStatus = "";
        if (bacteria.health < 30) {
            healthStatus = " Estou com pouca saúde, preciso me recuperar.";
        } else if (bacteria.energy < 30) {
            healthStatus = " Estou com fome, preciso encontrar comida.";
        }
        
        // Seleciona uma resposta aleatória do tipo determinado
        return random(responses[responseType]) + healthStatus;
    }
    
    /**
     * Retorna uma direção aleatória para mensagens
     * @returns {string} - Direção (norte, sul, leste, oeste)
     */
    getRandomDirection() {
        const directions = ['norte', 'sul', 'leste', 'oeste'];
        return random(directions);
    }
}

// Exportar para o escopo global
window.MessageGenerator = MessageGenerator;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = MessageGenerator;
} 