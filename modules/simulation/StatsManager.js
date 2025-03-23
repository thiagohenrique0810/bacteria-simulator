/**
 * Gerenciador de estatísticas da simulação
 * Responsável por rastrear e atualizar estatísticas do ecossistema
 */
class StatsManager {
    /**
     * Inicializa o gerenciador de estatísticas
     * @param {Simulation} simulation - Referência para a simulação principal
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.initStats();
    }
    
    /**
     * Inicializa as estatísticas
     */
    initStats() {
        this.stats = {
            generation: 1,
            totalBacteria: 0,
            totalBacterias: 0,
            femaleBacterias: 0,
            maleBacterias: 0,
            pregnantBacterias: 0,
            restingBacterias: 0,
            hungryBacterias: 0,
            starvationDeaths: 0,
            highestGeneration: 1,
            births: 0,
            naturalBirths: 0,     // Nascimentos por reprodução natural
            matingAttempts: 0,    // Tentativas de acasalamento
            successfulMatings: 0,  // Acasalamentos bem-sucedidos
            deaths: 0,
            foodConsumed: 0,
            mutations: 0,
            eventsTriggered: 0,
            averageHealth: 0,
            totalChildren: 0,
            averageReward: 0,
            explorationRate: 0,
            learningProgress: 0,
            initialPopulation: 0,
            currentPopulation: 0,
            foodEaten: 0,
            successfulMates: 0,
            predatorKills: 0,
            escapes: 0,
            diseaseCases: 0,       // Total de casos de doenças
            diseaseDeaths: 0,      // Mortes por doenças
            immunityAcquired: 0,   // Imunidade adquirida
            diseaseSpreads: 0      // Total de contágios
        };
    }
    
    /**
     * Atualiza as estatísticas com base no estado atual da simulação
     */
    updateStats() {
        // Referências simplificadas
        const entityManager = this.simulation.entityManager;
        const bacteria = entityManager.bacteria;
        
        // População total
        this.stats.totalBacteria = bacteria.length;
        this.stats.totalBacterias = bacteria.length;

        // Contadores
        this.stats.femaleBacterias = 0;
        this.stats.maleBacterias = 0;
        this.stats.pregnantBacterias = 0;
        this.stats.restingBacterias = 0;
        this.stats.hungryBacterias = 0;

        // Variáveis para médias
        let totalHealth = 0;
        let totalReward = 0;
        let totalExplorationActions = 0;
        let totalQValues = 0;
        let totalQEntries = 0;

        // Calcula médias e contadores
        for (let bact of bacteria) {
            // Contagem por gênero
            if (bact.isFemale) {
                this.stats.femaleBacterias++;
            } else {
                this.stats.maleBacterias++;
            }

            // Contagem por estado
            if (bact.reproduction && bact.reproduction.isPregnant) {
                this.stats.pregnantBacterias++;
            }
            if (bact.states && bact.states.getCurrentState() === 'resting') {
                this.stats.restingBacterias++;
            }
            if (bact.states && bact.states.getEnergy() < 30) {
                this.stats.hungryBacterias++;
            }

            // Soma saúde para média
            totalHealth += bact.health;

            // Estatísticas do Q-Learning
            let reward = 0;
            if (typeof bact.calculateReward === 'function') {
                reward = bact.calculateReward();
            } else {
                // Valor fallback baseado na saúde e energia
                reward = (bact.health / 100) * 0.5;
                if (bact.states && typeof bact.states.getEnergy === 'function') {
                    reward += (bact.states.getEnergy() / 100) * 0.5;
                } else if (bact.energy) {
                    reward += (bact.energy / 100) * 0.5;
                }
            }
            totalReward += reward;

            // Conta ações de exploração (quando random < 0.1)
            if (random() < 0.1) {
                totalExplorationActions++;
            }

            // Calcula média dos Q-values
            // Verifica acesso seguro à qTable considerando a nova estrutura
            let qTable = null;
            
            // Verifica diferentes caminhos possíveis para a qTable
            if (bact.qLearning && bact.qLearning.qTable) {
                // Estrutura antiga
                qTable = bact.qLearning.qTable;
            } else if (bact.learning && bact.learning.qLearning && bact.learning.qLearning.qTable) {
                // Nova estrutura modular
                qTable = bact.learning.qLearning.qTable;
            }
            
            // Só processa se encontrou a qTable
            if (qTable) {
                for (let stateKey in qTable) {
                    const qValues = Object.values(qTable[stateKey]);
                    totalQValues += qValues.reduce((a, b) => a + b, 0);
                    totalQEntries += qValues.length;
                }
            }
        }

        // Calcula média de saúde
        this.stats.averageHealth = bacteria.length > 0 ? 
            totalHealth / bacteria.length : 0;

        // Atualiza geração mais alta
        for (let bact of bacteria) {
            if (bact.dna.generation > this.stats.highestGeneration) {
                this.stats.highestGeneration = bact.dna.generation;
            }
        }

        // Atualiza estatísticas do Q-Learning
        this.stats.averageReward = bacteria.length > 0 ? 
            totalReward / bacteria.length : 0;
        this.stats.explorationRate = bacteria.length > 0 ? 
            totalExplorationActions / bacteria.length : 0;
        this.stats.learningProgress = totalQEntries > 0 ? 
            totalQValues / totalQEntries : 0;
    }
    
    /**
     * Desenha as estatísticas na tela
     */
    drawStats() {
        fill(255);
        noStroke();
        textSize(14);
        textAlign(LEFT);

        let y = 20;
        text(`Geração: ${this.stats.generation}`, 10, y); y += 20;
        
        // Mostra população atual / limite
        let populationText = `Bactérias: ${this.stats.totalBacteria}/${this.simulation.entityManager.populationLimit}`;
        
        // Altera a cor para vermelho se estiver próximo do limite
        if (this.stats.totalBacteria > this.simulation.entityManager.populationLimit * 0.9) {
            fill(255, 100, 100);
            populationText += " (próximo do limite)";
        }
        
        text(populationText, 10, y); y += 20;
        fill(255); // Restaura a cor original
        
        text(`Fêmeas: ${this.stats.femaleBacterias}`, 10, y); y += 20;
        text(`Machos: ${this.stats.maleBacterias}`, 10, y); y += 20;
        text(`Grávidas: ${this.stats.pregnantBacterias}`, 10, y); y += 20;
        text(`Acasalamentos: ${this.stats.successfulMatings}`, 10, y); y += 20;
        text(`Nascimentos: ${this.stats.naturalBirths}`, 10, y); y += 20;
        text(`Mortes: ${this.stats.deaths}`, 10, y); y += 20;
        text(`Comida: ${this.stats.foodConsumed}`, 10, y);
    }

    /**
     * Incrementa um valor específico de estatística
     * @param {string} statName - Nome da estatística a ser incrementada
     * @param {number} value - Valor a ser adicionado (padrão: 1)
     */
    incrementStat(statName, value = 1) {
        if (!this.stats) {
            console.warn("Estatísticas não inicializadas ao tentar incrementar", statName);
            return;
        }
        
        if (statName in this.stats) {
            this.stats[statName] += value;
            console.log(`Estatística "${statName}" incrementada para ${this.stats[statName]}`);
        } else {
            console.warn(`Estatística "${statName}" não encontrada no gerenciador de estatísticas`);
        }
    }
    
    /**
     * Método de atualização chamado a cada frame da simulação
     */
    update() {
        this.updateStats();
    }
    
    /**
     * Método de desenho chamado a cada frame da simulação
     */
    draw() {
        this.drawStats();
    }
    
    /**
     * Adiciona um ponto de dados para uma estatística específica
     * @param {string} statName - Nome da estatística
     * @param {number} value - Valor a ser registrado
     */
    addDataPoint(statName, value) {
        try {
            // Se a estatística não existir, cria um array para ela
            if (!this.dataPoints) {
                this.dataPoints = {};
            }
            
            if (!this.dataPoints[statName]) {
                this.dataPoints[statName] = [];
            }
            
            // Adiciona o valor ao array de dados
            this.dataPoints[statName].push({
                time: Date.now(),
                value: value
            });
            
            // Limita o array a 100 pontos para evitar crescimento infinito
            if (this.dataPoints[statName].length > 100) {
                this.dataPoints[statName].shift();
            }
            
            // Também atualiza o valor atual no objeto stats se ele existir
            if (this.stats && statName in this.stats) {
                this.stats[statName] = value;
            }
        } catch (error) {
            console.warn(`Erro ao adicionar ponto de dados para "${statName}":`, error);
        }
    }
}

// Torna a classe disponível globalmente
window.StatsManager = StatsManager; 