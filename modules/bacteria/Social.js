/**
 * Classe responsável pelas interações sociais da bactéria
 */
class BacteriaSocial {
    /**
     * Inicializa o módulo social
     * @param {BacteriaBase} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        
        // Atributos de comunicação e relacionamentos
        this.communicationId = null;    // ID único para comunicação
        this.lastCommunication = 0;     // Último frame em que se comunicou
        this.communicationCooldown = 60;  // Frames de espera entre comunicações
        this.friendships = new Map();     // Mapa de amizades
        this.enemies = new Map();         // Mapa de inimizades
        this.communityRole = this.determineCommunityRole(); // Papel na comunidade
    }
    
    /**
     * Determina o papel da bactéria na comunidade baseado em seus genes
     * @returns {string} - Papel na comunidade
     */
    determineCommunityRole() {
        const roles = [
            { name: 'explorador', threshold: 0.7, gene: 'curiosity' },
            { name: 'protetor', threshold: 0.7, gene: 'aggressiveness' },
            { name: 'comunicador', threshold: 0.7, gene: 'sociability' },
            { name: 'reprodutor', threshold: 0.7, gene: 'fertility' },
            { name: 'sobrevivente', threshold: 0.7, gene: 'immunity' }
        ];
        
        for (const role of roles) {
            if (this.bacteria.dna.genes[role.gene] >= role.threshold) {
                return role.name;
            }
        }
        
        return 'comum'; // Papel padrão
    }
    
    /**
     * Obtém um ID para a bactéria
     * @param {Bacteria} bacteria - Bactéria
     * @returns {number} - ID da bactéria
     */
    getBacteriaId(bacteria) {
        // Verifica se o parâmetro é válido
        if (!bacteria) return 0;
        
        // Usa o ID da bactéria se já estiver definido
        if (bacteria.id) {
            return bacteria.id;
        }
        
        // Usa o communicationId se existir
        if (bacteria.communicationId) {
            return bacteria.communicationId;
        }
        
        try {
            // Tenta usar o índice no array de simulação
            const index = window.simulation?.bacteria?.indexOf(bacteria);
            if (index !== undefined && index >= 0) {
                // Atribui o ID à bactéria para referência futura
                bacteria.communicationId = index + 1;
                return bacteria.communicationId;
            }
        } catch (error) {
            console.error("Erro ao obter ID da bactéria:", error);
        }
        
        // Se tudo falhar, usa um ID aleatório
        bacteria.communicationId = Math.floor(Math.random() * 10000) + 1000;
        return bacteria.communicationId;
    }
    
    /**
     * Adiciona uma bactéria como amiga
     * @param {Bacteria} bacteria - Bactéria amiga
     * @param {number} level - Nível de amizade (1-10)
     */
    addFriend(bacteria, level = 5) {
        const id = this.getBacteriaId(bacteria);
        this.friendships.set(id, {
            level: level,
            since: frameCount
        });
        
        // Remove da lista de inimigos se existir
        if (this.enemies.has(id)) {
            this.enemies.delete(id);
        }
    }
    
    /**
     * Adiciona uma bactéria como inimiga
     * @param {Bacteria} bacteria - Bactéria inimiga
     * @param {number} level - Nível de inimizade (1-10)
     */
    addEnemy(bacteria, level = 5) {
        const id = this.getBacteriaId(bacteria);
        this.enemies.set(id, {
            level: level,
            since: frameCount
        });
        
        // Remove da lista de amigos se existir
        if (this.friendships.has(id)) {
            this.friendships.delete(id);
        }
    }
    
    /**
     * Verifica se outra bactéria é amiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é amiga
     */
    isFriend(bacteria) {
        const id = this.getBacteriaId(bacteria);
        return this.friendships.has(id);
    }
    
    /**
     * Verifica se outra bactéria é inimiga
     * @param {Bacteria} bacteria - Bactéria a verificar
     * @returns {boolean} - Se é inimiga
     */
    isEnemy(bacteria) {
        const id = this.getBacteriaId(bacteria);
        return this.enemies.has(id);
    }
    
    /**
     * Processa interações sociais com outras bactérias
     * @param {Array} bacteria - Array de bactérias
     * @returns {boolean} - Se houve interação social
     */
    processInteractions(bacteria) {
        if (!Array.isArray(bacteria) || bacteria.length === 0) {
            return false;
        }
        
        // Limita freqüência de comunicação
        if (frameCount - this.lastCommunication < this.communicationCooldown) {
            return false;
        }
        
        // Filtra bactérias próximas
        const nearbyBacteria = bacteria.filter(b => {
            if (b === this.bacteria) return false;
            
            const distance = dist(this.bacteria.pos.x, this.bacteria.pos.y, b.pos.x, b.pos.y);
            return distance <= this.bacteria.perceptionRadius;
        });
        
        if (nearbyBacteria.length === 0) {
            return false;
        }
        
        // Chance de iniciar comunicação baseada na sociabilidade
        const sociability = this.bacteria.dna.genes.sociability || 0.5;
        const communicationChance = 0.005 * sociability;
        
        if (random() < communicationChance) {
            // Escolhe uma bactéria aleatória para interagir
            const target = nearbyBacteria[Math.floor(random(nearbyBacteria.length))];
            
            // Determina tipo de interação baseado na personalidade
            const aggressiveness = this.bacteria.dna.genes.aggressiveness || 0.5;
            
            if (this.isFriend(target)) {
                // Intensifica amizade
                const currentFriendship = this.friendships.get(this.getBacteriaId(target));
                const newLevel = Math.min(10, currentFriendship.level + random(0.5, 1.5));
                this.addFriend(target, newLevel);
                this.lastCommunication = frameCount;
                return true;
            } else if (this.isEnemy(target)) {
                // Chance de reconciliação baseada em sociabilidade
                if (random() < sociability * 0.2) {
                    this.addFriend(target, 1);
                    this.lastCommunication = frameCount;
                    return true;
                }
            } else {
                // Nova interação - amigo ou inimigo?
                if (random() < aggressiveness) {
                    this.addEnemy(target, random(1, 3));
                } else {
                    this.addFriend(target, random(1, 3));
                }
                this.lastCommunication = frameCount;
                return true;
            }
        }
        
        return false;
    }
}

// Exporta a classe para uso global
window.BacteriaSocial = BacteriaSocial; 