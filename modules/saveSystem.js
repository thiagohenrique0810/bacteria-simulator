/**
 * Sistema de salvamento e carregamento de estados
 */
class SaveSystem {
    constructor() {
        this.saveKey = 'bacteria_simulator_saves';
    }

    /**
     * Salva o estado atual da simulação
     * @param {Array} bacteria - Lista de bactérias
     * @param {Array} food - Lista de comidas
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Object} stats - Estatísticas atuais
     * @returns {boolean} - Se o salvamento foi bem sucedido
     */
    saveState(bacteria, food, obstacles, stats) {
        try {
            const state = {
                timestamp: Date.now(),
                bacteria: bacteria.map(b => ({
                    position: { x: b.pos.x, y: b.pos.y },
                    dna: b.dna,
                    health: b.health,
                    energy: b.states.getEnergy(),
                    isFemale: b.isFemale
                })),
                food: food.map(f => f.serialize()),
                obstacles: obstacles.map(o => ({
                    x: o.x,
                    y: o.y,
                    w: o.w,
                    h: o.h
                })),
                stats: { ...stats }
            };

            const saves = this.getSavesList();
            saves.unshift({
                id: Date.now(),
                timestamp: Date.now(),
                state: state
            });

            // Mantém apenas os últimos 5 saves
            if (saves.length > 5) {
                saves.pop();
            }

            localStorage.setItem(this.saveKey, JSON.stringify(saves));
            return true;
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
            return false;
        }
    }

    /**
     * Carrega um estado salvo
     * @param {number} id - ID do save a ser carregado
     * @returns {Object|null} - Estado carregado ou null se falhar
     */
    loadState(id) {
        try {
            const saves = this.getSavesList();
            const save = saves.find(s => s.id === id);
            return save ? save.state : null;
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
            return null;
        }
    }

    /**
     * Retorna a lista de saves disponíveis
     * @returns {Array} - Lista de saves
     */
    getSavesList() {
        try {
            const saves = localStorage.getItem(this.saveKey);
            return saves ? JSON.parse(saves) : [];
        } catch (error) {
            console.error('Erro ao obter lista de saves:', error);
            return [];
        }
    }

    /**
     * Remove um save
     * @param {number} id - ID do save a ser removido
     * @returns {boolean} - Se a remoção foi bem sucedida
     */
    deleteSave(id) {
        try {
            let saves = this.getSavesList();
            saves = saves.filter(s => s.id !== id);
            localStorage.setItem(this.saveKey, JSON.stringify(saves));
            return true;
        } catch (error) {
            console.error('Erro ao deletar save:', error);
            return false;
        }
    }
}

// Torna a classe global
window.SaveSystem = SaveSystem; 