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
        if (!sender || !receiver) {
            console.warn("MessageGenerator: sender ou receiver inválido");
            return null;
        }
        
        const messageTypes = this.communicationSystem.messageManager.messageTypes;
        const relationshipManager = this.communicationSystem.relationshipManager;
        const simulation = this.communicationSystem.simulation;
        
        // Verifica relacionamento atual
        const relationship = relationshipManager.getRelationship(sender, receiver);
        
        // Verifica se há predadores próximos
        const predatorNearby = simulation.predators.some(p => 
            dist(sender.pos.x, sender.pos.y, p.pos.x, p.pos.y) < sender.perceptionRadius
        );
        
        // Verifica o estado atual das bactérias com segurança
        let senderState = null;
        let receiverState = null;
        
        // Verifica sender.states de forma segura
        if (sender.states && typeof sender.states.getCurrentState === 'function') {
            senderState = sender.states.getCurrentState();
        } else if (sender.stateManager && typeof sender.stateManager.getCurrentState === 'function') {
            senderState = sender.stateManager.getCurrentState();
        }
        
        // Verifica receiver.states de forma segura
        if (receiver.states && typeof receiver.states.getCurrentState === 'function') {
            receiverState = receiver.states.getCurrentState();
        } else if (receiver.stateManager && typeof receiver.stateManager.getCurrentState === 'function') {
            receiverState = receiver.stateManager.getCurrentState();
        }
        
        // Se não foi possível determinar os estados, retorna uma mensagem padrão
        if (senderState === null || receiverState === null) {
            return messageTypes.GREETING;
        }
        
        // Pode avisar sobre perigo
        if (predatorNearby && random() < 0.7) {
            return messageTypes.DANGER_WARNING;
        }
        
        // Obtém energia de forma segura
        const getSenderEnergy = () => {
            if (sender.states && typeof sender.states.getEnergy === 'function') {
                return sender.states.getEnergy();
            } else if (sender.stateManager && typeof sender.stateManager.getEnergy === 'function') {
                return sender.stateManager.getEnergy();
            } else if (typeof sender.energy === 'number') {
                return sender.energy;
            }
            return 50; // valor padrão se não conseguir obter
        };
        
        const getReceiverEnergy = () => {
            if (receiver.states && typeof receiver.states.getEnergy === 'function') {
                return receiver.states.getEnergy();
            } else if (receiver.stateManager && typeof receiver.stateManager.getEnergy === 'function') {
                return receiver.stateManager.getEnergy();
            } else if (typeof receiver.energy === 'number') {
                return receiver.energy;
            }
            return 50; // valor padrão se não conseguir obter
        };
        
        const senderEnergy = getSenderEnergy();
        const receiverEnergy = getReceiverEnergy();
        
        // Se estiver com pouca energia, pode pedir comida
        if (senderEnergy < 30 && random() < 0.5) {
            return messageTypes.HELP_REQUEST;
        }
        
        // Se estiver procurando comida, pode compartilhar informação
        if (senderState === 'seekingFood' && random() < 0.4) {
            return messageTypes.FOOD_INFO;
        }
        
        // Pode tentar reprodução se for de sexos opostos e tiver energia
        if (sender.isFemale !== receiver.isFemale && 
            senderEnergy > 60 && 
            receiverEnergy > 60 &&
            random() < 0.3) {
            return messageTypes.MATING;
        }
        
        // Verifica genes de forma segura
        const getSenderGene = (geneName, defaultValue = 0.5) => {
            if (sender.dna && sender.dna.genes && typeof sender.dna.genes[geneName] === 'number') {
                return sender.dna.genes[geneName];
            }
            return defaultValue;
        };
        
        // Se for agressivo, chance de mensagem agressiva
        if (getSenderGene('aggressiveness') > 0.7 && random() < 0.4) {
            return messageTypes.AGGRESSIVE;
        }
        
        // Se for sociável, chance de amizade
        if (getSenderGene('sociability') > 0.7 && random() < 0.3) {
            return messageTypes.FRIENDSHIP;
        }
        
        // Se for o primeiro contato, provavelmente é um cumprimento
        if (!relationship || relationship.interactions.length === 0) {
            return messageTypes.GREETING;
        }
        
        // Caso padrão é um comentário aleatório
        return messageTypes.RANDOM_COMMENT;
    }
    
    /**
     * Gera uma mensagem baseada no tipo
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     * @param {string} type - Tipo de mensagem
     * @returns {string} - Conteúdo da mensagem
     */
    generateMessage(sender, receiver, type) {
        const messageTypes = this.communicationSystem.messageManager.messageTypes;
        
        // Mensagens por tipo
        const messages = {
            [messageTypes.GREETING]: [
                `Olá! Prazer em conhecer você.`,
                `Oi, como vai? Sou nova por aqui.`,
                `Hey! Tudo bem com você?`,
                `Olá, parente! Como está o ambiente?`
            ],
            [messageTypes.FOOD_INFO]: [
                `Tem comida para o lado ${this.getRandomDirection()}.`,
                `Encontrei recursos perto daqui!`,
                `Venha comigo, achei uma fonte de energia.`,
                `Já comeu hoje? Tem bastante comida ali.`
            ],
            [messageTypes.DANGER_WARNING]: [
                `CUIDADO! Predador se aproximando!`,
                `PERIGO! Fuja para o lado ${this.getRandomDirection()}!`,
                `Alerta! Tem um predador por perto!`,
                `Estamos em perigo! Predador à vista!`
            ],
            [messageTypes.HELP_REQUEST]: [
                `Estou com pouca energia, pode me ajudar?`,
                `Preciso de comida, você sabe onde tem?`,
                `Socorro! Estou sem energia.`,
                `Pode me dizer onde encontrar recursos?`
            ],
            [messageTypes.FRIENDSHIP]: [
                `Gostei de você, vamos ser amigos!`,
                `Podemos formar uma aliança?`,
                `Você parece legal, vamos cooperar?`,
                `Seu DNA parece interessante, vamos nos aproximar!`
            ],
            [messageTypes.AGGRESSIVE]: [
                `Saia do meu caminho!`,
                `Este território é meu, saia daqui!`,
                `Você é fraco, não vai sobreviver muito.`,
                `Não se aproxime da minha comida!`
            ],
            [messageTypes.MATING]: [
                `Nossos genes combinam bem, que tal nos reproduzirmos?`,
                `Você parece ter bons genes. Vamos criar uma nova geração?`,
                `Que tal compartilharmos nosso DNA?`,
                `Estou pronto para reproduzir, e você?`
            ],
            [messageTypes.RANDOM]: [
                `Percebeu como o ambiente mudou hoje?`,
                `Você é de qual geração?`,
                `Como está sua energia?`,
                `Esse ambiente está ficando interessante!`,
                `Já viu quantos predadores têm por aí?`,
                `Acabei de me dividir, me sinto renovado!`,
                `Quais seus genes mais fortes?`,
                `Você está buscando mais comida?`
            ]
        };
        
        // Seleciona uma mensagem aleatória do tipo especificado
        return random(messages[type] || messages[messageTypes.RANDOM]);
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