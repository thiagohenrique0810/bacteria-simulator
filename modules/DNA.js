/**
 * Sistema genético avançado das bactérias
 */
class DNA {
    /**
     * Inicializa o DNA
     * @param {Object} parentDNA - DNA dos pais (opcional)
     * @param {number} fitness - Valor de fitness (opcional)
     */
    constructor(parentDNA = null, fitness = 1.0) {
        this.generation = parentDNA ? parentDNA.generation + 1 : 1;
        
        // Uso seguro de window.simulation para evitar erro undefined
        let defaultLifespan = 12 * 3600 * 60; // 12 horas em frames (valor padrão)
        
        try {
            // Tenta acessar o controle de forma segura
            if (window.simulation && 
                window.simulation.controls && 
                typeof window.simulation.controls.lifespanSlider?.value === 'function') {
                defaultLifespan = window.simulation.controls.lifespanSlider.value() * 3600 * 60;
            }
        } catch (e) {
            console.log("Usando valor padrão para baseLifespan", e);
        }
        
        this.baseLifespan = defaultLifespan;
        this.fitness = fitness;
        this.genes = this.initializeGenes(parentDNA);
        this.adaptedToEnvironment = []; // Nichos ecológicos adaptados
    }

    /**
     * Inicializa os genes
     * @param {Object} parentDNA - DNA dos pais
     * @returns {Object} Genes inicializados
     */
    initializeGenes(parentDNA) {
        if (parentDNA) {
            return this.mutateGenes(parentDNA.genes, parentDNA.fitness);
        }

        return {
            // Atributos físicos
            metabolism: random(0.5, 1.5),    // Taxa de consumo de energia
            immunity: random(0.5, 1.5),      // Resistência a doenças
            regeneration: random(0.5, 1.5),  // Velocidade de recuperação
            speed: random(0.5, 1.5),         // Velocidade de movimento
            size: random(0.8, 1.2),          // Tamanho relativo

            // Atributos comportamentais
            aggressiveness: random(0, 1),    // Tendência a atacar
            sociability: random(0, 1),       // Tendência a se agrupar
            curiosity: random(0, 1),         // Tendência a explorar
            
            // Atributos reprodutivos
            fertility: random(0.5, 1.5),     // Taxa de reprodução
            mutationRate: random(0.01, 0.1), // Taxa de mutação
            adaptability: random(0.5, 1.5),  // Capacidade de adaptação

            // Atributos de aparência
            color: {
                r: random(-50, 50),
                g: random(-50, 50),
                b: random(-50, 50)
            },
            
            // Novos atributos
            nightVision: random(0, 1),       // Capacidade de ver no escuro 
            resourceEfficiency: random(0.5, 1.5), // Eficiência no uso de recursos
            diseaseResistance: random(0, 1), // Resistência a doenças
            communicationLevel: random(0, 1) // Habilidade de comunicação
        };
    }

    /**
     * Aplica mutações aos genes
     * @param {Object} parentGenes - Genes dos pais
     * @param {number} fitness - Valor de fitness
     * @returns {Object} Genes mutados
     */
    mutateGenes(parentGenes, fitness = 1.0) {
        const mutatedGenes = {};
        
        // Mutação adaptativa - fitness baixo aumenta a taxa de mutação para explorar mais
        // fitness alto diminui a taxa de mutação para preservar bons genes
        const baseMutationRate = parentGenes.mutationRate || 0.05;
        const adaptedMutationRate = baseMutationRate * (1 / Math.max(0.5, fitness));
        const mutationRate = constrain(adaptedMutationRate, 0.01, 0.2);
        
        // Define variação de mutação baseada no fitness
        const mutationStrength = constrain(0.1 * (1 / fitness), 0.05, 0.3);

        for (let gene in parentGenes) {
            if (gene === 'color') {
                mutatedGenes.color = {
                    r: this.mutateValue(parentGenes.color.r, -50, 50, mutationRate, mutationStrength),
                    g: this.mutateValue(parentGenes.color.g, -50, 50, mutationRate, mutationStrength),
                    b: this.mutateValue(parentGenes.color.b, -50, 50, mutationRate, mutationStrength)
                };
            } else {
                const range = this.getGeneRange(gene);
                mutatedGenes[gene] = this.mutateValue(
                    parentGenes[gene],
                    range.min,
                    range.max,
                    mutationRate,
                    mutationStrength
                );
            }
        }
        
        // Define a taxa de mutação no gene como a taxa adaptada
        mutatedGenes.mutationRate = mutationRate;

        return mutatedGenes;
    }

    /**
     * Retorna o intervalo válido para cada gene
     * @param {string} gene - Nome do gene
     * @returns {Object} Intervalo mínimo e máximo
     */
    getGeneRange(gene) {
        const ranges = {
            metabolism: { min: 0.5, max: 1.5 },
            immunity: { min: 0.5, max: 1.5 },
            regeneration: { min: 0.5, max: 1.5 },
            speed: { min: 0.5, max: 1.5 },
            size: { min: 0.8, max: 1.2 },
            aggressiveness: { min: 0, max: 1 },
            sociability: { min: 0, max: 1 },
            curiosity: { min: 0, max: 1 },
            fertility: { min: 0.5, max: 1.5 },
            mutationRate: { min: 0.01, max: 0.1 },
            adaptability: { min: 0.5, max: 1.5 },
            nightVision: { min: 0, max: 1 },
            resourceEfficiency: { min: 0.5, max: 1.5 },
            diseaseResistance: { min: 0, max: 1 },
            communicationLevel: { min: 0, max: 1 }
        };

        return ranges[gene] || { min: 0, max: 1 };
    }

    /**
     * Aplica mutação a um valor
     * @param {number} value - Valor original
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @param {number} mutationRate - Taxa de mutação
     * @param {number} strength - Intensidade da mutação
     * @returns {number} Valor mutado
     */
    mutateValue(value, min, max, mutationRate, strength = 0.1) {
        if (random() < mutationRate) {
            // Mutação aleatória com intensidade variável
            const change = random(-strength, strength);
            return constrain(value + change, min, max);
        }
        return value;
    }

    /**
     * Combina dois DNAs para criar um novo usando crossover de múltiplos pontos
     * @param {DNA} partner - DNA do parceiro
     * @returns {DNA} Novo DNA combinado
     */
    combine(partner) {
        const childDNA = new DNA();
        childDNA.generation = max(this.generation, partner.generation) + 1;
        
        // Combina adaptações ambientais
        childDNA.adaptedToEnvironment = [...new Set([
            ...this.adaptedToEnvironment, 
            ...partner.adaptedToEnvironment
        ])];
        
        // Crossover de múltiplos pontos
        const genes = Object.keys(this.genes);
        const numGenes = genes.length;
        
        // Determina quantos pontos de crossover (entre 1 e 3)
        const crossoverPoints = Math.floor(random(1, 4));
        
        // Gera pontos de crossover aleatórios
        let points = [];
        for (let i = 0; i < crossoverPoints; i++) {
            points.push(Math.floor(random(1, numGenes)));
        }
        points.sort((a, b) => a - b);
        
        // Usa um pai diferente após cada ponto de crossover
        let currentParent = random() < 0.5 ? this : partner;
        
        // Cria o novo conjunto de genes
        const childGenes = {};
        
        for (let i = 0; i < numGenes; i++) {
            const gene = genes[i];
            
            // Troca de pai nos pontos de crossover
            if (points.includes(i)) {
                currentParent = currentParent === this ? partner : this;
            }
            
            if (gene === 'color') {
                // Para o gene de cor, faz crossover para cada componente RGB
                childGenes.color = {};
                
                // Para cada componente, usa 50% de chance de vir de cada pai
                const colorComponents = ['r', 'g', 'b'];
                for (let component of colorComponents) {
                    const fromParent = random() < 0.5 ? this : partner;
                    childGenes.color[component] = fromParent.genes.color[component];
                }
            } else {
                // Para outros genes, usa o pai atual
                childGenes[gene] = currentParent.genes[gene];
            }
        }
        
        // Pequena chance de especialização em um nicho ecológico
        if (random() < 0.1) {
            const possibleNiches = ['aquatic', 'terrestrial', 'aerial', 'dark', 'bright', 'hot', 'cold'];
            const newNiche = possibleNiches[Math.floor(random(0, possibleNiches.length))];
            
            if (!childDNA.adaptedToEnvironment.includes(newNiche)) {
                childDNA.adaptedToEnvironment.push(newNiche);
                
                // Especializa genes para o nicho
                this.specializeForNiche(childGenes, newNiche);
            }
        }
        
        childDNA.genes = childGenes;
        
        // Mutação depois do crossover
        childDNA.genes = childDNA.mutateGenes(childGenes);
        
        return childDNA;
    }
    
    /**
     * Especializa os genes para um nicho ecológico específico
     * @param {Object} genes - Genes a serem especializados
     * @param {string} niche - Nicho ecológico
     */
    specializeForNiche(genes, niche) {
        // Especialização baseada no nicho
        switch (niche) {
            case 'aquatic':
                genes.speed = constrain(genes.speed * 1.2, 0.5, 2.0); // Mais rápido na água
                genes.size = constrain(genes.size * 0.9, 0.6, 1.5); // Menor para hidrodinâmica
                genes.color.b += 30; // Mais azulado
                break;
                
            case 'terrestrial':
                genes.size = constrain(genes.size * 1.1, 0.6, 1.5); // Maior em terra
                genes.resourceEfficiency = constrain(genes.resourceEfficiency * 1.2, 0.5, 2.0); // Melhor uso de recursos
                break;
                
            case 'aerial':
                genes.size = constrain(genes.size * 0.8, 0.6, 1.5); // Menor para voar
                genes.speed = constrain(genes.speed * 1.3, 0.5, 2.0); // Mais rápido no ar
                break;
                
            case 'dark':
                genes.nightVision = constrain(genes.nightVision * 1.5, 0, 1); // Melhor visão no escuro
                genes.metabolism = constrain(genes.metabolism * 0.9, 0.5, 1.5); // Metabolismo mais lento
                genes.color.r -= 20; // Mais escuro
                genes.color.g -= 20;
                genes.color.b -= 20;
                break;
                
            case 'bright':
                genes.immunity = constrain(genes.immunity * 1.2, 0.5, 1.5); // Maior imunidade
                genes.color.r += 20; // Mais claro/colorido
                genes.color.g += 20;
                break;
                
            case 'hot':
                genes.resourceEfficiency = constrain(genes.resourceEfficiency * 1.3, 0.5, 2.0); // Melhor eficiência de recursos
                genes.color.r += 30; // Mais vermelho
                break;
                
            case 'cold':
                genes.metabolism = constrain(genes.metabolism * 0.8, 0.5, 1.5); // Metabolismo mais lento
                genes.color.b += 20; // Mais azulado
                break;
        }
    }
    
    /**
     * Atualiza o valor de fitness
     * @param {number} newFitness - Novo valor de fitness
     */
    updateFitness(newFitness) {
        this.fitness = newFitness;
    }

    /**
     * Retorna uma descrição dos genes
     * @returns {Object} Descrição dos genes
     */
    getDescription() {
        return {
            gene_metabolism: this.genes.metabolism.toFixed(2),
            gene_immunity: this.genes.immunity.toFixed(2),
            gene_regeneration: this.genes.regeneration.toFixed(2),
            gene_speed: this.genes.speed.toFixed(2),
            gene_size: this.genes.size.toFixed(2),
            gene_aggressiveness: this.genes.aggressiveness.toFixed(2),
            gene_sociability: this.genes.sociability.toFixed(2),
            gene_curiosity: this.genes.curiosity.toFixed(2),
            gene_fertility: this.genes.fertility.toFixed(2),
            gene_mutationRate: this.genes.mutationRate.toFixed(2),
            gene_adaptability: this.genes.adaptability.toFixed(2),
            gene_nightVision: this.genes.nightVision ? this.genes.nightVision.toFixed(2) : 'N/A',
            gene_resourceEfficiency: this.genes.resourceEfficiency ? this.genes.resourceEfficiency.toFixed(2) : 'N/A',
            gene_diseaseResistance: this.genes.diseaseResistance ? this.genes.diseaseResistance.toFixed(2) : 'N/A',
            gene_communicationLevel: this.genes.communicationLevel ? this.genes.communicationLevel.toFixed(2) : 'N/A',
            adaptedToEnvironment: this.adaptedToEnvironment.join(', ') || 'Nenhum',
            generation: this.generation
        };
    }
}

// Exporta a classe
window.DNA = DNA; 