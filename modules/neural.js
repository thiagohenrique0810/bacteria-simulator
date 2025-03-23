/**
 * AVISO: Este arquivo foi substituído por uma versão modularizada.
 * Os novos módulos estão na pasta modules/neural/
 * 
 * Este arquivo agora serve apenas como redirecionamento para 
 * manter compatibilidade com código existente.
 * 
 * Por favor, use os módulos separados para desenvolvimento futuro:
 * - modules/neural/ActivationFunctions.js - Funções de ativação
 * - modules/neural/Memory.js - Sistema de memória de experiências
 * - modules/neural/Evolution.js - Sistema de evolução (crossover, mutação)
 * - modules/neural/NeuralNetwork.js - Classe principal da rede neural
 * - modules/neural/index.js - Arquivo de entrada do módulo
 */

// Verifica se os novos módulos foram carregados corretamente
(function() {
    // Lista de classes que devem estar definidas
    const requiredClasses = [
        'ActivationFunctions', 
        'NeuralMemory', 
        'NeuralEvolution', 
        'NeuralNetwork'
    ];
    
    // Verifica se alguma classe está faltando
    const missingClasses = requiredClasses.filter(
        className => typeof window[className] === 'undefined'
    );
    
    // Se alguma classe estiver faltando, exibe um aviso
    if (missingClasses.length > 0) {
        console.error(`ERRO CRÍTICO: Módulos de rede neural não foram carregados corretamente!`);
        console.error(`Classes faltando: ${missingClasses.join(', ')}`);
        console.error(`Verifique se os arquivos em modules/neural/ foram incluídos no HTML na ordem correta.`);
    } else {
        console.log('Sistema neural modularizado carregado com sucesso.');
    }
})();

// Não é necessário reimplementar a classe NeuralNetwork aqui, 
// pois ela já foi definida no módulo NeuralNetwork.js 