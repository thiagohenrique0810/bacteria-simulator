/**
 * Adiciona uma bactéria ao sistema
 * @param {Bacteria} bacteria - Bactéria a ser adicionada
 */
addBacteria(bacteria) {
    try {
        // Verifica se é um objeto válido
        if (!bacteria || typeof bacteria !== 'object') {
            console.error("Tentativa de adicionar bactéria inválida:", bacteria);
            return;
        }
        
        // Verifica se a posição é válida
        if (!bacteria.pos || isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y)) {
            console.warn("Bactéria com posição inválida, corrigindo...");
            bacteria.pos = bacteria.pos || {};
            bacteria.pos.x = !isNaN(bacteria.pos.x) ? bacteria.pos.x : this.simulation.width/2;
            bacteria.pos.y = !isNaN(bacteria.pos.y) ? bacteria.pos.y : this.simulation.height/2;
        }
        
        // Garante que a bactéria tenha ID
        if (!bacteria.id) {
            bacteria.id = this.getNextEntityId();
        }
        
        // Adiciona a bactéria ao array principal
        this.bacteria.push(bacteria);
        
        // Adiciona ao sistema espacial se disponível
        if (this.spatialSystem) {
            this.spatialSystem.addEntity(bacteria);
        }
        
        // Adiciona ao simulador
        if (this.simulation) {
            // Evita adicionar novamente se já estiver no simulador
            if (!this.simulation.bacteria.includes(bacteria)) {
                this.simulation.bacteria.push(bacteria);
            }
        }
        
        // Emite evento
        if (this.eventSystem) {
            this.eventSystem.emit('bacteriaAdded', bacteria);
        }
        
        console.log(`Bactéria adicionada: ID=${bacteria.id}`);
    } catch (error) {
        console.error("Erro ao adicionar bactéria:", error);
    }
}

/**
 * Adiciona múltiplas bactérias de uma vez
 * @param {Array} bacteriaArray - Array de bactérias a serem adicionadas
 */
addMultipleBacteria(bacteriaArray) {
    if (!bacteriaArray || !Array.isArray(bacteriaArray)) {
        console.error("Array de bactérias inválido:", bacteriaArray);
        return;
    }
    
    // Filtra para garantir que só adicione objetos válidos
    const validBacteria = bacteriaArray.filter(b => b && typeof b === 'object');
    
    console.log(`Adicionando ${validBacteria.length} bactérias válidas (${bacteriaArray.length - validBacteria.length} inválidas foram ignoradas)`);
    
    // Adiciona cada bactéria válida
    for (const bacteria of validBacteria) {
        this.addBacteria(bacteria);
    }
}

/**
 * Remove uma bactéria do sistema
 * @param {Bacteria|number} bacteriaOrId - Bactéria ou ID da bactéria a ser removida
 */
removeBacteria(bacteriaOrId) {
    try {
        let id;
        let bacteria;
        
        // Identifica o ID da bactéria
        if (typeof bacteriaOrId === 'object' && bacteriaOrId !== null) {
            id = bacteriaOrId.id;
            bacteria = bacteriaOrId;
        } else if (typeof bacteriaOrId === 'number') {
            id = bacteriaOrId;
            bacteria = this.getBacteriaById(id);
        } else {
            console.error("Parâmetro inválido para removeBacteria:", bacteriaOrId);
            return;
        }
        
        // Remove do array principal
        const index = this.bacteria.findIndex(b => b && b.id === id);
        if (index !== -1) {
            this.bacteria.splice(index, 1);
        }
        
        // Remove do simulador
        if (this.simulation && this.simulation.bacteria) {
            const simIndex = this.simulation.bacteria.findIndex(b => b && b.id === id);
            if (simIndex !== -1) {
                this.simulation.bacteria.splice(simIndex, 1);
            }
        }
        
        // Remove do sistema espacial
        if (this.spatialSystem && bacteria) {
            this.spatialSystem.removeEntity(bacteria);
        }
        
        // Emite evento
        if (this.eventSystem) {
            this.eventSystem.emit('bacteriaRemoved', id);
        }
        
        console.log(`Bactéria removida: ID=${id}`);
    } catch (error) {
        console.error("Erro ao remover bactéria:", error);
    }
} 