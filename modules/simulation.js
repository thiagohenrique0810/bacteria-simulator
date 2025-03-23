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
        
        // Propriedades compatíveis com a versão antiga
        Object.defineProperties(window.Simulation.prototype, {
            // Mapeamento direto para entityManager
            'bacteria': {
                get: function() { return this.entityManager.bacteria; },
                set: function(val) { this.entityManager.bacteria = val; }
            },
            'food': {
                get: function() { return this.entityManager.food; },
                set: function(val) { this.entityManager.food = val; }
            },
            'obstacles': {
                get: function() { return this.entityManager.obstacles; },
                set: function(val) { this.entityManager.obstacles = val; }
            },
            'predators': {
                get: function() { return this.entityManager.predators; },
                set: function(val) { this.entityManager.predators = val; }
            },
            'effects': {
                get: function() { return this.entityManager.effects; },
                set: function(val) { this.entityManager.effects = val; }
            },
            
            // Mapeamento para statsManager
            'stats': {
                get: function() { return this.statsManager.stats; },
                set: function(val) { this.statsManager.stats = val; }
            },
            
            // Propriedades de controle
            'paused': {
                get: function() { return this.controlSystem.isPaused(); },
                set: function(val) { this.controlSystem.paused = val; }
            },
            'speed': {
                get: function() { return this.controlSystem.getSpeed(); },
                set: function(val) { this.controlSystem.speed = val; }
            },
            
            // Método compatível para adicionar comida
            'addFood': {
                value: function(x, y, nutrition) {
                    return this.entityManager.addFood(x, y, nutrition);
                }
            },
            
            // Método compatível com a versão antiga
            'setupControls': {
                value: function() {
                    if (this.controlSystem && typeof this.controlSystem.setupControls === 'function') {
                        this.controlSystem.setupControls();
                    }
                }
            },
            
            // Compatibilidade com isPlacingObstacle
            'isPlacingObstacle': {
                get: function() { 
                    return this.environmentSystem && this.environmentSystem.isPlacingObstacle; 
                },
                set: function(val) { 
                    if (this.environmentSystem) this.environmentSystem.isPlacingObstacle = val;
                }
            }
        });

        console.log("Propriedades de compatibilidade adicionadas com sucesso");
    }
})();
