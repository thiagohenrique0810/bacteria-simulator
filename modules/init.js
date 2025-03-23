/**
 * Arquivo de inicialização para garantir carregamento correto de dependências
 */

console.log("Inicializando sistema...");

// Garante que window.simulation exista para evitar erros durante a inicialização
window.simulation = window.simulation || {
    controls: {
        callbacks: {},
        getState: () => ({}),
        initialized: false
    },
    addMultipleBacteria: (count, femaleRatio) => {
        console.log("[Stub] Tentativa de adicionar bactérias:", count, femaleRatio);
    }
};

// Define callback padrão para adicionar bactérias
window.registerAddBacteriaCallback = function() {
    console.log("Registrando callback para adicionar bactérias");
    if (window.simulation && window.simulation.controls) {
        const callbacks = window.simulation.controls.callbacks || {};
        window.simulation.controls.callbacks = {
            ...callbacks,
            onAddBacteria: (count, femaleRatio) => {
                console.log("Callback onAddBacteria chamado:", count, femaleRatio);
                if (window.simulation && window.simulation.addMultipleBacteria) {
                    try {
                        window.simulation.addMultipleBacteria(Number(count), Number(femaleRatio));
                    } catch (error) {
                        console.error("Erro ao adicionar bactérias:", error);
                    }
                } else {
                    console.error("Método addMultipleBacteria não está disponível");
                }
            }
        };
        console.log("Callback registrado com sucesso");
    } else {
        console.error("simulation.controls não está disponível para registrar callback");
    }
};

// Registra o callback imediatamente
window.registerAddBacteriaCallback();

// Registra novamente após 1 segundo para garantir
setTimeout(window.registerAddBacteriaCallback, 1000);

// Registra novamente após 3 segundos (após tudo estar carregado)
setTimeout(window.registerAddBacteriaCallback, 3000);

console.log("Sistema inicializado"); 