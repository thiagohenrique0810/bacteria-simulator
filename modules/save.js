/**
 * Sistema de salvamento da simulação
 */
class SaveSystem {
    constructor() {
        this.saves = [];
        this.loadSaves();
    }

    /**
     * Carrega os saves do localStorage
     */
    loadSaves() {
        const savedData = localStorage.getItem('bacteriaSimSaves');
        if (savedData) {
            try {
                this.saves = JSON.parse(savedData);
            } catch (e) {
                console.error('Erro ao carregar saves:', e);
                this.saves = [];
            }
        }
    }

    /**
     * Salva o estado atual da simulação
     * @param {Array} bacteria - Lista de bactérias
     * @param {Array} food - Lista de comidas
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Object} stats - Estatísticas da simulação
     * @returns {boolean} - Se o salvamento foi bem sucedido
     */
    saveState(bacteria, food, obstacles, stats) {
        try {
            const state = {
                id: Date.now(),
                date: new Date().toISOString(),
                bacteria: bacteria.map(b => ({
                    position: { x: b.pos.x, y: b.pos.y },
                    dna: b.dna,
                    health: b.health,
                    age: b.age,
                    isFemale: b.isFemale
                })),
                food: food.map(f => ({
                    position: { x: f.position.x, y: f.position.y },
                    nutrition: f.nutrition
                })),
                obstacles: obstacles.map(o => ({
                    x: o.x,
                    y: o.y,
                    w: o.w,
                    h: o.h
                })),
                stats: { ...stats }
            };

            this.saves.push(state);
            if (this.saves.length > 5) {
                this.saves.shift(); // Mantém apenas os 5 saves mais recentes
            }

            localStorage.setItem('bacteriaSimSaves', JSON.stringify(this.saves));
            return true;
        } catch (e) {
            console.error('Erro ao salvar estado:', e);
            return false;
        }
    }

    /**
     * Carrega um estado salvo
     * @param {number} id - ID do save
     * @returns {Object|null} - Estado carregado ou null se falhar
     */
    loadState(id) {
        try {
            const state = this.saves.find(s => s.id === id);
            if (!state) return null;
            return state;
        } catch (e) {
            console.error('Erro ao carregar estado:', e);
            return null;
        }
    }

    /**
     * Obtém a lista de saves disponíveis
     * @returns {Array} - Lista de saves
     */
    getSavesList() {
        return this.saves.map(s => ({
            id: s.id,
            date: s.date,
            bacteriaCount: s.bacteria.length,
            foodCount: s.food.length
        }));
    }

    /**
     * Remove um save
     * @param {number} id - ID do save
     * @returns {boolean} - Se a remoção foi bem sucedida
     */
    deleteSave(id) {
        try {
            const index = this.saves.findIndex(s => s.id === id);
            if (index === -1) return false;
            
            this.saves.splice(index, 1);
            localStorage.setItem('bacteriaSimSaves', JSON.stringify(this.saves));
            return true;
        } catch (e) {
            console.error('Erro ao deletar save:', e);
            return false;
        }
    }
}

// Exporta a classe
window.SaveSystem = SaveSystem; 