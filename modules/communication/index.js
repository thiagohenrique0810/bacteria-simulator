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
const NeuralCommunicationModule = window.NeuralCommunication || (typeof require !== 'undefined' ? require('./NeuralCommunication') : null);

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
            
            // Verifica se o componente de comunicação neural está disponível
            if (window.NeuralCommunication) {
                console.log("Inicializando sistema de comunicação neural");
                this.neuralSystem = new window.NeuralCommunication(this.system);
                
                // Flag para controlar se está usando comunicação neural
                this.useNeuralCommunication = true;
                
                // Flag para forçar comunicação neural para todas as bactérias
                this.forceNeuralCommunication = false;
            } else {
                console.warn("Módulo de comunicação neural não encontrado. Usando apenas comunicação simbólica.");
                this.useNeuralCommunication = false;
                this.forceNeuralCommunication = false;
            }
            
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
            
            // Atualiza o sistema neural, se disponível
            if (this.useNeuralCommunication && this.neuralSystem) {
                this.neuralSystem.update();
            }
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
     * Verifica se uma bactéria pode usar comunicação neural
     * @param {Object} bacteria - A bactéria para verificar
     * @returns {Boolean} - True se a bactéria pode usar comunicação neural
     */
    canUseNeuralCommunication(bacteria) {
        try {
            // Se a comunicação neural estiver forçada, todas as bactérias podem usar
            if (this.forceNeuralCommunication && this.neuralSystem && this.neuralSystem.enabled) {
                return true;
            }
            
            // Verifica se a bactéria existe e tem DNA
            if (!bacteria || !bacteria.dna) {
                return false;
            }
            
            // Verifica se o sistema neural existe e está habilitado
            if (!this.neuralSystem || !this.neuralSystem.enabled) {
                return false;
            }
            
            // Verifica se o DNA tem o método hasGene
            if (typeof bacteria.dna.hasGene !== 'function') {
                console.warn("DNA da bactéria não possui método hasGene:", bacteria.id);
                
                // Tenta verificar se existe o gene como propriedade ou em um array de genes
                if (bacteria.dna.genes && bacteria.dna.genes.neural_communication) {
                    return true;
                }
                
                // Outra tentativa: verificar se está nas especializações
                if (bacteria.dna.genes && Array.isArray(bacteria.dna.genes.specializations)) {
                    return bacteria.dna.genes.specializations.includes('neural_communication');
                }
                
                return false;
            }
            
            // Verifica se a bactéria tem o gene para comunicação neural
            return bacteria.dna.hasGene('neural_communication');
        } catch (error) {
            console.warn(`Erro ao verificar capacidade de comunicação neural para bactéria:`, error);
            return false;
        }
    }
    
    /**
     * Cria comunicação entre duas bactérias
     * @param {Object} sender - Bactéria emissora
     * @param {Object} receiver - Bactéria receptora
     * @param {Object} context - Contexto da comunicação
     * @returns {Object} - Mensagem gerada
     */
    createCommunication(sender, receiver, context = {}) {
        // Verifica se as bactérias são válidas para comunicação
        if (!sender || !receiver || !sender.id || !receiver.id) {
            return null;
        }
        
        try {
            // Verifica se deve usar comunicação neural ou simbólica
            const useNeural = this.canUseNeuralCommunication(sender);
            
            // Se comunicação neural deve ser usada
            if (useNeural && this.neuralSystem) {
                const messageText = this.neuralSystem.processCommunication(sender, receiver);
                
                // Adiciona a mensagem ao histórico, se necessário
                if (messageText) {
                    const message = {
                        senderId: this.getBacteriaId(sender),
                        receiverId: this.getBacteriaId(receiver),
                        text: messageText,
                        time: this.getFormattedTime(),
                        type: 'neural'
                    };
                    
                    this.addMessage(message);
                    return messageText;
                }
            } else {
                // Utiliza o sistema de comunicação simbólico tradicional
                if (this.system && this.system.messageManager) {
                    return this.system.messageManager.createBacteriaMessage(sender, receiver);
                }
            }
        } catch (error) {
            console.error("Erro ao criar comunicação:", error);
        }
        
        return null;
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
    
    /**
     * Verifica a eficiência da comunicação neural
     * @returns {Object} - Estatísticas de comunicação
     */
    getNeuroStats() {
        const stats = {
            enabled: this.useNeuralCommunication && this.neuralSystem && this.neuralSystem.enabled,
            bacteriaCount: 0,
            vocabSize: 0,
            rewardAvg: 0,
            forced: this.forceNeuralCommunication || false
        };
        
        if (stats.enabled) {
            try {
                // Conta bactérias que usaram o sistema neural
                stats.bacteriaCount = Object.keys(this.neuralSystem.rewardMemory).length;
                
                // Calcula recompensa média
                let totalReward = 0;
                let totalPoints = 0;
                
                for (const bacteriaId in this.neuralSystem.rewardMemory) {
                    const rewards = this.neuralSystem.rewardMemory[bacteriaId];
                    if (rewards && rewards.length > 0) {
                        rewards.forEach(r => {
                            totalReward += r.reward;
                            totalPoints++;
                        });
                    }
                }
                
                stats.rewardAvg = totalPoints > 0 ? totalReward / totalPoints : 0;
                
                stats.vocabSize = this.neuralSystem.vocabSize;
            } catch (error) {
                console.error("Erro ao obter estatísticas do sistema neural:", error);
            }
        }
        
        return stats;
    }

    /**
     * Alterna entre modos de comunicação neural (AUTO, ON, OFF)
     * @param {string} mode - Modo desejado: 'AUTO', 'ON' (forçado) ou 'OFF'
     * @returns {string} - O modo atual após a alteração
     */
    toggleNeuralCommunication(mode) {
        // Verifica se o módulo de comunicação neural está disponível
        if (!this.neuralSystem) {
            console.warn("Módulo de comunicação neural não disponível");
            return "OFF";
        }
        
        switch (mode) {
            case 'AUTO':
                // Modo automático - cada bactéria decide com base em sua capacidade genética
                this.neuralSystem.enabled = true;
                this.forceNeuralCommunication = false;
                console.log("Modo de comunicação neural: AUTO");
                break;
                
            case 'ON':
                // Modo forçado - todas as bactérias usam comunicação neural
                this.neuralSystem.enabled = true;
                this.forceNeuralCommunication = true;
                console.log("Modo de comunicação neural: FORÇADO");
                break;
                
            case 'OFF':
                // Desativa completamente a comunicação neural
                this.neuralSystem.enabled = false;
                this.forceNeuralCommunication = false;
                console.log("Modo de comunicação neural: DESATIVADO");
                break;
                
            default:
                // Comportamento padrão é AUTO
                this.neuralSystem.enabled = true;
                this.forceNeuralCommunication = false;
                console.log("Modo de comunicação neural: AUTO (padrão)");
                break;
        }
        
        // Retorna o modo atual
        if (!this.neuralSystem.enabled) return "OFF";
        return this.forceNeuralCommunication ? "ON" : "AUTO";
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
        CommunicationUtils: window.CommunicationUtils,
        NeuralCommunication: window.NeuralCommunication
    };
} 