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
        update() {}
        draw() {}
        reset() {}
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
