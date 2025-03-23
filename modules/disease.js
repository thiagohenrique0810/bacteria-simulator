/**
 * Sistema de Doenças e Infecções para o Simulador de Bactérias
 * Permite a criação, propagação e combate às doenças no ecossistema
 */
class DiseaseSystem {
    /**
     * Inicializa o sistema de doenças
     * @param {Simulation} simulation - Referência para a simulação
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.diseases = [];                // Lista de doenças ativas no ambiente
        this.infectionRange = 50;          // Distância para contágio
        this.randomDiseaseChance = 0.0005; // Chance de surgimento espontâneo de doença
        this.maxDiseases = 5;              // Número máximo de doenças simultâneas
        this.diseaseHistory = [];          // Histórico de doenças para análise
        this.immunityMemory = new Map();   // Mapa de imunidades adquiridas por cada bactéria
    }

    /**
     * Atualiza o sistema de doenças
     */
    update() {
        // Chance de surgimento de nova doença
        if (this.diseases.length < this.maxDiseases && random() < this.randomDiseaseChance) {
            this.createRandomDisease();
        }

        // Atualiza todas as doenças ativas
        for (let i = this.diseases.length - 1; i >= 0; i--) {
            const disease = this.diseases[i];
            disease.update();

            // Remove doenças extintas
            if (disease.infectedBacteria.size === 0) {
                this.diseaseHistory.push({
                    name: disease.name,
                    type: disease.type,
                    severity: disease.severity,
                    duration: disease.duration,
                    maxInfected: disease.maxInfected,
                    endTime: this.simulation.time
                });
                this.diseases.splice(i, 1);
            }
        }

        // Verifica propagação de doenças
        this.checkDiseaseSpread();
    }

    /**
     * Cria uma nova doença aleatória
     */
    createRandomDisease() {
        // Define tipos de doenças possíveis
        const diseaseTypes = [
            "metabolica",      // Afeta o metabolismo (consumo de energia)
            "motora",          // Afeta a movimentação (velocidade)
            "reprodutiva",     // Afeta a reprodução
            "neural",          // Afeta o sistema neural (tomada de decisão)
            "degenerativa"     // Afeta a saúde geral (diminui com o tempo)
        ];

        // Nomes de doenças para cada tipo
        const diseaseNames = {
            "metabolica": ["Gastroenterite", "Hipermetabolismo", "Síndrome Digestiva"],
            "motora": ["Paralisia Progressiva", "Tremores Bacterianos", "Atrofia Motora"],
            "reprodutiva": ["Infertilidade Microbiana", "Desregulação Genética", "Mutação Inibidora"],
            "neural": ["Confusão Neural", "Desordem Decisória", "Cegueira Sensorial"],
            "degenerativa": ["Necrose Celular", "Disfunção Mitocondrial", "Deterioração Sistêmica"]
        };

        // Seleciona tipo e nome da doença
        const type = random(diseaseTypes);
        const name = random(diseaseNames[type]);
        
        // Determina características da doença
        const severity = random(0.1, 1);      // Gravidade: 0.1 (leve) a 1 (grave)
        const immunity = random(0.3, 0.9);    // Fator de imunidade: facilidade de combater
        const duration = random(500, 5000);   // Duração em frames
        const contagion = random(0.1, 0.8);   // Taxa de contágio
        
        // Cria a doença
        const disease = new Disease(name, type, severity, immunity, duration, contagion);
        this.diseases.push(disease);
        
        // Infecta uma bactéria aleatória como paciente zero
        if (this.simulation.bacteria.length > 0) {
            const patientZero = random(this.simulation.bacteria);
            disease.infectBacteria(patientZero);
            
            // Adiciona mensagem no sistema de comunicação
            if (this.simulation.communication) {
                const msg = {
                    senderId: 999, // ID do sistema
                    isFemale: false,
                    time: this.simulation.communication.getFormattedTime(),
                    type: 'system',
                    content: `⚠️ Alerta: ${name} detectada! Infecção iniciada em Bact-${patientZero.id.toString().padStart(3, '0')}.`
                };
                this.simulation.communication.addMessage(msg);
            }
        }
        
        return disease;
    }

    /**
     * Verifica a propagação de doenças entre bactérias próximas
     */
    checkDiseaseSpread() {
        // Usa o grid espacial para otimização se disponível
        if (this.simulation.spatialGrid && this.diseases.length > 0) {
            for (const disease of this.diseases) {
                // Para cada bactéria infectada
                for (const infectedId of disease.infectedBacteria.keys()) {
                    // Encontra a bactéria pelo ID
                    const infected = this.simulation.bacteria.find(b => b.id === infectedId);
                    if (!infected) continue;
                    
                    // Busca bactérias próximas
                    const nearbyEntities = this.simulation.spatialGrid.queryRadius(
                        infected.pos, this.infectionRange
                    );
                    
                    const nearbyBacteria = nearbyEntities.filter(e => 
                        e instanceof Bacteria && 
                        e !== infected && 
                        !disease.infectedBacteria.has(e.id) &&
                        !disease.immuneBacteria.has(e.id)
                    );
                    
                    // Tenta infectar bactérias próximas
                    for (const target of nearbyBacteria) {
                        const immunityFactor = target.dna.genes.immunity;
                        const contagionChance = disease.contagion * (1 - immunityFactor * 0.8);
                        
                        // Verifica se esta bactéria já teve esta doença antes
                        if (this.immunityMemory.has(target.id)) {
                            const memories = this.immunityMemory.get(target.id);
                            if (memories.has(disease.name)) {
                                continue; // Já é imune a esta doença específica
                            }
                        }
                        
                        // Tenta infectar baseado na chance de contágio
                        if (random() < contagionChance) {
                            disease.infectBacteria(target);
                        }
                    }
                }
            }
        } else {
            // Abordagem alternativa sem grid espacial (menos eficiente)
            for (const disease of this.diseases) {
                for (const bacteria of this.simulation.bacteria) {
                    if (disease.infectedBacteria.has(bacteria.id)) {
                        // Esta bactéria está infectada, procura por alvos próximos
                        for (const target of this.simulation.bacteria) {
                            if (target !== bacteria && 
                                !disease.infectedBacteria.has(target.id) && 
                                !disease.immuneBacteria.has(target.id)) {
                                
                                const d = dist(bacteria.pos.x, bacteria.pos.y, target.pos.x, target.pos.y);
                                if (d < this.infectionRange) {
                                    const immunityFactor = target.dna.genes.immunity;
                                    const contagionChance = disease.contagion * (1 - immunityFactor * 0.8);
                                    
                                    if (random() < contagionChance) {
                                        disease.infectBacteria(target);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Adiciona imunidade adquirida para uma bactéria
     * @param {Bacteria} bacteria - A bactéria que adquiriu imunidade
     * @param {Disease} disease - A doença à qual adquiriu imunidade
     */
    addImmunityMemory(bacteria, disease) {
        if (!this.immunityMemory.has(bacteria.id)) {
            this.immunityMemory.set(bacteria.id, new Set());
        }
        
        this.immunityMemory.get(bacteria.id).add(disease.name);
    }

    /**
     * Desenha efeitos visuais para doenças
     */
    draw() {
        if (!this.simulation.visualization.showDiseaseEffects) return;
        
        for (const disease of this.diseases) {
            for (const infectedId of disease.infectedBacteria.keys()) {
                const bacteria = this.simulation.bacteria.find(b => b.id === infectedId);
                if (!bacteria) continue;
                
                // Desenha efeito visual da infecção
                push();
                noFill();
                stroke(disease.color);
                strokeWeight(1);
                drawingContext.setLineDash([2, 3]);
                ellipse(bacteria.pos.x, bacteria.pos.y, bacteria.size * 2.5);
                drawingContext.setLineDash([]);
                pop();
            }
        }
    }

    /**
     * Obtém estatísticas sobre doenças para exibição
     */
    getStatistics() {
        const stats = {
            activeDiseases: this.diseases.length,
            totalInfected: 0,
            diseaseNames: [],
            infectionRate: 0
        };
        
        // Conta o total de infecções ativas
        for (const disease of this.diseases) {
            stats.totalInfected += disease.infectedBacteria.size;
            stats.diseaseNames.push({
                name: disease.name,
                infected: disease.infectedBacteria.size,
                immune: disease.immuneBacteria.size
            });
        }
        
        // Taxa de infecção da população
        if (this.simulation.bacteria.length > 0) {
            stats.infectionRate = stats.totalInfected / this.simulation.bacteria.length;
        }
        
        return stats;
    }
}

/**
 * Classe que representa uma doença específica
 */
class Disease {
    /**
     * Cria uma nova doença
     * @param {string} name - Nome da doença
     * @param {string} type - Tipo de doença (metabólica, motora, etc)
     * @param {number} severity - Gravidade (0.1 a 1)
     * @param {number} immunity - Fator de imunidade (0.1 a 1)
     * @param {number} duration - Duração em frames
     * @param {number} contagion - Taxa de contágio (0.1 a 1)
     */
    constructor(name, type, severity, immunity, duration, contagion) {
        this.name = name;
        this.type = type;
        this.severity = severity;
        this.immunity = immunity;
        this.duration = duration;
        this.contagion = contagion;
        
        this.infectedBacteria = new Map(); // Map de ID da bactéria -> tempo de infecção
        this.immuneBacteria = new Set();   // Set de IDs de bactérias que se tornaram imunes
        this.maxInfected = 0;              // Rastreamento do pico de infecção
        this.creationTime = performance.now();
        
        // Define cor baseada no tipo de doença
        this.color = this.getDiseaseColor();
    }

    /**
     * Atualiza o estado da doença
     */
    update() {
        // Atualiza cada bactéria infectada
        for (const [bacteriaId, infectionTime] of this.infectedBacteria.entries()) {
            // Encontra a bactéria pelo ID
            const bacteria = this.findBacteriaById(bacteriaId);
            if (!bacteria) {
                // Bactéria não existe mais, remove da lista
                this.infectedBacteria.delete(bacteriaId);
                continue;
            }
            
            // Aplica efeitos da doença baseado no tipo
            this.applyDiseaseEffects(bacteria);
            
            // Controla o tempo de infecção
            const newInfectionTime = infectionTime + 1;
            this.infectedBacteria.set(bacteriaId, newInfectionTime);
            
            // Verifica se a bactéria pode se curar
            if (newInfectionTime >= this.duration) {
                this.recoverBacteria(bacteria);
            } else {
                // Chance de se recuperar antes com base na imunidade da bactéria
                const immunityFactor = bacteria.dna.genes.immunity + bacteria.dna.genes.regeneration * 0.3;
                const recoveryChance = 0.002 * immunityFactor * (newInfectionTime / this.duration);
                
                if (random() < recoveryChance) {
                    this.recoverBacteria(bacteria);
                }
            }
        }
        
        // Rastreia pico de infecção
        if (this.infectedBacteria.size > this.maxInfected) {
            this.maxInfected = this.infectedBacteria.size;
        }
    }

    /**
     * Aplica os efeitos da doença em uma bactéria infectada
     * @param {Bacteria} bacteria - A bactéria infectada
     */
    applyDiseaseEffects(bacteria) {
        // Efeito de acordo com o tipo de doença
        switch(this.type) {
            case "metabolica":
                // Aumenta o consumo de energia
                bacteria.energy -= this.severity * 0.2;
                break;
                
            case "motora":
                // Reduz a velocidade
                bacteria.movement.maxSpeed = bacteria.movement.baseMaxSpeed * (1 - this.severity * 0.5);
                break;
                
            case "reprodutiva":
                // Impede a reprodução temporariamente
                bacteria.canReproduce = false;
                break;
                
            case "neural":
                // Afeta a tomada de decisões (movimento aleatório ocasional)
                if (random() < this.severity * 0.2) {
                    const randomDir = p5.Vector.random2D();
                    bacteria.movement.velocity.add(randomDir).mult(0.8);
                }
                break;
                
            case "degenerativa":
                // Reduz a saúde gradualmente
                bacteria.health -= this.severity * 0.15;
                break;
        }
        
        // Redução de saúde geral para todos os tipos de doença
        bacteria.health -= this.severity * 0.05;
    }

    /**
     * Infecta uma bactéria com esta doença
     * @param {Bacteria} bacteria - A bactéria a ser infectada
     */
    infectBacteria(bacteria) {
        // Não re-infecta ou infecta bactérias imunes
        if (this.infectedBacteria.has(bacteria.id) || this.immuneBacteria.has(bacteria.id)) {
            return false;
        }
        
        // Registra a infecção
        this.infectedBacteria.set(bacteria.id, 0);
        
        // Altera o estado visual da bactéria
        bacteria.isInfected = true;
        bacteria.activeDiseases = bacteria.activeDiseases || new Set();
        bacteria.activeDiseases.add(this.name);
        
        return true;
    }

    /**
     * Recupera uma bactéria da doença
     * @param {Bacteria} bacteria - A bactéria a ser recuperada
     */
    recoverBacteria(bacteria) {
        if (!this.infectedBacteria.has(bacteria.id)) return;
        
        // Remove da lista de infectados
        this.infectedBacteria.delete(bacteria.id);
        
        // Adiciona à lista de imunes
        this.immuneBacteria.add(bacteria.id);
        
        // Restaura valores originais
        if (bacteria.activeDiseases) {
            bacteria.activeDiseases.delete(this.name);
            if (bacteria.activeDiseases.size === 0) {
                bacteria.isInfected = false;
            }
        }
        
        if (this.type === "motora") {
            bacteria.movement.maxSpeed = bacteria.movement.baseMaxSpeed;
        } else if (this.type === "reprodutiva") {
            bacteria.canReproduce = true;
        }
        
        // Registra a imunidade adquirida no sistema central
        if (bacteria.simulation && bacteria.simulation.diseaseSystem) {
            bacteria.simulation.diseaseSystem.addImmunityMemory(bacteria, this);
        }
    }

    /**
     * Encontra uma bactéria pelo ID
     * @param {number} id - ID da bactéria a ser encontrada
     * @returns {Bacteria|null} - A bactéria encontrada ou null
     */
    findBacteriaById(id) {
        // Assume que a simulação tem um array de bactérias
        const bacteria = window.simulation?.bacteria || [];
        return bacteria.find(b => b.id === id) || null;
    }

    /**
     * Define uma cor baseada no tipo de doença
     * @returns {p5.Color} - Cor da doença
     */
    getDiseaseColor() {
        switch(this.type) {
            case "metabolica":
                return color(220, 100, 100, 150); // Vermelho
            case "motora":
                return color(100, 100, 220, 150); // Azul
            case "reprodutiva":
                return color(220, 100, 220, 150); // Rosa
            case "neural":
                return color(220, 220, 100, 150); // Amarelo
            case "degenerativa":
                return color(100, 220, 100, 150); // Verde
            default:
                return color(180, 180, 180, 150); // Cinza
        }
    }
}

// Exporta as classes para uso global
window.DiseaseSystem = DiseaseSystem;
window.Disease = Disease; 