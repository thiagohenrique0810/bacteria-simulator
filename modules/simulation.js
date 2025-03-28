/**
 * AVISO: Este arquivo substitui modules/simulation.js (versão legada)
 * O código foi modularizado em arquivos separados na pasta modules/simulation.
 * 
 * Este arquivo serve apenas como ponte para continuar compatível com o código existente.
 * 
 * Em vez de redefinir a classe Simulation, este arquivo apenas adiciona compatibilidade
 * entre a versão antiga e a nova versão modular.
 */

// Verificação de segurança para garantir que tudo está carregado
if (typeof window.Simulation === 'undefined') {
    console.error('A classe Simulation não foi carregada corretamente. Verifique se todos os módulos foram importados.');
    
    // Cria uma classe temporária para evitar erros
    class TemporarySimulation {
        constructor() {
            console.error('Usando versão temporária da Simulation. A aplicação não funcionará corretamente.');
            this.entityManager = { bacteria: [], food: [], obstacles: [], predators: [], effects: [] };
            this.statsManager = { stats: {} };
            this.width = 800;
            this.height = 600;
        }
        
        /**
         * Atualiza a simulação
         * @param {number} deltaTime - Tempo desde o último frame
         */
        update(deltaTime = 1) {
            try {
                // Atualiza o tempo da simulação
                this.elapsedTime = (this.elapsedTime || 0) + deltaTime;
                
                // Limpa o array de bactérias para remover entradas inválidas
                if (this.bacteria && Array.isArray(this.bacteria)) {
                    // Remove valores não-objeto ou nulos do array de bactérias
                    const invalidCount = this.bacteria.filter(b => !b || typeof b !== 'object').length;
                    if (invalidCount > 0) {
                        console.warn(`Encontradas ${invalidCount} bactérias inválidas. Limpando array...`);
                        this.bacteria = this.bacteria.filter(b => b && typeof b === 'object');
                    }
                    
                    // Verifica e corrige posições inválidas
                    for (let bacteria of this.bacteria) {
                        if (!bacteria.pos || isNaN(bacteria.pos.x) || isNaN(bacteria.pos.y)) {
                            console.warn(`Corrigindo posição da bactéria ID=${bacteria.id || 'desconhecido'}`);
                            bacteria.pos = bacteria.pos || {};
                            bacteria.pos.x = !isNaN(bacteria.pos.x) ? bacteria.pos.x : width/2;
                            bacteria.pos.y = !isNaN(bacteria.pos.y) ? bacteria.pos.y : height/2;
                        }
                    }
                }
                
                // Inicializa propriedades se não existirem
                this.obstacles = this.obstacles || [];
                this.bacteria = this.bacteria || [];
                this.predators = this.predators || [];
                
                console.log("Simulation temporária - update");
            } catch (error) {
                console.error("Erro na atualização da simulação:", error);
            }
        }
        
        draw() {
            console.log('Método draw da simulação temporária');
        }
        
        reset() {
            console.log('Método reset da simulação temporária');
        }
        
        /**
         * Encontra uma bactéria por seu ID
         * @param {number} id - ID da bactéria a ser encontrada
         * @returns {Object|null} - A bactéria encontrada ou null
         */
        findBacteriaById(id) {
            // Verifica se o ID é válido
            if (typeof id !== 'number' || isNaN(id)) {
                console.warn(`ID de bactéria inválido para busca: ${id}`);
                return null;
            }
            
            // Busca no array de bactérias da simulação
            if (Array.isArray(this.bacteria)) {
                const bacteria = this.bacteria.find(b => b && b.id === id);
                if (bacteria) return bacteria;
            }
            
            console.warn(`Bactéria com ID ${id} não encontrada`);
            return null;
        }
        
        /**
         * Corrige a posição de uma bactéria específica
         * @param {string|number} bacteriaId - ID da bactéria para corrigir
         * @param {number} newX - Novo valor para coordenada X
         * @param {number} newY - Novo valor para coordenada Y
         * @returns {boolean} - Sucesso da operação
         */
        fixBacteriaPosition(bacteriaId, newX, newY) {
            try {
                // Valida os parâmetros
                if (!bacteriaId) {
                    console.warn("fixBacteriaPosition: ID de bactéria não fornecido");
                    return false;
                }
                
                // Valida as coordenadas
                if (typeof newX !== 'number' || isNaN(newX) || !isFinite(newX) ||
                    typeof newY !== 'number' || isNaN(newY) || !isFinite(newY)) {
                    console.warn(`fixBacteriaPosition: Coordenadas inválidas para ID ${bacteriaId}: (${newX}, ${newY})`);
                    return false;
                }
                
                // Busca a bactéria na lista
                const bacteria = this.findBacteriaById(bacteriaId);
                
                if (!bacteria) {
                    console.warn(`fixBacteriaPosition: Bactéria com ID ${bacteriaId} não encontrada`);
                    return false;
                }
                
                // Corrige a posição
                if (!bacteria.pos || typeof bacteria.pos !== 'object') {
                    // Se não tiver posição, cria um novo objeto
                    bacteria.pos = { x: newX, y: newY };
                } else {
                    // Atualiza as coordenadas existentes
                    bacteria.pos.x = newX;
                    bacteria.pos.y = newY;
                }
                
                // Corrige também a velocidade se for inválida
                if (!bacteria.vel || typeof bacteria.vel !== 'object' || 
                    typeof bacteria.vel.x !== 'number' || typeof bacteria.vel.y !== 'number' ||
                    isNaN(bacteria.vel.x) || isNaN(bacteria.vel.y)) {
                    
                    // Cria uma nova velocidade aleatória
                    const angle = Math.random() * Math.PI * 2;
                    bacteria.vel = {
                        x: Math.cos(angle) * 3,
                        y: Math.sin(angle) * 3
                    };
                    
                    // Adiciona métodos de vetor se não existirem
                    if (typeof bacteria.vel.add !== 'function') {
                        bacteria.vel.add = function(v) { 
                            this.x += v.x; 
                            this.y += v.y; 
                            return this; 
                        };
                    }
                    
                    if (typeof bacteria.vel.limit !== 'function') {
                        bacteria.vel.limit = function(max) {
                            const mSq = this.x * this.x + this.y * this.y;
                            if (mSq > max * max) {
                                const norm = max / Math.sqrt(mSq);
                                this.x *= norm;
                                this.y *= norm;
                            }
                            return this;
                        };
                    }
                }
                
                console.log(`Posição da bactéria ${bacteriaId} corrigida para (${newX}, ${newY})`);
                return true;
            } catch (error) {
                console.error(`Erro ao corrigir posição da bactéria ${bacteriaId}:`, error);
                return false;
            }
        }
    }
    
    window.Simulation = TemporarySimulation;
} else {
    console.log("Compatibilidade: Simulation carregada corretamente dos módulos.");
}

// Adiciona propriedades de compatibilidade para manter código legado funcionando
// Isso é executado apenas uma vez durante o carregamento
(function adicionarCompatibilidade() {
    // Verifica se a classe já foi carregada
    if (window.Simulation && window.Simulation.prototype) {
        console.log("Adicionando propriedades de compatibilidade à Simulation");
        
        // Propriedades compatíveis com a versão antiga, com verificações de segurança
        Object.defineProperties(window.Simulation.prototype, {
            // Mapeamento direto para entityManager com verificação de existência
            'bacteria': {
                get: function() { return this.entityManager ? this.entityManager.bacteria : []; },
                set: function(val) { if (this.entityManager) this.entityManager.bacteria = val; }
            },
            'food': {
                get: function() { return this.entityManager ? this.entityManager.food : []; },
                set: function(val) { if (this.entityManager) this.entityManager.food = val; }
            },
            'obstacles': {
                get: function() { return this.entityManager ? this.entityManager.obstacles : []; },
                set: function(val) { if (this.entityManager) this.entityManager.obstacles = val; }
            },
            'predators': {
                get: function() { return this.entityManager ? this.entityManager.predators : []; },
                set: function(val) { if (this.entityManager) this.entityManager.predators = val; }
            },
            'effects': {
                get: function() { return this.entityManager ? this.entityManager.effects : []; },
                set: function(val) { if (this.entityManager) this.entityManager.effects = val; }
            },
            
            // Mapeamento para statsManager
            'stats': {
                get: function() { return this.statsManager ? this.statsManager.stats : {}; },
                set: function(val) { if (this.statsManager) this.statsManager.stats = val; }
            },
            
            // Propriedades de controle
            'paused': {
                get: function() { return this.controlSystem ? this.controlSystem.isPaused() : false; },
                set: function(val) { if (this.controlSystem) this.controlSystem.paused = val; }
            },
            'speed': {
                get: function() { return this.controlSystem ? this.controlSystem.getSpeed() : 1; },
                set: function(val) { if (this.controlSystem) this.controlSystem.speed = val; }
            },
            
            // Atalhos para controles
            'populationLimit': {
                get: function() { 
                    return this.entityManager ? this.entityManager.populationLimit : 50; 
                },
                set: function(val) { 
                    if (this.entityManager) this.entityManager.populationLimit = val; 
                }
            },
            
            // Compatibilidade com isPlacingObstacle
            'isPlacingObstacle': {
                get: function() { 
                    return this.environmentSystem ? this.environmentSystem.isPlacingObstacle : false; 
                },
                set: function(val) { 
                    if (this.environmentSystem) this.environmentSystem.isPlacingObstacle = val;
                }
            },
            
            // Método compatível para adicionar comida
            'addFood': {
                value: function(x, y, nutrition) {
                    return this.entityManager && typeof this.entityManager.addFood === 'function' ? 
                           this.entityManager.addFood(x, y, nutrition) : null;
                }
            },
            
            // Método compatível com a versão antiga
            'setupControls': {
                value: function() {
                    if (this.controlSystem && typeof this.controlSystem.setupControls === 'function') {
                        this.controlSystem.setupControls();
                    }
                }
            }
        });
        
        console.log("Propriedades de compatibilidade adicionadas com sucesso");
    }
})();

/**
 * Compatibilidade para versões antigas
 * Permite acessar bacteria, food, etc. diretamente através da simulação
 */
function addCompatibilityLayer(simulation) {
    Object.defineProperties(simulation, {
        // Mapeamento para entityManager
        'bacteria': {
            get: function() { return this.entityManager ? this.entityManager.bacteria : []; },
            set: function(val) { if (this.entityManager) this.entityManager.bacteria = val; }
        },
        'food': {
            get: function() { return this.entityManager ? this.entityManager.food : []; },
            set: function(val) { if (this.entityManager) this.entityManager.food = val; }
        },
        'obstacles': {
            get: function() { return this.entityManager ? this.entityManager.obstacles : []; },
            set: function(val) { if (this.entityManager) this.entityManager.obstacles = val; }
        },
        'predators': {
            get: function() { return this.entityManager ? this.entityManager.predators : []; },
            set: function(val) { if (this.entityManager) this.entityManager.predators = val; }
        },
        'effects': {
            get: function() { return this.entityManager ? this.entityManager.effects : []; },
            set: function(val) { if (this.entityManager) this.entityManager.effects = val; }
        },
        
        // Mapeamento para statsManager
        'stats': {
            get: function() { return this.statsManager ? this.statsManager.stats : {}; },
            set: function(val) { if (this.statsManager) this.statsManager.stats = val; }
        },
        
        // Atalhos para controles
        'populationLimit': {
            get: function() { 
                return this.entityManager ? this.entityManager.populationLimit : 50; 
            },
            set: function(val) { 
                if (this.entityManager) this.entityManager.populationLimit = val; 
            }
        }
    });
}
