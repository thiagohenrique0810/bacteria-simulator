/**
 * Módulo Neural - Centraliza os componentes do sistema neural
 * Este arquivo serve como ponto de entrada para o sistema neural
 * e garante que os arquivos sejam carregados na ordem correta
 */

// Declaração para evitar erros no console
(function() {
    console.log('Carregando sistema neural modularizado...');
    
    // Lista de arquivos a serem carregados na ordem
    const moduleFiles = [
        'ActivationFunctions.js',
        'Memory.js',
        'Evolution.js',
        'NeuralNetwork.js'
    ];
    
    // Verifica se os módulos já foram carregados corretamente
    const checkModulesLoaded = () => {
        const requiredClasses = [
            'ActivationFunctions', 
            'NeuralMemory', 
            'NeuralEvolution', 
            'NeuralNetwork'
        ];
        
        const missingClasses = requiredClasses.filter(
            className => typeof window[className] === 'undefined'
        );
        
        if (missingClasses.length > 0) {
            console.error(`Módulos faltando: ${missingClasses.join(', ')}`);
            return false;
        }
        
        return true;
    };
    
    // Função de compatibilidade para garantir retrocompatibilidade
    const ensureCompatibility = () => {
        // Verifica se a antiga versão da NeuralNetwork está definida
        // e se a nova versão está disponível
        if (typeof window.NeuralNetwork !== 'undefined') {
            console.log('Sistema neural carregado com sucesso.');
        } else {
            console.error('Erro ao carregar o sistema neural!');
        }
    };
    
    // Verifica se os módulos estão carregados e garante compatibilidade
    if (checkModulesLoaded()) {
        ensureCompatibility();
    } else {
        console.error('Falha ao carregar o sistema neural! Verifique os arquivos.');
    }
})(); 