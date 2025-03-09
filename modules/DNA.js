/**
 * Sistema de DNA e mutações para as bactérias
 */
class DNA {
    constructor(parentDNA = null) {
        // Se tiver DNA dos pais, herda com mutações
        if (parentDNA) {
            this.genes = this.inheritFromParent(parentDNA);
            this.generation = parentDNA.generation + 1;
        } else {
            // Caso contrário, cria genes aleatórios
            this.genes = this.createRandomGenes();
            this.generation = 1;
        }

        // Calcula atributos baseados nos genes
        this.calculateAttributes();
    }

    /**
     * Cria genes aleatórios para uma nova bactéria
     */
    createRandomGenes() {
        return {
            // Genes de sobrevivência
            metabolism: random(0.5, 1.5),      // Taxa de consumo de energia
            immunity: random(0.3, 0.7),        // Resistência a eventos negativos
            regeneration: random(0.2, 0.8),    // Capacidade de recuperação de saúde
            
            // Genes de comportamento
            aggression: random(0.2, 0.8),      // Influencia comportamento territorial
            sociability: random(0.3, 0.7),     // Tendência a se agrupar
            curiosity: random(0.4, 0.6),       // Tendência a explorar
            
            // Genes de movimento
            speed: random(0.5, 1.5),           // Velocidade de movimento
            agility: random(0.4, 0.6),         // Capacidade de desviar de obstáculos
            perception: random(0.6, 1.4),      // Raio de percepção
            
            // Genes de reprodução
            fertility: random(0.3, 0.7),       // Taxa de fertilidade
            matingEnergy: random(0.4, 0.6),    // Energia necessária para reprodução
            offspringSize: random(0.8, 1.2),   // Tamanho da prole
            
            // Genes de adaptação
            mutationRate: random(0.01, 0.05),  // Taxa de mutação própria
            adaptability: random(0.3, 0.7),    // Capacidade de adaptação a mudanças
            
            // Genes de aparência
            size: random(0.8, 1.2),            // Modificador de tamanho
            color: {                           // Variações de cor
                r: random(-20, 20),
                g: random(-20, 20),
                b: random(-20, 20)
            }
        };
    }

    /**
     * Herda genes dos pais com possíveis mutações
     */
    inheritFromParent(parentDNA) {
        const genes = {};
        const mutationRate = parentDNA.genes.mutationRate;
        
        // Para cada gene do pai
        for (let [key, value] of Object.entries(parentDNA.genes)) {
            if (key === 'color') {
                genes[key] = {
                    r: this.mutateValue(value.r, -20, 20, mutationRate),
                    g: this.mutateValue(value.g, -20, 20, mutationRate),
                    b: this.mutateValue(value.b, -20, 20, mutationRate)
                };
            } else if (typeof value === 'number') {
                // Define limites específicos para cada tipo de gene
                const limits = this.getGeneLimits(key);
                genes[key] = this.mutateValue(value, limits.min, limits.max, mutationRate);
            }
        }
        
        return genes;
    }

    /**
     * Retorna os limites de valores para cada tipo de gene
     */
    getGeneLimits(geneType) {
        const limits = {
            metabolism: { min: 0.3, max: 2.0 },
            immunity: { min: 0.1, max: 0.9 },
            regeneration: { min: 0.1, max: 1.0 },
            aggression: { min: 0.1, max: 0.9 },
            sociability: { min: 0.2, max: 0.8 },
            curiosity: { min: 0.2, max: 0.8 },
            speed: { min: 0.3, max: 2.0 },
            agility: { min: 0.2, max: 0.8 },
            perception: { min: 0.4, max: 2.0 },
            fertility: { min: 0.2, max: 0.8 },
            matingEnergy: { min: 0.3, max: 0.7 },
            offspringSize: { min: 0.6, max: 1.4 },
            mutationRate: { min: 0.01, max: 0.1 },
            adaptability: { min: 0.2, max: 0.8 },
            size: { min: 0.6, max: 1.4 }
        };
        
        return limits[geneType] || { min: 0, max: 1 };
    }

    /**
     * Aplica mutação a um valor numérico
     */
    mutateValue(value, min, max, mutationRate) {
        if (random() < mutationRate) {
            // Quanto maior a adaptabilidade, mais controlada é a mutação
            const adaptFactor = this.genes?.adaptability || 0.5;
            const mutationRange = (max - min) * (1 - adaptFactor);
            const mutation = random(-mutationRange, mutationRange);
            
            return constrain(value + mutation, min, max);
        }
        return value;
    }

    /**
     * Calcula atributos baseados nos genes
     */
    calculateAttributes() {
        // Tempo de vida base em frames (60fps * segundos)
        this.baseLifespan = DNA.hoursToFrames(2) * this.genes.metabolism;
        
        // Atração por comida e parceiros
        this.foodAttraction = map(this.genes.metabolism, 0.5, 1.5, 0.8, 1.2);
        this.mateAttraction = map(this.genes.fertility, 0.3, 0.7, 0.7, 1.3);
        
        // Velocidade de movimento
        this.maxSpeed = map(this.genes.speed, 0.5, 1.5, 2, 4);
        this.maxForce = map(this.genes.agility, 0.4, 0.6, 0.1, 0.2);
    }

    /**
     * Converte horas em frames (60fps)
     */
    static hoursToFrames(hours) {
        return hours * 60 * 60;
    }

    /**
     * Retorna uma descrição dos genes para debug
     */
    getDescription() {
        return {
            generation: this.generation,
            metabolism: this.genes.metabolism.toFixed(2),
            immunity: this.genes.immunity.toFixed(2),
            speed: this.genes.speed.toFixed(2),
            fertility: this.genes.fertility.toFixed(2),
            mutationRate: this.genes.mutationRate.toFixed(3)
        };
    }
}

// Tornando a classe global
window.DNA = DNA; 