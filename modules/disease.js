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
        try {
            // Chance de surgimento de nova doença
            if (this.diseases.length < this.maxDiseases && random() < this.randomDiseaseChance) {
                this.createRandomDisease();
            }

            // Atualiza todas as doenças ativas
            for (let i = this.diseases.length - 1; i >= 0; i--) {
                try {
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
                } catch (error) {
                    console.error("Erro ao atualizar doença específica:", error);
                    // Remove a doença problemática
                    this.diseases.splice(i, 1);
                }
            }

            // Verifica propagação de doenças
            try {
                this.checkDiseaseSpread();
            } catch (error) {
                console.error("Erro na propagação de doenças:", error);
            }
        } catch (error) {
            console.error("Erro global no sistema de doenças:", error);
        }
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
     * @param {string} type - Tipo de doença (metabolica, motora, reprodutiva, neural, degenerativa)
     * @param {number} severity - Severidade (0-1)
     * @param {number} immunity - Dificuldade de adquirir imunidade (0-1)
     * @param {number} duration - Duração da doença em frames
     * @param {number} contagion - Taxa de contágio (0-1)
     */
    constructor(name, type, severity, immunity, duration, contagion) {
        this.name = name;
        this.type = type;
        this.severity = severity;
        this.immunity = immunity;
        this.duration = duration;
        this.contagion = contagion;
        
        this.infectedBacteria = new Map();   // Map de ID da bactéria -> tempo de infecção
        this.immuneBacteria = new Map();     // Map de ID da bactéria -> tempo de imunização
        this.infectedCount = 0;              // Total de bactérias infectadas desde o início
        this.recoveredCount = 0;             // Total de bactérias recuperadas
        this.maxInfected = 0;                // Máximo de infectados simultâneos
        this.color = this.getDiseaseColor(); // Cor baseada no tipo
    }

    /**
     * Atualiza o estado da doença
     */
    update() {
        try {
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
                    // Verifica se os objetos necessários existem
                    if (bacteria.dna && bacteria.dna.genes) {
                        const immunityFactor = (bacteria.dna.genes.immunity || 0.5) + (bacteria.dna.genes.regeneration || 0.5) * 0.3;
                        const recoveryChance = 0.002 * immunityFactor * (newInfectionTime / this.duration);
                        
                        if (random() < recoveryChance) {
                            this.recoverBacteria(bacteria);
                        }
                    }
                }
            }
            
            // Rastreia pico de infecção
            if (this.infectedBacteria.size > this.maxInfected) {
                this.maxInfected = this.infectedBacteria.size;
            }
        } catch (error) {
            console.error("Erro ao atualizar doença:", error);
            // Continue a execução para não quebrar toda a simulação
        }
    }

    /**
     * Aplica os efeitos da doença em uma bactéria
     * @param {Bacteria} bacteria - A bactéria afetada
     * @param {number} deltaTime - Tempo desde o último frame
     */
    applyDiseaseEffects(bacteria, deltaTime = 1) {
        // Verifica se a bactéria é válida
        if (!bacteria || !bacteria.id) {
            return;
        }

        try {
            // Aplica efeitos com base no tipo da doença
            switch (this.type) {
                case "motora":
                    // Reduz a velocidade máxima
                    if (bacteria.movement) {
                        // Armazena a velocidade máxima original na primeira aplicação
                        if (bacteria.movement.baseMaxSpeed === undefined) {
                            bacteria.movement.baseMaxSpeed = bacteria.movement.maxSpeed;
                        }
                        
                        // Reduz a velocidade para 30-50% do normal
                        bacteria.movement.maxSpeed = bacteria.movement.baseMaxSpeed * (0.3 + (this.severity * 0.2));
                        
                        // Adiciona um tremor aleatório ao movimento
                        if (bacteria.movement && bacteria.movement.velocity) {
                            const tremor = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
                            tremor.mult(this.severity);
                            
                            // Verifica se a função applyForce existe antes de chamar
                            if (typeof bacteria.movement.applyForce === 'function') {
                                bacteria.movement.applyForce(tremor);
                            } else if (bacteria.movement.movement && typeof bacteria.movement.movement.applyForce === 'function') {
                                bacteria.movement.movement.applyForce(tremor);
                            }
                        }
                    }
                    break;
                    
                case "reprodutiva":
                    // Impede a reprodução
                    bacteria.canReproduce = false;
                    break;
                    
                case "metabolica":
                    // Consome energia extra
                    if (bacteria.stateManager && typeof bacteria.stateManager.consumeEnergy === 'function') {
                        bacteria.stateManager.consumeEnergy(0.05 * this.severity * deltaTime);
                    }
                    break;
                    
                case "genetica":
                    // Aumenta chance de mutação e pode reduzir fitness
                    if (bacteria.dna && bacteria.dna.genes) {
                        // Aumenta a taxa de mutação temporariamente
                        const originalMutationRate = bacteria.dna.genes.mutationRate || 0.05;
                        bacteria.dna.genes.mutationRate = originalMutationRate * (1 + this.severity);
                        
                        // Pequena chance de mutar um gene aleatório
                        if (random() < 0.001 * this.severity * deltaTime) {
                            const keys = Object.keys(bacteria.dna.genes);
                            const randomKey = keys[Math.floor(random(keys.length))];
                            if (randomKey && randomKey !== "mutationRate") {
                                // Aplica uma pequena mutação
                                const currentValue = bacteria.dna.genes[randomKey];
                                bacteria.dna.genes[randomKey] = currentValue * (1 + random(-0.1, 0.1));
                            }
                        }
                    }
                    break;
            }
            
            // Efeitos adicionais temporários
            if (this.duration > 0) {
                // Efeitos visuais - tornar a bactéria mais pálida quanto mais grave a doença
                bacteria.diseaseVisualEffect = this.severity;
            }
        } catch (error) {
            console.error(`Erro ao aplicar efeitos da doença: ${error.message}`, error);
        }
    }

    /**
     * Infecta uma bactéria com esta doença
     * @param {Bacteria} bacteria - A bactéria a ser infectada
     */
    infectBacteria(bacteria) {
        // Verificar se a bactéria é válida
        if (!bacteria || !bacteria.id) {
            console.warn("Tentativa de infectar uma bactéria inválida");
            return false;
        }
        
        // Não re-infecta ou infecta bactérias imunes
        if (this.infectedBacteria.has(bacteria.id) || this.immuneBacteria.has(bacteria.id)) {
            return false;
        }
        
        // Registra a infecção
        this.infectedBacteria.set(bacteria.id, 0);
        
        // Altera o estado visual da bactéria
        bacteria.isInfected = true;
        
        // Verifica e inicializa activeDiseases conforme seu tipo atual
        if (!bacteria.activeDiseases) {
            bacteria.activeDiseases = new Map();
        } else if (bacteria.activeDiseases instanceof Set) {
            // Converte de Set para Map se necessário
            console.log("Convertendo activeDiseases de Set para Map");
            const oldDiseases = bacteria.activeDiseases;
            bacteria.activeDiseases = new Map();
            oldDiseases.forEach(disease => {
                if (typeof disease === 'string') {
                    bacteria.activeDiseases.set(disease, this);
                } else if (disease && disease.name) {
                    bacteria.activeDiseases.set(disease.name, disease);
                }
            });
        }
        
        // Adiciona a doença com segurança, verificando se é um Map
        try {
            if (bacteria.activeDiseases instanceof Map) {
                bacteria.activeDiseases.set(this.name, this);
            } else if (bacteria.activeDiseases instanceof Set) {
                // Fallback para Set se a conversão falhou
                bacteria.activeDiseases.add(this.name);
            } else {
                console.error("bacteria.activeDiseases não é nem Map nem Set:", bacteria.activeDiseases);
                // Recria como Map em último caso
                bacteria.activeDiseases = new Map();
                bacteria.activeDiseases.set(this.name, this);
            }
        } catch (error) {
            console.error("Erro ao adicionar doença:", error);
            // Em caso de erro, tenta uma abordagem alternativa
            try {
                bacteria.activeDiseases = new Map();
                bacteria.activeDiseases.set(this.name, this);
            } catch (e) {
                console.error("Falha completa ao configurar doença:", e);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Recupera uma bactéria da doença
     * @param {Bacteria} bacteria - A bactéria a ser recuperada
     */
    recoverBacteria(bacteria) {
        if (!bacteria || !bacteria.id) {
            console.warn("Tentativa de recuperar uma bactéria inválida");
            return;
        }
        
        // Remove da lista de infectados
        this.infectedBacteria.delete(bacteria.id);
        
        // Adiciona à lista de imunes
        this.immuneBacteria.set(bacteria.id, frameCount);
        
        // Atualiza o contador de recuperados
        this.recoveredCount++;
        
        // Remove da lista de doenças ativas da bactéria
        try {
            if (bacteria.activeDiseases) {
                if (bacteria.activeDiseases instanceof Map) {
                    bacteria.activeDiseases.delete(this.name);
                    if (bacteria.activeDiseases.size === 0) {
                        bacteria.isInfected = false;
                    }
                } else if (bacteria.activeDiseases instanceof Set) {
                    bacteria.activeDiseases.delete(this.name);
                    if (bacteria.activeDiseases.size === 0) {
                        bacteria.isInfected = false;
                    }
                } else {
                    console.warn("Tipo de activeDiseases desconhecido durante recuperação:", typeof bacteria.activeDiseases);
                    bacteria.isInfected = false;
                }
            } else {
                bacteria.isInfected = false;
            }
        } catch (error) {
            console.error("Erro ao remover doença durante recuperação:", error);
            bacteria.isInfected = false;
        }
        
        // Restaura propriedades afetadas pela doença
        if (this.type === "motora" && bacteria.movement) {
            // Verifica se o movimento e baseMaxSpeed existem
            if (bacteria.movement && bacteria.movement.baseMaxSpeed !== undefined) {
                bacteria.movement.maxSpeed = bacteria.movement.baseMaxSpeed;
            }
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
        try {
            // Tenta várias formas de localizar as bactérias
            let bacteria = [];
            
            // Método 1: window.simulation.bacteria (forma mais comum)
            if (window.simulation && window.simulation.bacteria) {
                bacteria = window.simulation.bacteria;
            }
            // Método 2: via simulationInstance (para novos sistemas)
            else if (window.simulationInstance && window.simulationInstance.entityManager) {
                bacteria = window.simulationInstance.entityManager.getBacteria();
            }
            // Método 3: via this.simulation (referência local)
            else if (this.simulation && this.simulation.bacteria) {
                bacteria = this.simulation.bacteria;
            }
            
            // Verificação de tipo
            if (!Array.isArray(bacteria)) {
                console.warn("findBacteriaById: bacteria não é um array");
                return null;
            }
            
            // Busca a bactéria pelo ID
            return bacteria.find(b => b && b.id === id) || null;
        } catch (error) {
            console.error("Erro ao procurar bactéria por ID:", error);
            return null;
        }
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