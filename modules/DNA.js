/**
 * Sistema genético das bactérias
 */
class DNA {
    /**
     * Inicializa o DNA
     * @param {Object} parentDNA - DNA dos pais (opcional)
     */
    constructor(parentDNA = null) {
        this.generation = parentDNA ? parentDNA.generation + 1 : 1;
        this.baseLifespan = window.simulation ? window.simulation.controls.lifespanSlider.value() * 3600 * 60 : 12 * 3600 * 60; // 12 horas em frames
        this.genes = this.initializeGenes(parentDNA);
    }

    /**
     * Inicializa os genes
     * @param {Object} parentDNA - DNA dos pais
     * @returns {Object} Genes inicializados
     */
    initializeGenes(parentDNA) {
        if (parentDNA) {
            return this.mutateGenes(parentDNA.genes);
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
            }
        };
    }

    /**
     * Aplica mutações aos genes
     * @param {Object} parentGenes - Genes dos pais
     * @returns {Object} Genes mutados
     */
    mutateGenes(parentGenes) {
        const mutatedGenes = {};
        const mutationRate = parentGenes.mutationRate;

        for (let gene in parentGenes) {
            if (gene === 'color') {
                mutatedGenes.color = {
                    r: this.mutateValue(parentGenes.color.r, -50, 50, mutationRate),
                    g: this.mutateValue(parentGenes.color.g, -50, 50, mutationRate),
                    b: this.mutateValue(parentGenes.color.b, -50, 50, mutationRate)
                };
            } else {
                const range = this.getGeneRange(gene);
                mutatedGenes[gene] = this.mutateValue(
                    parentGenes[gene],
                    range.min,
                    range.max,
                    mutationRate
                );
            }
        }

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
            adaptability: { min: 0.5, max: 1.5 }
        };

        return ranges[gene] || { min: 0, max: 1 };
    }

    /**
     * Aplica mutação a um valor
     * @param {number} value - Valor original
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @param {number} mutationRate - Taxa de mutação
     * @returns {number} Valor mutado
     */
    mutateValue(value, min, max, mutationRate) {
        if (random() < mutationRate) {
            const change = random(-0.1, 0.1);
            return constrain(value + change, min, max);
        }
        return value;
    }

    /**
     * Combina dois DNAs para criar um novo
     * @param {DNA} partner - DNA do parceiro
     * @returns {DNA} Novo DNA combinado
     */
    combine(partner) {
        const childDNA = new DNA();
        childDNA.generation = max(this.generation, partner.generation) + 1;

        for (let gene in this.genes) {
            if (gene === 'color') {
                childDNA.genes.color = {
                    r: random() < 0.5 ? this.genes.color.r : partner.genes.color.r,
                    g: random() < 0.5 ? this.genes.color.g : partner.genes.color.g,
                    b: random() < 0.5 ? this.genes.color.b : partner.genes.color.b
                };
            } else {
                childDNA.genes[gene] = random() < 0.5 ? 
                    this.genes[gene] : partner.genes[gene];
            }
        }

        return childDNA;
    }

    /**
     * Retorna uma descrição dos genes
     * @returns {Object} Descrição dos genes
     */
    getDescription() {
        return {
            generation: this.generation,
            metabolism: this.genes.metabolism.toFixed(2),
            immunity: this.genes.immunity.toFixed(2),
            regeneration: this.genes.regeneration.toFixed(2),
            speed: this.genes.speed.toFixed(2),
            size: this.genes.size.toFixed(2),
            aggressiveness: this.genes.aggressiveness.toFixed(2),
            sociability: this.genes.sociability.toFixed(2),
            curiosity: this.genes.curiosity.toFixed(2),
            fertility: this.genes.fertility.toFixed(2),
            mutationRate: this.genes.mutationRate.toFixed(3),
            adaptability: this.genes.adaptability.toFixed(2)
        };
    }

    /**
     * Aplica mutação aos genes
     * @param {number} mutationRate - Taxa de mutação
     */
    mutate(mutationRate) {
        for (let gene in this.genes) {
            if (gene === 'color') {
                this.genes.color = {
                    r: this.mutateValue(this.genes.color.r, -50, 50, mutationRate),
                    g: this.mutateValue(this.genes.color.g, -50, 50, mutationRate),
                    b: this.mutateValue(this.genes.color.b, -50, 50, mutationRate)
                };
            } else {
                const range = this.getGeneRange(gene);
                this.genes[gene] = this.mutateValue(
                    this.genes[gene],
                    range.min,
                    range.max,
                    mutationRate
                );
            }
        }
    }
}

// Tornando a classe global
window.DNA = DNA; 