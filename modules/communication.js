/**
 * Sistema de comunicação entre bactérias
 * Permite que as bactérias troquem mensagens, formem relacionamentos e interajam socialmente
 */
class BacteriaCommunication {
    /**
     * Inicializa o sistema de comunicação
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.messages = [];               // Histórico de mensagens recentes
        this.maxMessages = 50;            // Número máximo de mensagens no histórico
        this.relationships = new Map();   // Mapa de relacionamentos entre bactérias
        this.communicationRange = 100;    // Distância máxima para comunicação direta
        this.chatInterface = null;        // Referência ao elemento HTML do chat
        this.randomMessageChance = 0.003; // Chance de enviar mensagem aleatória por frame (ajustado pela social)
        this.userCanChat = true;          // Se o usuário pode enviar mensagens
        
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
        
        // Cria interface de chat
        this.createChatInterface();
    }

    /**
     * Cria a interface de chat no lado esquerdo da tela
     */
    createChatInterface() {
        // Cria o container principal
        this.chatInterface = createDiv();
        this.chatInterface.id('bacteria-chat');
        this.chatInterface.position(0, 0);
        this.chatInterface.style('width', '250px');
        this.chatInterface.style('height', '100%');
        this.chatInterface.style('position', 'fixed');
        this.chatInterface.style('left', '0');
        this.chatInterface.style('top', '0');
        this.chatInterface.style('background-color', 'rgba(35, 35, 40, 0.9)');
        this.chatInterface.style('color', '#e0e0e0');
        this.chatInterface.style('padding', '10px');
        this.chatInterface.style('box-sizing', 'border-box');
        this.chatInterface.style('display', 'flex');
        this.chatInterface.style('flex-direction', 'column');
        this.chatInterface.style('z-index', '1000');
        this.chatInterface.style('border-right', '1px solid rgba(60,60,70,0.8)');
        this.chatInterface.style('box-shadow', '2px 0 10px rgba(0,0,0,0.2)');
        this.chatInterface.style('overflow', 'hidden');
        
        // Título do chat
        const title = createDiv('Comunicação das Bactérias');
        title.parent(this.chatInterface);
        title.style('font-size', '16px');
        title.style('font-weight', 'bold');
        title.style('text-align', 'center');
        title.style('margin-bottom', '10px');
        title.style('padding-bottom', '10px');
        title.style('border-bottom', '1px solid rgba(100,100,120,0.5)');
        
        // Container das mensagens com scroll
        this.messagesContainer = createDiv();
        this.messagesContainer.parent(this.chatInterface);
        this.messagesContainer.style('flex-grow', '1');
        this.messagesContainer.style('overflow-y', 'auto');
        this.messagesContainer.style('padding-right', '5px');
        this.messagesContainer.style('margin-bottom', '10px');
        this.messagesContainer.style('font-size', '12px');
        
        // Interface para o usuário enviar mensagens
        this.createUserInputInterface();
        
        // Estatísticas de comunicação
        this.statsContainer = createDiv();
        this.statsContainer.parent(this.chatInterface);
        this.statsContainer.style('padding', '10px');
        this.statsContainer.style('background-color', 'rgba(40, 40, 50, 0.7)');
        this.statsContainer.style('border-radius', '4px');
        this.statsContainer.style('font-size', '11px');
        this.statsContainer.style('margin-top', 'auto');
        this.statsContainer.html('Estatísticas de Comunicação<br>Total de mensagens: 0<br>Amizades formadas: 0<br>Conflitos: 0');
    }
    
    /**
     * Cria a interface para o usuário enviar mensagens
     */
    createUserInputInterface() {
        // Container para os controles de chat do usuário
        const userChatContainer = createDiv();
        userChatContainer.parent(this.chatInterface);
        userChatContainer.style('margin-bottom', '10px');
        userChatContainer.style('background-color', 'rgba(45, 45, 55, 0.7)');
        userChatContainer.style('border-radius', '4px');
        userChatContainer.style('padding', '10px');
        
        // Título da seção
        const userChatTitle = createDiv('Conversar com Bactérias');
        userChatTitle.parent(userChatContainer);
        userChatTitle.style('font-size', '14px');
        userChatTitle.style('font-weight', 'bold');
        userChatTitle.style('margin-bottom', '8px');
        userChatTitle.style('color', '#8cb4ff');
        
        // Campo de texto
        this.userMessageInput = createInput('');
        this.userMessageInput.parent(userChatContainer);
        this.userMessageInput.attribute('placeholder', 'Digite sua mensagem...');
        this.userMessageInput.style('width', '100%');
        this.userMessageInput.style('padding', '6px 8px');
        this.userMessageInput.style('margin-bottom', '8px');
        this.userMessageInput.style('border-radius', '4px');
        this.userMessageInput.style('border', '1px solid rgba(80, 80, 100, 0.4)');
        this.userMessageInput.style('background-color', 'rgba(55, 55, 65, 0.9)');
        this.userMessageInput.style('color', '#e0e0e0');
        this.userMessageInput.style('font-size', '12px');
        
        // Container para botões
        const buttonsContainer = createDiv();
        buttonsContainer.parent(userChatContainer);
        buttonsContainer.style('display', 'flex');
        buttonsContainer.style('gap', '8px');
        
        // Botão de enviar
        this.sendButton = createButton('Enviar');
        this.sendButton.parent(buttonsContainer);
        this.sendButton.style('flex', '1');
        this.sendButton.style('padding', '5px 10px');
        this.sendButton.style('background-color', '#4d94ff');
        this.sendButton.style('border', 'none');
        this.sendButton.style('border-radius', '4px');
        this.sendButton.style('color', 'white');
        this.sendButton.style('cursor', 'pointer');
        this.sendButton.style('font-size', '12px');
        this.sendButton.style('transition', 'background-color 0.3s');
        this.sendButton.mouseOver(() => this.sendButton.style('background-color', '#3a7fcf'));
        this.sendButton.mouseOut(() => this.sendButton.style('background-color', '#4d94ff'));
        
        // Botão para limpar o chat
        this.clearButton = createButton('Limpar Chat');
        this.clearButton.parent(buttonsContainer);
        this.clearButton.style('flex', '1');
        this.clearButton.style('padding', '5px 10px');
        this.clearButton.style('background-color', '#ff6b6b');
        this.clearButton.style('border', 'none');
        this.clearButton.style('border-radius', '4px');
        this.clearButton.style('color', 'white');
        this.clearButton.style('cursor', 'pointer');
        this.clearButton.style('font-size', '12px');
        this.clearButton.style('transition', 'background-color 0.3s');
        this.clearButton.mouseOver(() => this.clearButton.style('background-color', '#e55c5c'));
        this.clearButton.mouseOut(() => this.clearButton.style('background-color', '#ff6b6b'));
        
        // Event listeners
        this.sendButton.mousePressed(() => this.sendUserMessage());
        this.clearButton.mousePressed(() => this.clearChat());
        
        // Permite enviar com a tecla Enter
        this.userMessageInput.elt.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendUserMessage();
            }
        });
    }
    
    /**
     * Envia a mensagem do usuário para as bactérias
     */
    sendUserMessage() {
        const message = this.userMessageInput.value().trim();
        
        if (message && this.simulation.bacteria.length > 0) {
            // Seleciona uma bactéria aleatória para receber a mensagem
            const targetBacteria = random(this.simulation.bacteria);
            
            // Cria o objeto da mensagem
            const userMessage = {
                senderId: 'USER',
                receiverId: this.getBacteriaId(targetBacteria),
                isFemale: false,
                type: this.messageTypes.USER,
                content: message,
                time: this.getFormattedTime()
            };
            
            // Adiciona a mensagem ao histórico
            this.addMessage(userMessage);
            
            // Limpa o campo de texto
            this.userMessageInput.value('');
            
            // Programa uma resposta da bactéria
            this.scheduleResponse(targetBacteria);
        }
    }
    
    /**
     * Programa uma resposta da bactéria para a mensagem do usuário
     * @param {Bacteria} bacteria - Bactéria que responderá
     */
    scheduleResponse(bacteria) {
        // Atraso baseado na sociabilidade da bactéria (mais sociável = responde mais rápido)
        const sociability = bacteria.dna?.genes?.sociability || 1;
        const delay = map(sociability, 0.5, 1.5, 3000, 1000); // Entre 1 e 3 segundos
        
        setTimeout(() => {
            if (this.simulation.bacteria.includes(bacteria)) {
                // Apenas responde se a bactéria ainda estiver viva
                const response = this.generateBacteriaResponse(bacteria);
                
                const responseMessage = {
                    senderId: this.getBacteriaId(bacteria),
                    receiverId: 'USER',
                    isFemale: bacteria.isFemale,
                    type: this.messageTypes.RANDOM,
                    content: response,
                    time: this.getFormattedTime()
                };
                
                this.addMessage(responseMessage);
            }
        }, delay);
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
     * Limpa todas as mensagens do chat
     */
    clearChat() {
        // Solicita confirmação
        if (confirm('Tem certeza que deseja limpar todas as mensagens do chat?')) {
            this.messages = [];
            this.updateChatInterface();
            console.log('Chat de bactérias limpo');
        }
    }

    /**
     * Atualiza a interface do chat com as mensagens mais recentes
     */
    updateChatInterface() {
        // Limpa o container de mensagens
        this.messagesContainer.html('');
        
        // Adiciona cada mensagem ao container
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            
            // Cria o elemento da mensagem
            const msgElement = createDiv();
            msgElement.parent(this.messagesContainer);
            msgElement.style('margin-bottom', '8px');
            msgElement.style('padding', '6px 8px');
            msgElement.style('border-radius', '4px');
            msgElement.style('font-size', '12px');
            msgElement.style('line-height', '1.3');
            
            // Cores baseadas no tipo de mensagem
            const colors = {
                [this.messageTypes.GREETING]: 'rgba(70, 130, 180, 0.3)',
                [this.messageTypes.FOOD_INFO]: 'rgba(46, 139, 87, 0.3)',
                [this.messageTypes.DANGER_WARNING]: 'rgba(178, 34, 34, 0.3)',
                [this.messageTypes.HELP_REQUEST]: 'rgba(218, 165, 32, 0.3)',
                [this.messageTypes.FRIENDSHIP]: 'rgba(147, 112, 219, 0.3)',
                [this.messageTypes.AGGRESSIVE]: 'rgba(139, 0, 0, 0.3)',
                [this.messageTypes.MATING]: 'rgba(255, 105, 180, 0.3)',
                [this.messageTypes.RANDOM]: 'rgba(80, 80, 80, 0.3)',
                [this.messageTypes.USER]: 'rgba(0, 128, 255, 0.3)'
            };
            
            msgElement.style('background-color', colors[msg.type] || 'rgba(80, 80, 80, 0.3)');
            
            // Nome/ID formatado
            let senderName;
            let senderHTML;
            
            if (msg.senderId === 'USER') {
                senderName = 'Você';
                senderHTML = `<span style="color: #00aaff; font-weight: bold;">${senderName}</span>`;
            } else {
                senderName = `Bact-${msg.senderId.toString().padStart(3, '0')}`;
                senderHTML = msg.isFemale ? 
                    `<span style="color: #ff9ccf;">${senderName}</span>` : 
                    `<span style="color: #9ccfff;">${senderName}</span>`;
            }
            
            // Receptor formatado
            let receiverName;
            let receiverHTML;
            
            if (msg.receiverId === 'USER') {
                receiverName = 'Você';
                receiverHTML = `<span style="color: #00aaff; font-weight: bold;">${receiverName}</span>`;
            } else {
                receiverName = `Bact-${msg.receiverId.toString().padStart(3, '0')}`;
                receiverHTML = `<span style="color: #aaaaaa;">${receiverName}</span>`;
            }
            
            // Timestamp
            const timeHTML = `<span style="color: #777777; font-size: 10px;">${msg.time}</span>`;
            
            // Conteúdo completo
            msgElement.html(`${timeHTML} ${senderHTML} → ${receiverHTML}: ${msg.content}`);
        }
        
        // Atualiza as estatísticas
        const friendships = this.countRelationships('friend');
        const conflicts = this.countRelationships('enemy');
        
        this.statsContainer.html(
            `Estatísticas de Comunicação<br>` +
            `Total de mensagens: ${this.messages.length}<br>` +
            `Amizades formadas: ${friendships}<br>` +
            `Conflitos: ${conflicts}`
        );
    }

    /**
     * Conta o número de relacionamentos de determinado tipo
     * @param {string} type - Tipo de relacionamento ('friend', 'enemy', etc)
     * @returns {number} - Número de relacionamentos desse tipo
     */
    countRelationships(type) {
        let count = 0;
        for (const relations of this.relationships.values()) {
            for (const relation of relations) {
                if (relation.type === type) {
                    count++;
                }
            }
        }
        // Como cada relacionamento é contado duas vezes (uma para cada bactéria)
        return count / 2;
    }

    /**
     * Atualiza o sistema de comunicação
     */
    update() {
        // Verifica se há bactérias próximas para comunicação
        this.checkBacteriaCommunication();
        
        // Atualiza a interface de chat
        this.updateChatInterface();
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
                const communicationChance = this.randomMessageChance * (b1.dna.genes.sociability * 2);
                
                // Tenta iniciar comunicação aleatória
                if (random() < communicationChance) {
                    // Busca bactérias próximas usando o grid espacial
                    const nearbyEntities = this.simulation.spatialGrid.queryRadius(b1.pos, this.communicationRange);
                    const nearbyBacteria = nearbyEntities.filter(e => e instanceof Bacteria && e !== b1);
                    
                    if (nearbyBacteria.length > 0) {
                        // Seleciona uma bactéria aleatória próxima
                        const b2 = random(nearbyBacteria);
                        this.createCommunication(b1, b2);
                    }
                }
            }
        } else {
            // Fallback se o grid espacial não estiver disponível (método menos eficiente)
            for (let i = 0; i < bacteria.length; i++) {
                const b1 = bacteria[i];
                
                // Menor chance de comunicação para evitar sobrecarga no método não otimizado
                const communicationChance = this.randomMessageChance * 0.5 * b1.dna.genes.sociability;
                
                if (random() < communicationChance) {
                    for (let j = 0; j < bacteria.length; j++) {
                        if (i === j) continue;
                        
                        const b2 = bacteria[j];
                        const distance = dist(b1.pos.x, b1.pos.y, b2.pos.x, b2.pos.y);
                        
                        if (distance <= this.communicationRange) {
                            this.createCommunication(b1, b2);
                            break; // Apenas uma comunicação por vez
                        }
                    }
                }
            }
        }
    }

    /**
     * Cria uma comunicação entre duas bactérias
     * @param {Bacteria} sender - Bactéria que inicia a comunicação
     * @param {Bacteria} receiver - Bactéria que recebe a comunicação
     */
    createCommunication(sender, receiver) {
        // Determina o tipo de comunicação baseado no contexto
        const msgType = this.determineMessageType(sender, receiver);
        
        // Gera o conteúdo da mensagem
        const content = this.generateMessage(sender, receiver, msgType);
        
        // Cria o objeto da mensagem
        const message = {
            senderId: this.getBacteriaId(sender),
            receiverId: this.getBacteriaId(receiver),
            isFemale: sender.isFemale,
            type: msgType,
            content: content,
            time: this.getFormattedTime()
        };
        
        // Adiciona a mensagem ao histórico
        this.addMessage(message);
        
        // Atualiza relacionamentos
        this.updateRelationship(sender, receiver, msgType);
    }

    /**
     * Determina o tipo de mensagem baseado no contexto e estado das bactérias
     * @param {Bacteria} sender - Bactéria que envia a mensagem
     * @param {Bacteria} receiver - Bactéria que recebe a mensagem
     * @returns {string} - Tipo de mensagem
     */
    determineMessageType(sender, receiver) {
        // Verifica relacionamento atual
        const relationship = this.getRelationship(sender, receiver);
        
        // Verifica se há predadores próximos
        const predatorNearby = this.simulation.predators.some(p => 
            dist(sender.pos.x, sender.pos.y, p.pos.x, p.pos.y) < sender.perceptionRadius
        );
        
        // Verifica o estado atual das bactérias
        const senderState = sender.states.getCurrentState();
        const receiverState = receiver.states.getCurrentState();
        
        // Pode avisar sobre perigo
        if (predatorNearby && random() < 0.7) {
            return this.messageTypes.DANGER_WARNING;
        }
        
        // Se estiver com pouca energia, pode pedir comida
        if (sender.states.getEnergy() < 30 && random() < 0.5) {
            return this.messageTypes.HELP_REQUEST;
        }
        
        // Se estiver procurando comida, pode compartilhar informação
        if (senderState === 'seekingFood' && random() < 0.4) {
            return this.messageTypes.FOOD_INFO;
        }
        
        // Pode tentar reprodução se for de sexos opostos e tiver energia
        if (sender.isFemale !== receiver.isFemale && 
            sender.states.getEnergy() > 60 && 
            receiver.states.getEnergy() > 60 &&
            random() < 0.3) {
            return this.messageTypes.MATING;
        }
        
        // Se for agressivo, chance de mensagem agressiva
        if (sender.dna.genes.aggressiveness > 0.7 && random() < 0.4) {
            return this.messageTypes.AGGRESSIVE;
        }
        
        // Se for sociável, chance de amizade
        if (sender.dna.genes.sociability > 0.7 && random() < 0.3) {
            return this.messageTypes.FRIENDSHIP;
        }
        
        // Se for o primeiro contato, provavelmente é um cumprimento
        if (!relationship && random() < 0.5) {
            return this.messageTypes.GREETING;
        }
        
        // Caso contrário, mensagem aleatória
        return this.messageTypes.RANDOM;
    }

    /**
     * Gera uma mensagem baseada no tipo
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     * @param {string} type - Tipo de mensagem
     * @returns {string} - Conteúdo da mensagem
     */
    generateMessage(sender, receiver, type) {
        const receiverId = this.getBacteriaId(receiver);
        
        // Mensagens por tipo
        const messages = {
            [this.messageTypes.GREETING]: [
                `Olá! Prazer em conhecer você.`,
                `Oi, como vai? Sou nova por aqui.`,
                `Hey! Tudo bem com você?`,
                `Olá, parente! Como está o ambiente?`
            ],
            [this.messageTypes.FOOD_INFO]: [
                `Tem comida para o lado ${this.getRandomDirection()}.`,
                `Encontrei recursos perto daqui!`,
                `Venha comigo, achei uma fonte de energia.`,
                `Já comeu hoje? Tem bastante comida ali.`
            ],
            [this.messageTypes.DANGER_WARNING]: [
                `CUIDADO! Predador se aproximando!`,
                `PERIGO! Fuja para o lado ${this.getRandomDirection()}!`,
                `Alerta! Tem um predador por perto!`,
                `Estamos em perigo! Predador à vista!`
            ],
            [this.messageTypes.HELP_REQUEST]: [
                `Estou com pouca energia, pode me ajudar?`,
                `Preciso de comida, você sabe onde tem?`,
                `Socorro! Estou sem energia.`,
                `Pode me dizer onde encontrar recursos?`
            ],
            [this.messageTypes.FRIENDSHIP]: [
                `Gostei de você, vamos ser amigos!`,
                `Podemos formar uma aliança?`,
                `Você parece legal, vamos cooperar?`,
                `Seu DNA parece interessante, vamos nos aproximar!`
            ],
            [this.messageTypes.AGGRESSIVE]: [
                `Saia do meu caminho!`,
                `Este território é meu, saia daqui!`,
                `Você é fraco, não vai sobreviver muito.`,
                `Não se aproxime da minha comida!`
            ],
            [this.messageTypes.MATING]: [
                `Nossos genes combinam bem, que tal nos reproduzirmos?`,
                `Você parece ter bons genes. Vamos criar uma nova geração?`,
                `Que tal compartilharmos nosso DNA?`,
                `Estou pronto para reproduzir, e você?`
            ],
            [this.messageTypes.RANDOM]: [
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
        return random(messages[type] || messages[this.messageTypes.RANDOM]);
    }

    /**
     * Retorna uma direção aleatória para mensagens
     * @returns {string} - Direção (norte, sul, leste, oeste)
     */
    getRandomDirection() {
        const directions = ['norte', 'sul', 'leste', 'oeste'];
        return random(directions);
    }

    /**
     * Adiciona uma mensagem ao histórico
     * @param {Object} message - Mensagem a ser adicionada
     */
    addMessage(message) {
        this.messages.push(message);
        
        // Limita o número de mensagens
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
    }

    /**
     * Atualiza o relacionamento entre duas bactérias com base na comunicação
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @param {string} messageType - Tipo de mensagem trocada
     */
    updateRelationship(b1, b2, messageType) {
        // Obtém os IDs das bactérias
        const id1 = this.getBacteriaId(b1);
        const id2 = this.getBacteriaId(b2);
        
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
            case this.messageTypes.GREETING:
                change = 1;
                break;
            case this.messageTypes.FOOD_INFO:
                change = 2;
                break;
            case this.messageTypes.DANGER_WARNING:
                change = 3;
                break;
            case this.messageTypes.HELP_REQUEST:
                change = random() < 0.5 ? 1 : -1; // Pode ser visto como fraqueza
                break;
            case this.messageTypes.FRIENDSHIP:
                change = 3;
                break;
            case this.messageTypes.AGGRESSIVE:
                change = -3;
                break;
            case this.messageTypes.MATING:
                change = 2;
                break;
            case this.messageTypes.RANDOM:
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
        const id1 = this.getBacteriaId(b1);
        const id2 = this.getBacteriaId(b2);
        
        if (!this.relationships.has(id1)) {
            return null;
        }
        
        return this.relationships.get(id1).find(r => r.partnerId === id2);
    }

    /**
     * Obtém um ID único para uma bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {number} - ID único
     */
    getBacteriaId(bacteria) {
        // Verifica se a bactéria já tem um ID
        if (!bacteria.communicationId) {
            // Atribui um ID baseado na posição no array
            const index = this.simulation.bacteria.indexOf(bacteria);
            bacteria.communicationId = index + 1;
        }
        
        return bacteria.communicationId;
    }

    /**
     * Retorna a hora formatada para o timestamp das mensagens
     * @returns {string} - Hora formatada (HH:MM:SS)
     */
    getFormattedTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}

// Exporta a classe para o escopo global
window.BacteriaCommunication = BacteriaCommunication; 