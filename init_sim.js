/**
 * Script de inicialização manual da simulação
 * Este script é executado pelo console ou pelo botão para garantir
 * que todos os callbacks e event listeners sejam configurados corretamente
 */

function initializeSimulation() {
    console.log("🚀 Inicializando simulação manualmente...");
    
    try {
        // Verificar se a simulação global existe
        if (!window.simulation) {
            console.error("❌ ERRO: Simulação global não encontrada");
            return false;
        }
        
        // Verificar componentes críticos
        const simulation = window.simulation;
        
        if (!simulation.entityManager) {
            console.error("❌ ERRO: EntityManager não encontrado");
            return false;
        }
        
        if (!simulation.controlSystem) {
            console.error("❌ ERRO: ControlSystem não encontrado");
            return false;
        }
        
        // Forçar inicialização completa
        if (typeof simulation.postInitialize === 'function') {
            console.log("🔄 Chamando postInitialize para configurar callbacks e event listeners");
            simulation.postInitialize();
        }
        
        // Garantir que o método addMultipleBacteria está disponível
        if (typeof simulation.entityManager.addMultipleBacteria !== 'function') {
            console.warn("⚠️ Método addMultipleBacteria não encontrado, criando...");
            
            // Implementar método alternativo
            simulation.entityManager.addMultipleBacteria = function(count, femaleRatio) {
                console.log(`🔄 Método temporário addMultipleBacteria chamado: ${count} bactérias, ${femaleRatio}% fêmeas`);
                
                try {
                    // Inicializar array de bactérias se não existir
                    this.bacteria = this.bacteria || [];
                    
                    // Ajustar valores
                    count = Math.max(1, Math.min(100, count));
                    femaleRatio = Math.max(0, Math.min(100, femaleRatio));
                    
                    // Calcular número de fêmeas
                    const femaleCount = Math.round(count * (femaleRatio / 100));
                    console.log(`📊 Fêmeas a criar: ${femaleCount} de ${count}`);
                    
                    // Armazenar quantidade atual para verificar sucesso
                    const initialCount = this.bacteria.length;
                    console.log(`📊 Quantidade inicial: ${initialCount} bactérias`);
                    
                    // Criar bactérias
                    for (let i = 0; i < count; i++) {
                        try {
                            // Definir gênero
                            const isFemale = i < femaleCount;
                            
                            // Gerar posição aleatória
                            const x = random(width * 0.1, width * 0.9);
                            const y = random(height * 0.1, height * 0.9);
                            
                            // Criar bactéria
                            const bacteria = new window.Bacteria({
                                x: x,
                                y: y,
                                isFemale: isFemale,
                                energy: 150,
                                initialEnergy: 150,
                                initialState: "exploring",
                                simulation: simulation
                            });
                            
                            // Adicionar à lista
                            if (bacteria) {
                                this.bacteria.push(bacteria);
                                console.log(`✅ Bactéria ${i+1} criada: pos=(${x.toFixed(0)},${y.toFixed(0)}), ${isFemale ? 'F' : 'M'}`);
                            }
                        } catch (error) {
                            console.error(`❌ Erro ao criar bactéria ${i+1}:`, error);
                        }
                    }
                    
                    // Verificar sucesso
                    const finalCount = this.bacteria.length;
                    const addedCount = finalCount - initialCount;
                    console.log(`📊 Adicionadas ${addedCount} de ${count} bactérias. Total: ${finalCount}`);
                    
                    return addedCount;
                } catch (error) {
                    console.error("❌ Erro no método alternativo addMultipleBacteria:", error);
                    return 0;
                }
            };
            
            console.log("✅ Método alternativo addMultipleBacteria criado com sucesso");
        }
        
        // Adicionar botão para adicionar bactérias manualmente
        if (typeof createButton === 'function') {
            try {
                console.log("🔄 Criando botão de emergência para adicionar bactérias");
                
                const emergencyButton = createButton('⚠️ Adicionar Bactérias [Emergência]');
                emergencyButton.position(10, height - 40);
                emergencyButton.size(250, 30);
                emergencyButton.style('background-color', '#ff5722');
                emergencyButton.style('color', 'white');
                emergencyButton.style('border', 'none');
                emergencyButton.style('border-radius', '4px');
                emergencyButton.style('cursor', 'pointer');
                emergencyButton.style('font-weight', 'bold');
                
                emergencyButton.mousePressed(() => {
                    console.log("🖱️ Botão de emergência clicado");
                    
                    // Adicionar 10 bactérias com 50% de fêmeas
                    simulation.entityManager.addMultipleBacteria(10, 50);
                });
                
                console.log("✅ Botão de emergência criado com sucesso");
            } catch (error) {
                console.error("❌ Erro ao criar botão de emergência:", error);
            }
        }
        
        console.log("✅ Simulação inicializada com sucesso");
        return true;
    } catch (error) {
        console.error("❌ ERRO durante inicialização manual:", error);
        return false;
    }
}

// Executar inicialização
window.addEventListener('load', () => {
    // Esperar 3 segundos para garantir que tudo foi carregado
    setTimeout(() => {
        console.log("⏱️ Iniciando inicialização manual da simulação após 3 segundos de carregamento");
        const success = initializeSimulation();
        console.log(`📣 Inicialização manual ${success ? 'bem-sucedida' : 'falhou'}`);
    }, 3000);
});

// Tornar a função disponível globalmente
window.initializeSimulation = initializeSimulation; 