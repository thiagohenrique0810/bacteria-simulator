/**
 * Sistema de salvamento para a simulação
 */
class SaveSystem {
    /**
     * Inicializa o sistema de salvamento
     */
    constructor() {
        this.KEY_PREFIX = 'bacteria_sim_';
        this.MAX_SAVES = 10;
        this.loadSavesList();
    }

    /**
     * Carrega a lista de saves do localStorage
     */
    loadSavesList() {
        this.savesList = JSON.parse(localStorage.getItem(this.KEY_PREFIX + 'saves_list') || '[]');
    }

    /**
     * Salva a lista de saves no localStorage
     */
    saveSavesList() {
        localStorage.setItem(this.KEY_PREFIX + 'saves_list', JSON.stringify(this.savesList));
    }

    /**
     * Salva o estado atual da simulação
     * @param {Array} bacteria - Lista de bactérias
     * @param {Array} food - Lista de comida
     * @param {Array} obstacles - Lista de obstáculos
     * @param {Object} stats - Estatísticas da simulação
     * @returns {boolean} - Se o salvamento foi bem sucedido
     */
    saveState(bacteria, food, obstacles, stats) {
        try {
            // Cria identificador único para o save
            const saveId = Date.now().toString();
            
            // Prepara os dados para salvar
            const saveData = {
                timestamp: Date.now(),
                bacteria: bacteria.map(b => ({
                    position: { x: b.pos.x, y: b.pos.y },
                    health: b.health,
                    dna: b.dna.genes,
                    generation: b.dna.generation,
                    isFemale: b.reproduction.isFemale
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
                stats: {
                    ...stats,
                    savedAt: Date.now()
                }
            };

            // Salva os dados
            localStorage.setItem(this.KEY_PREFIX + saveId, JSON.stringify(saveData));

            // Atualiza a lista de saves
            this.savesList.push({
                id: saveId,
                timestamp: saveData.timestamp,
                generation: stats.generation,
                bacteriaCount: bacteria.length
            });

            // Mantém apenas os últimos MAX_SAVES
            while (this.savesList.length > this.MAX_SAVES) {
                const oldestSave = this.savesList.shift();
                localStorage.removeItem(this.KEY_PREFIX + oldestSave.id);
            }

            // Salva a lista atualizada
            this.saveSavesList();

            return true;
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
            return false;
        }
    }

    /**
     * Carrega um estado salvo
     * @param {string} saveId - ID do save a ser carregado
     * @returns {Object|null} - Estado carregado ou null se houver erro
     */
    loadState(saveId) {
        try {
            const saveData = localStorage.getItem(this.KEY_PREFIX + saveId);
            if (!saveData) return null;

            const state = JSON.parse(saveData);

            // Recria as instâncias das classes
            return {
                bacteria: state.bacteria.map(b => ({
                    ...b,
                    dna: new DNA(null, b.dna),
                    position: createVector(b.position.x, b.position.y)
                })),
                food: state.food.map(f => ({
                    ...f,
                    position: createVector(f.position.x, f.position.y)
                })),
                obstacles: state.obstacles,
                stats: state.stats
            };
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
        return this.savesList;
    }

    /**
     * Remove um save específico
     * @param {string} saveId - ID do save a ser removido
     * @returns {boolean} - Se a remoção foi bem sucedida
     */
    deleteSave(saveId) {
        try {
            // Remove do localStorage
            localStorage.removeItem(this.KEY_PREFIX + saveId);

            // Remove da lista
            this.savesList = this.savesList.filter(save => save.id !== saveId);
            this.saveSavesList();

            return true;
        } catch (error) {
            console.error('Erro ao deletar save:', error);
            return false;
        }
    }

    /**
     * Remove todos os saves
     * @returns {boolean} - Se a limpeza foi bem sucedida
     */
    clearAllSaves() {
        try {
            // Remove todos os saves do localStorage
            this.savesList.forEach(save => {
                localStorage.removeItem(this.KEY_PREFIX + save.id);
            });

            // Limpa a lista
            this.savesList = [];
            this.saveSavesList();

            return true;
        } catch (error) {
            console.error('Erro ao limpar saves:', error);
            return false;
        }
    }

    /**
     * Exporta um save para arquivo
     * @param {string} saveId - ID do save a ser exportado
     * @returns {Object|null} - Dados do save ou null se houver erro
     */
    exportSave(saveId) {
        try {
            const saveData = localStorage.getItem(this.KEY_PREFIX + saveId);
            if (!saveData) return null;

            return {
                id: saveId,
                data: JSON.parse(saveData)
            };
        } catch (error) {
            console.error('Erro ao exportar save:', error);
            return null;
        }
    }

    /**
     * Importa um save de arquivo
     * @param {Object} saveData - Dados do save a ser importado
     * @returns {boolean} - Se a importação foi bem sucedida
     */
    importSave(saveData) {
        try {
            if (!saveData || !saveData.id || !saveData.data) return false;

            // Salva os dados
            localStorage.setItem(
                this.KEY_PREFIX + saveData.id,
                JSON.stringify(saveData.data)
            );

            // Atualiza a lista de saves
            const saveInfo = {
                id: saveData.id,
                timestamp: saveData.data.timestamp,
                generation: saveData.data.stats.generation,
                bacteriaCount: saveData.data.bacteria.length
            };

            // Adiciona apenas se não existir
            if (!this.savesList.find(save => save.id === saveInfo.id)) {
                this.savesList.push(saveInfo);
                this.saveSavesList();
            }

            return true;
        } catch (error) {
            console.error('Erro ao importar save:', error);
            return false;
        }
    }
}

// Tornando a classe global
window.SaveSystem = SaveSystem; 