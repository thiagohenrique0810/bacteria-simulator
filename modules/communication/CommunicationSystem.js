/**
 * Sistema principal de comunicação entre bactérias
 */
class CommunicationSystem {
    /**
     * Inicializa o sistema de comunicação
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        this.simulation = simulation;
        
        // Inicializa componentes de utilidades primeiro 
        this.utils = new CommunicationUtils();
        
        // Inicializa gerenciador de mensagens com referência para o sistema
        this.messageManager = new MessageManager(this);
        
        // Inicializa outros componentes na ordem correta
        this.interfaceManager = new CommunicationInterface(this.messageManager);
        this.messageGenerator = new MessageGenerator(this);
        this.relationshipManager = new RelationshipManager(this);
        
        // Estatísticas do sistema de comunicação
        this.stats = {
            communicationCount: 0,
            bacteriaPairs: new Set(),
            positiveInteractions: 0,
            negativeInteractions: 0
        };
        
        // Parâmetros do sistema
        this.communicationRange = 100;    // Distância máxima de comunicação
        this.randomMessageChance = 0.005; // Chance de mensagem aleatória (0.5%)
        
        // Flag para indicar se está usando comunicação neural
        this.useNeuralCommunication = window.NeuralCommunication !== undefined;
        
        console.log("Sistema de comunicação inicializado");
        
        // Verifica se todos os componentes foram inicializados corretamente
        this.validateComponents();
        
        // Adiciona as relações de comunicação nas estatísticas
        if (simulation && simulation.stats) {
            simulation.stats.communications = {
                totalMessages: 0,
                positiveInteractions: 0,
                negativeInteractions: 0,
                bacteriaPairs: 0
            };
        }
    }
    
    /**
     * Atualiza o sistema de comunicação a cada frame
     */
    update() {
        // Verifica se a simulação é válida
        if (!this.simulation || !this.simulation.entityManager) return;
        
        // Obtém a lista de bactérias vivas
        const activeBacteria = this.simulation.entityManager.bacteria
            .filter(b => b && b.health > 0);
        
        // Para cada bactéria, verifica possíveis comunicações
        activeBacteria.forEach(bacteria => {
            this.checkBacteriaCommunication(bacteria, activeBacteria);
        });
        
        // Atualiza a interface de comunicação com as estatísticas neurais, se disponível
        this.updateNeuralStats();
    }
    
    /**
     * Atualiza as estatísticas de comunicação neural na interface
     */
    updateNeuralStats() {
        if (!this.interfaceManager || !this.useNeuralCommunication) return;
        
        try {
            // Obtém as estatísticas do sistema neural através da classe principal
            if (window.bacteria_communication && typeof window.bacteria_communication.getNeuroStats === 'function') {
                const stats = window.bacteria_communication.getNeuroStats();
                this.interfaceManager.updateNeuralStats(stats);
            }
        } catch (error) {
            console.warn("Erro ao atualizar estatísticas neurais:", error);
        }
    }
    
    /**
     * Verifica se uma bactéria pode se comunicar com outras
     * @param {Bacteria} bacteria - Bactéria a ser verificada
     * @param {Array} otherBacteria - Lista de outras bactérias
     */
    checkBacteriaCommunication(bacteria, otherBacteria) {
        if (!bacteria || bacteria.health <= 0) return;
        
        // Chance aleatória de iniciar comunicação (evita comunicação constante)
        if (random() > this.randomMessageChance) return;
        
        // Verifica bactérias dentro do alcance de comunicação
        const nearbyBacteria = this.getNearbyBacteria(bacteria, otherBacteria);
        
        // Se não houver bactérias próximas, retorna
        if (nearbyBacteria.length === 0) return;
        
        // Escolhe uma bactéria aleatória entre as próximas para comunicação
        const randomIndex = Math.floor(random(0, nearbyBacteria.length));
        const targetBacteria = nearbyBacteria[randomIndex];
        
        // Verifica se a comunicação neural está disponível e deve ser usada
        const useNeural = this.canUseNeuralCommunication(bacteria, targetBacteria);
        
        if (useNeural) {
            // Processa comunicação neural
            this.processNeuralCommunication(bacteria, targetBacteria);
        } else {
            // Realiza comunicação simbólica padrão
            this.messageManager.createBacteriaMessage(bacteria, targetBacteria);
        }
        
        // Registra comunicação para estatísticas
        this.addCommunicationStats(bacteria, targetBacteria);
    }
    
    /**
     * Verifica se duas bactérias podem usar comunicação neural
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se podem usar comunicação neural
     */
    canUseNeuralCommunication(b1, b2) {
        // Verificação inicial sobre a disponibilidade do sistema
        if (!this.useNeuralCommunication || !window.bacteria_communication) return false;
        
        try {
            // Verifica se ambas as bactérias são válidas
            if (!b1 || !b2) return false;
            
            // Verifica se o sistema principal de comunicação existe e tem o método necessário
            if (window.bacteria_communication && typeof window.bacteria_communication.canUseNeuralCommunication === 'function') {
                // Verifica separadamente cada bactéria para facilitar diagnóstico de erros
                const b1CanUse = window.bacteria_communication.canUseNeuralCommunication(b1);
                const b2CanUse = window.bacteria_communication.canUseNeuralCommunication(b2);
                
                return b1CanUse && b2CanUse;
            }
        } catch (error) {
            // Log detalhado para ajudar no diagnóstico
            console.warn("Erro ao verificar capacidade de comunicação neural:", error);
            
            // Identificação de bactérias problemáticas
            if (b1 && !b1.dna) console.warn("Bactéria 1 sem DNA:", b1);
            if (b2 && !b2.dna) console.warn("Bactéria 2 sem DNA:", b2);
        }
        
        // Se chegou até aqui, retorna falso como fallback seguro
        return false;
    }
    
    /**
     * Processa a comunicação neural entre duas bactérias
     * @param {Bacteria} sender - Bactéria que envia
     * @param {Bacteria} receiver - Bactéria que recebe
     */
    processNeuralCommunication(sender, receiver) {
        if (!window.bacteria_communication) return;
        
        try {
            // Delega o processamento para a classe principal
            if (typeof window.bacteria_communication.createCommunication === 'function') {
                window.bacteria_communication.createCommunication(sender, receiver);
            }
        } catch (error) {
            console.warn("Erro ao processar comunicação neural:", error);
        }
    }
    
    /**
     * Retorna bactérias próximas dentro do alcance de comunicação
     * @param {Bacteria} bacteria - Bactéria de referência
     * @param {Array} allBacteria - Lista de todas as bactérias
     * @returns {Array} - Lista de bactérias próximas
     */
    getNearbyBacteria(bacteria, allBacteria) {
        if (!bacteria || !allBacteria) return [];
        
        // Filtra as bactérias que estão dentro do alcance e são diferentes da bactéria atual
        return allBacteria.filter(other => {
            if (other === bacteria || !other || other.health <= 0) return false;
            
            // Calcula a distância entre as bactérias
            const dist = this.utils.calculateDistance(bacteria, other);
            return dist <= this.communicationRange;
        });
    }
    
    /**
     * Registra uma comunicação nas estatísticas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     */
    addCommunicationStats(b1, b2) {
        // Incrementa contador de comunicações
        this.stats.communicationCount++;
        
        // Adiciona par de bactérias (IDs concatenados)
        const pairId = this.utils.getBacteriaPairId(b1, b2);
        this.stats.bacteriaPairs.add(pairId);
        
        // Atualiza estatísticas na simulação
        if (this.simulation && this.simulation.stats) {
            this.simulation.stats.communications.totalMessages = this.stats.communicationCount;
            this.simulation.stats.communications.bacteriaPairs = this.stats.bacteriaPairs.size;
        }
    }
    
    /**
     * Fornece acesso ao relacionamento entre duas bactérias
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {Object|null} - Relacionamento ou null se não existir
     */
    getRelationship(b1, b2) {
        return this.relationshipManager.getRelationship(b1, b2);
    }
    
    /**
     * Verifica se duas bactérias são amigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem amigas
     */
    areBacteriaFriends(b1, b2) {
        return this.relationshipManager.areFriends(b1, b2);
    }
    
    /**
     * Verifica se duas bactérias são inimigas
     * @param {Bacteria} b1 - Primeira bactéria
     * @param {Bacteria} b2 - Segunda bactéria
     * @returns {boolean} - Verdadeiro se forem inimigas
     */
    areBacteriaEnemies(b1, b2) {
        return this.relationshipManager.areEnemies(b1, b2);
    }
    
    /**
     * Define o raio de comunicação entre bactérias
     * @param {number} range - Novo raio de comunicação
     */
    setCommunicationRange(range) {
        this.communicationRange = range;
    }
    
    /**
     * Define a chance de mensagens aleatórias
     * @param {number} chance - Nova chance de mensagens aleatórias
     */
    setRandomMessageChance(chance) {
        this.randomMessageChance = chance;
    }
    
    /**
     * Verifica se todos os componentes foram inicializados corretamente
     */
    validateComponents() {
        // Verifica se o messageManager foi inicializado corretamente
        if (!this.messageManager) {
            console.warn("MessageManager não inicializado corretamente");
        } else {
            this.messageManager.communicationSystem = this;
        }
        
        // Verifica se o interfaceManager foi inicializado corretamente
        if (!this.interfaceManager) {
            console.warn("CommunicationInterface não inicializado corretamente");
        }
        
        // Verifica se o messageGenerator foi inicializado corretamente
        if (!this.messageGenerator) {
            console.warn("MessageGenerator não inicializado corretamente");
        }
        
        // Verifica se o relationshipManager foi inicializado corretamente
        if (!this.relationshipManager) {
            console.warn("RelationshipManager não inicializado corretamente");
        }
    }
}

// Exporta a classe
window.CommunicationSystem = CommunicationSystem;

// Exportar para sistemas modulares, se necessário
if (typeof module !== 'undefined') {
    module.exports = CommunicationSystem;
} 