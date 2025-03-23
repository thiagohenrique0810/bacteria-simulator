/**
 * Inicialização do sistema de comunicação entre bactérias
 * Este script carrega todos os componentes na ordem correta
 */

(function() {
    // Lista de arquivos que compõem o sistema de comunicação em ordem de dependência
    const communicationModules = [
        // Dependências do sistema neural
        'modules/neural/ActivationFunctions.js',
        'modules/neural/Memory.js',
        'modules/neural/Evolution.js',
        'modules/neural/NeuralNetwork.js',
        
        // Utilitários e componentes básicos
        'modules/communication/CommunicationUtils.js',
        'modules/communication/CommunicationInterface.js',
        
        // Componentes de comunicação
        'modules/communication/MessageGenerator.js',
        'modules/communication/MessageManager.js',
        'modules/communication/RelationshipManager.js',
        'modules/communication/CommunicationSystem.js',
        
        // Sistema de comunicação neural
        'modules/communication/NeuralCommunication.js',
        
        // Integrações
        'modules/communication/index.js'
    ];
    
    // Contador de módulos carregados
    let loadedModules = 0;
    
    /**
     * Carrega um script JavaScript dinamicamente
     * @param {string} url - URL do script a ser carregado
     * @param {Function} callback - Função chamada após o carregamento
     */
    function loadScript(url, callback) {
        // Verifica se o script já foi carregado
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            console.log(`Script ${url} já carregado.`);
            callback();
            return;
        }
        
        // Cria um novo elemento de script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        
        // Define handlers para eventos
        script.onload = script.onreadystatechange = function() {
            if (!this.readyState || 
                this.readyState === 'loaded' || 
                this.readyState === 'complete') {
                
                // Limpa o manipulador de eventos
                script.onload = script.onreadystatechange = null;
                console.log(`Carregado: ${url}`);
                callback();
            }
        };
        
        script.onerror = function() {
            console.error(`Erro ao carregar o script: ${url}`);
            callback(new Error(`Falha ao carregar ${url}`));
        };
        
        // Adiciona o script ao documento
        document.head.appendChild(script);
    }
    
    /**
     * Carrega os scripts em sequência
     * @param {Array} scripts - Lista de URLs dos scripts
     * @param {number} index - Índice atual na lista de scripts
     */
    function loadScriptsSequentially(scripts, index = 0) {
        if (index >= scripts.length) {
            initializeCommunicationSystem();
            return;
        }
        
        loadScript(scripts[index], function(error) {
            if (error) {
                console.error(`Erro ao carregar módulo: ${scripts[index]}`, error);
            } else {
                loadedModules++;
                console.log(`Progresso: ${loadedModules}/${scripts.length} módulos`);
            }
            
            // Carrega o próximo script independentemente de erro
            loadScriptsSequentially(scripts, index + 1);
        });
    }
    
    /**
     * Inicializa o sistema de comunicação após o carregamento de todos os scripts
     */
    function initializeCommunicationSystem() {
        console.log("Inicializando sistema de comunicação...");
        
        try {
            // Verifica se todos os componentes necessários estão disponíveis
            if (!window.CommunicationSystem || 
                !window.MessageManager || 
                !window.RelationshipManager || 
                !window.MessageGenerator || 
                !window.CommunicationUtils || 
                !window.CommunicationInterface) {
                throw new Error("Componentes básicos do sistema de comunicação não foram carregados corretamente.");
            }
            
            console.log("Componentes básicos verificados com sucesso.");
            
            // Verifica o componente neural
            const hasNeuralComponent = window.NeuralCommunication !== undefined;
            console.log(`Sistema de comunicação neural: ${hasNeuralComponent ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`);
            
            // Verifica se o objeto de simulação está disponível
            if (!window.simulation) {
                console.warn("Objeto simulation não encontrado. O sistema de comunicação não será inicializado.");
                return;
            }
            
            // Inicializa o sistema de comunicação se ainda não estiver inicializado
            if (!window.bacteria_communication) {
                console.log("Criando instância do sistema de comunicação...");
                window.bacteria_communication = new BacteriaCommunication(window.simulation);
                
                // Adiciona o sistema de comunicação à simulação
                window.simulation.communicationSystem = window.bacteria_communication;
            }
            
            console.log("Sistema de comunicação inicializado com sucesso!");
            
            // Adiciona hook para atualização a cada frame no sistema de simulação
            if (window.simulation.addUpdateHook) {
                window.simulation.addUpdateHook('communication', () => {
                    if (window.bacteria_communication) {
                        window.bacteria_communication.update();
                    }
                });
                console.log("Hook de atualização adicionado à simulação");
            }
        } catch (error) {
            console.error("Erro ao inicializar o sistema de comunicação:", error);
        }
    }
    
    // Inicia o carregamento dos scripts em sequência
    loadScriptsSequentially(communicationModules);
})(); 