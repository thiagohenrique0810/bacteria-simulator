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
        this.pregnancyDuration = 300; // 5 segundos
        this.matingCooldown = 0;
        this.matingCooldownTime = 600; // 10 segundos
        this.courtingTime = 0;
        this.courtingDuration = 120; // 2 segundos
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
     * @returns {DNA|null} DNA do filho se nasceu
     */
    update() {
        // Atualiza cooldown de acasalamento
        if (this.matingCooldown > 0) {
            this.matingCooldown--;
        }

        // Atualiza tempo de cortejo
        if (this.courtingTime > 0) {
            this.courtingTime--;
        }

        // Se estiver grávida, atualiza gravidez
        if (this.isPregnant) {
            this.pregnancyTime++;

            // Verifica se é hora de dar à luz
            if (this.pregnancyTime >= this.pregnancyDuration) {
                return this.giveBirth();
            }
        }

        return null;
    }

    /**
     * Verifica se pode acasalar agora
     * @returns {boolean} Se pode acasalar
     */
    canMateNow() {
        return !this.isPregnant && 
               this.matingCooldown <= 0 && 
               this.courtingTime <= 0;
    }

    /**
     * Verifica se está em período de recuperação
     * @returns {boolean} Se está em recuperação
     */
    isInMatingRecovery() {
        return this.matingCooldown > 0;
    }

    /**
     * Verifica se está em cortejo
     * @returns {boolean} Se está em cortejo
     */
    isCourting() {
        return this.courtingTime > 0;
    }

    /**
     * Inicia o cortejo
     */
    startCourting() {
        this.courtingTime = this.courtingDuration;
    }

    /**
     * Tenta acasalar com outro sistema reprodutivo
     * @param {Reproduction} other - Outro sistema reprodutivo
     * @returns {boolean} Se o acasalamento foi bem sucedido
     */
    mate(other) {
        // Verifica se podem acasalar
        if (!this.canMateNow() || !other.canMateNow()) {
            return false;
        }

        // Verifica se são de sexos opostos
        if (this.isFemale === other.isFemale) {
            return false;
        }

        // Inicia cortejo
        this.startCourting();
        other.startCourting();

        // Se ambos estiverem em cortejo
        if (this.isCourting() && other.isCourting()) {
            // Define quem será a mãe
            const mother = this.isFemale ? this : other;
            const father = this.isFemale ? other : this;

            // Inicia gravidez
            mother.startPregnancy(father.dna);

            // Aplica cooldown em ambos
            this.matingCooldown = this.matingCooldownTime;
            other.matingCooldown = other.matingCooldownTime;

            return true;
        }

        return false;
    }

    /**
     * Inicia uma gravidez
     * @param {DNA} partnerDNA - DNA do parceiro
     */
    startPregnancy(partnerDNA) {
        this.isPregnant = true;
        this.pregnancyTime = 0;
        this.partnerDNA = partnerDNA;
    }

    /**
     * Realiza o nascimento
     * @returns {DNA} DNA do filho
     */
    giveBirth() {
        // Cria DNA do filho
        let childDNA = new DNA();
        childDNA.generation = Math.max(this.dna.generation, this.partnerDNA.generation) + 1;

        // Combina genes dos pais
        for (let gene in this.dna.genes) {
            if (gene === 'color') {
                childDNA.genes.color = {
                    r: random() < 0.5 ? this.dna.genes.color.r : this.partnerDNA.genes.color.r,
                    g: random() < 0.5 ? this.dna.genes.color.g : this.partnerDNA.genes.color.g,
                    b: random() < 0.5 ? this.dna.genes.color.b : this.partnerDNA.genes.color.b
                };
            } else {
                childDNA.genes[gene] = random() < 0.5 ? 
                    this.dna.genes[gene] : this.partnerDNA.genes[gene];
            }
        }

        // Reseta estado
        this.isPregnant = false;
        this.pregnancyTime = 0;
        this.partnerDNA = null;

        return childDNA;
    }
}

// Tornando a classe global
window.Reproduction = Reproduction; 