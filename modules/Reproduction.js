/**
 * Sistema de reprodução das bactérias
 */
class Reproduction {
    /**
     * Inicializa o sistema de reprodução
     * @param {boolean} isFemale - Se é fêmea
     */
    constructor(isFemale) {
        this.isFemale = isFemale;
        this.isPregnant = false;
        this.pregnancyTime = 0;
        this.pregnancyDuration = 180; // 3 segundos
        this.matingCooldown = 0;
        this.matingCooldownDuration = 300; // 5 segundos
        this.courtingTime = 0;
        this.courtingDuration = 60; // 1 segundo
        this.isCourting = false;
        this.dna = null;
        this.partnerDNA = null;
    }

    /**
     * Define o DNA da bactéria
     * @param {DNA} dna - DNA da bactéria
     */
    setDNA(dna) {
        this.dna = dna;
    }

    /**
     * Atualiza o sistema de reprodução
     * @returns {DNA|null} - DNA do filho se houver nascimento
     */
    update() {
        // Atualiza cooldown de acasalamento
        if (this.matingCooldown > 0) {
            this.matingCooldown--;
        }

        // Atualiza tempo de cortejo
        if (this.isCourting) {
            this.courtingTime++;
            if (this.courtingTime >= this.courtingDuration) {
                this.isCourting = false;
                this.courtingTime = 0;
            }
        }

        // Se estiver grávida, atualiza gravidez
        if (this.isPregnant) {
            this.pregnancyTime++;
            
            // Verifica se é hora do nascimento
            if (this.pregnancyTime >= this.pregnancyDuration) {
                this.isPregnant = false;
                this.pregnancyTime = 0;
                
                // Combina DNA dos pais para criar filho
                let childDNA = this.createChildDNA();
                this.partnerDNA = null;
                
                // Inicia cooldown de acasalamento
                this.matingCooldown = this.matingCooldownDuration;
                
                return childDNA;
            }
        }

        return null;
    }

    /**
     * Tenta acasalar com outro sistema de reprodução
     * @param {Reproduction} other - Sistema de reprodução do parceiro
     * @returns {boolean} - Se o acasalamento foi bem sucedido
     */
    mate(other) {
        // Verifica se podem acasalar
        if (!this.canMateWith(other)) return false;

        // Inicia cortejo
        this.isCourting = true;
        other.isCourting = true;

        // Se for fêmea, inicia gravidez
        if (this.isFemale) {
            this.isPregnant = true;
            this.pregnancyTime = 0;
            this.partnerDNA = other.dna;
        }

        // Inicia cooldown para ambos
        this.matingCooldown = this.matingCooldownDuration;
        other.matingCooldown = other.matingCooldownDuration;

        return true;
    }

    /**
     * Verifica se pode acasalar com outro sistema de reprodução
     * @param {Reproduction} other - Sistema de reprodução do parceiro
     * @returns {boolean} - Se podem acasalar
     */
    canMateWith(other) {
        return (
            this.isFemale !== other.isFemale &&
            this.canMateNow() &&
            other.canMateNow() &&
            !this.isPregnant &&
            !other.isPregnant
        );
    }

    /**
     * Verifica se pode acasalar no momento
     * @returns {boolean} - Se pode acasalar
     */
    canMateNow() {
        return !this.isInMatingRecovery() && !this.isPregnant && !this.isCourting;
    }

    /**
     * Verifica se está em período de recuperação de acasalamento
     * @returns {boolean} - Se está em recuperação
     */
    isInMatingRecovery() {
        return this.matingCooldown > 0;
    }

    /**
     * Cria DNA para um novo filho
     * @returns {DNA} - DNA do filho
     */
    createChildDNA() {
        // Combina genes dos pais
        let parentGenes = [this.dna.genes, this.partnerDNA.genes];
        let childGenes = {};

        // Para cada característica, escolhe aleatoriamente de um dos pais
        for (let key in parentGenes[0]) {
            if (key === 'color') {
                childGenes[key] = {
                    r: random([parentGenes[0][key].r, parentGenes[1][key].r]),
                    g: random([parentGenes[0][key].g, parentGenes[1][key].g]),
                    b: random([parentGenes[0][key].b, parentGenes[1][key].b])
                };
            } else {
                // Média dos valores dos pais com pequena variação
                let avg = (parentGenes[0][key] + parentGenes[1][key]) / 2;
                childGenes[key] = avg + random(-0.1, 0.1);
            }
        }

        // Cria novo DNA com os genes combinados
        let childDNA = new DNA();
        childDNA.genes = childGenes;
        childDNA.generation = Math.max(this.dna.generation, this.partnerDNA.generation) + 1;

        return childDNA;
    }
}

// Tornando a classe global
window.Reproduction = Reproduction; 