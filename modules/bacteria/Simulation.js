/**
 * Adiciona uma bactéria à simulação
 * @param {Bacteria} bacteria - Bactéria a ser adicionada
 */
addBacteria(bacteria) {
    // Verifica se a bactéria é um objeto válido antes de adicionar
    if (!bacteria || typeof bacteria !== 'object') {
        console.error("Tentativa de adicionar bactéria inválida:", bacteria);
        return;
    }
    
    // Verifica se a bactéria já possui ID
    if (!bacteria.id) {
        bacteria.id = this.getNextBacteriaId();
    }
    
    // Garante que a bactéria tenha uma posição válida
    if (!bacteria.pos || isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y)) {
        console.warn("Corrigindo posição da bactéria ao adicionar");
        bacteria.pos = bacteria.pos || {};
        bacteria.pos.x = !isNaN(bacteria.pos.x) ? bacteria.pos.x : width/2;
        bacteria.pos.y = !isNaN(bacteria.pos.y) ? bacteria.pos.y : height/2;
    }
    
    // Adiciona a bactéria ao array
    this.bacteria.push(bacteria);
    
    // Configura a referência à simulação na bactéria
    bacteria.simulation = this;
    
    // Adiciona a entidade ao gerenciador espacial
    if (this.spatialGrid) {
        this.spatialGrid.addEntity(bacteria);
    }
}

/**
 * Remove uma bactéria da simulação
 * @param {Bacteria|number} bacteriaOrId - Bactéria ou ID da bactéria a ser removida
 */
removeBacteria(bacteriaOrId) {
    let id;
    
    // Identifica o ID da bactéria
    if (typeof bacteriaOrId === 'object' && bacteriaOrId !== null) {
        id = bacteriaOrId.id;
    } else if (typeof bacteriaOrId === 'number') {
        id = bacteriaOrId;
    } else {
        console.error("Parâmetro inválido para removeBacteria:", bacteriaOrId);
        return;
    }
    
    // Encontra o índice da bactéria pelo ID
    const index = this.bacteria.findIndex(b => b && b.id === id);
    
    if (index !== -1) {
        const bacteria = this.bacteria[index];
        
        // Remove do grid espacial
        if (this.spatialGrid && bacteria) {
            this.spatialGrid.removeEntity(bacteria);
        }
        
        // Remove do array
        this.bacteria.splice(index, 1);
    } else {
        console.warn(`Bactéria com ID ${id} não encontrada para remoção`);
    }
}

/**
 * Filtra bactérias inválidas do array
 */
cleanBacteriaArray() {
    // Identifica bactérias inválidas
    const invalidBacteria = this.bacteria.filter(b => 
        !b || typeof b !== 'object' || !b.pos || isNaN(b.pos.x) || isNaN(b.pos.y)
    );
    
    if (invalidBacteria.length > 0) {
        console.warn(`Removendo ${invalidBacteria.length} bactérias inválidas`);
        
        // Filtra o array para manter apenas bactérias válidas
        this.bacteria = this.bacteria.filter(b => 
            b && typeof b === 'object' && b.pos && !isNaN(b.pos.x) && !isNaN(b.pos.y)
        );
    }
}

/**
 * Obtém o próximo ID disponível para bactérias
 * @returns {number} - ID único
 */
getNextBacteriaId() {
    this.lastBacteriaId = (this.lastBacteriaId || 0) + 1;
    return this.lastBacteriaId;
} 