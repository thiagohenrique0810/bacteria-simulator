/**
 * Simulação de Bactérias
 * Um ecossistema artificial onde bactérias evoluem e interagem
 */

let simulation;
let visualization;
let setupComplete = false;
let controlsWidth = 250; // Largura do painel de controles à direita
let chatWidth = 250;     // Largura do painel de chat à esquerda
let communication;       // Sistema de comunicação

/**
 * Configuração inicial
 */
function setup() {
    console.log('🚀 Inicializando simulação...');
    
    // Calcula o tamanho adequado para o canvas considerando os painéis laterais
    const totalWidth = windowWidth;
    const simulationWidth = totalWidth - controlsWidth - chatWidth;
    const simulationHeight = windowHeight;
    
    // Cria o canvas com o tamanho ajustado e o adiciona ao container de simulação
    const canvas = createCanvas(simulationWidth, simulationHeight);
    canvas.parent('simulation-container');
    
    // Aguarda um momento para garantir que o p5.js está pronto
    window.setTimeout(() => {
        // Inicializa a simulação
        simulation = new Simulation(canvas);
        console.log('✅ Objeto simulation criado');
        
        // Ajusta as dimensões da simulação para o canvas
        simulation.width = simulationWidth;
        simulation.height = simulationHeight;
        
        // Inicializa o sistema de visualização
        visualization = new SimulationVisualization(simulation);
        
        // Expõe a simulação globalmente para facilitar o acesso
        window.simulation = simulation;
        
        // Inicializa o sistema de comunicação
        // Primeiro tentar carregar dinamicamente os módulos de comunicação neural
        loadCommunicationSystem()
            .then(() => {
                console.log('Sistema de comunicação neural carregado com sucesso');
            })
            .catch(error => {
                console.warn('Erro ao carregar sistema de comunicação neural:', error);
                // Fallback: inicializa comunicação padrão sem sistema neural
                communication = new BacteriaCommunication(simulation);
                window.bacteria_communication = communication;
            });
        
        // Configura a simulação
        simulation.setup();
        
        // Inicializa os controles de interface
        initControls();
        
        // Marca setup como completo
        setupComplete = true;
        
        console.log('✅ Método init() executado');
        
        // Garante que os callbacks são configurados
        if (typeof simulation.postInitialize === 'function') {
            console.log('🔄 Chamando método postInitialize()...');
            simulation.postInitialize();
            console.log('✅ Método postInitialize() executado');
        } else {
            console.error('❌ ERRO: Método postInitialize não está disponível na simulação');
        }
        
        // Define o zoom inicial
        zoom = 1;
        
        console.log('Setup completo');
    }, 100);
}

/**
 * Carrega o sistema de comunicação neural dinamicamente
 * @returns {Promise} - Promise que será resolvida quando o sistema for carregado
 */
function loadCommunicationSystem() {
    return new Promise((resolve, reject) => {
        const initScript = document.createElement('script');
        initScript.type = 'text/javascript';
        initScript.src = 'modules/communication/initCommunication.js';
        initScript.onload = () => {
            // Verificar a cada 100ms se o sistema foi inicializado
            const checkInterval = setInterval(() => {
                if (window.bacteria_communication) {
                    clearInterval(checkInterval);
                    communication = window.bacteria_communication;
                    resolve();
                }
            }, 100);
            
            // Timeout de segurança após 5 segundos
            setTimeout(() => {
                if (!window.bacteria_communication) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout ao esperar inicialização do sistema de comunicação'));
                }
            }, 5000);
        };
        initScript.onerror = () => {
            reject(new Error('Erro ao carregar script de inicialização'));
        };
        document.head.appendChild(initScript);
    });
}

/**
 * Loop principal
 */
function draw() {
    if (!setupComplete) {
        // Mostra mensagem de carregamento
        background(30);
        fill(255);
        noStroke();
        textSize(20);
        textAlign(CENTER, CENTER);
        text('Carregando...', width/2, height/2);
        return;
    }

    // Limpa a tela
    background(30);

    // Garante que window.simulation esteja atualizado para referência global
    window.simulation = simulation;
    
    // Atualiza a simulação
    simulation.update();
    
    // Atualiza o sistema de comunicação, se estiver disponível
    if (communication && typeof communication.update === 'function') {
        communication.update();
    }
    
    // Desenha a simulação
    visualization.draw();
    
    // Exibe informações
    visualization.displayInfo();
    
    // Atualiza informações da bactéria selecionada no painel
    if (simulation.selectedBacteria) {
        // Atualiza em tempo real, a cada 5 frames (aproximadamente 0.08 segundos)
        if (frameCount % 5 === 0) {
            // Verifica se é a primeira atualização (precisa de atualização completa)
            if (!window.lastUpdatedBacteriaId || window.lastUpdatedBacteriaId !== simulation.selectedBacteria.id || frameCount % 30 === 0) {
                // Atualização completa (a cada 30 frames ou em troca de bactéria)
                displayBacteriaInfo(simulation.selectedBacteria);
                window.lastUpdatedBacteriaId = simulation.selectedBacteria.id;
            } else {
                // Atualização parcial apenas de valores dinâmicos
                updateDynamicBacteriaInfo(simulation.selectedBacteria);
            }
        }
    }
    
    // Estatísticas de depuração
    if (frameCount % 300 === 0) { // A cada 5 segundos aproximadamente
        console.log("Estatísticas de bactérias:", {
            contagem: simulation.entityManager.bacteria.length,
            limite: simulation.entityManager.populationLimit
        });
    }
}

/**
 * Exibe informações detalhadas sobre a bactéria no painel lateral
 * @param {Object} bacteria - A bactéria selecionada
 */
function displayBacteriaInfo(bacteria) {
    // Obtém o container de informações
    const infoContent = document.getElementById('bacteria-info-content');
    if (!infoContent || !bacteria) return;
    
    // Formata valores numéricos para exibição
    const formatNumber = (num) => {
        if (typeof num !== 'number') return 'N/A';
        return num.toFixed(2);
    };
    
    // Formata porcentagens para exibição
    const formatPercent = (num) => {
        if (typeof num !== 'number') return 'N/A';
        return (num * 100).toFixed(0) + '%';
    };
    
    // Cria barras de progresso para genes
    const createGeneBar = (value) => {
        if (typeof value !== 'number') return '<span class="info-value">N/A</span>';
        const percent = Math.min(Math.max(value, 0), 1) * 100;
        return `
            <div class="gene-bar">
                <div class="gene-value" style="width: ${percent}%"></div>
            </div>
        `;
    };
    
    // Constrói o HTML com as informações da bactéria
    let html = `
        <div>
            <p><span class="info-label">ID:</span> <span class="info-value">${bacteria.id || 'Desconhecido'}</span></p>
            <p><span class="info-label">Geração:</span> <span class="info-value">${bacteria.dna?.generation || 1}</span></p>
            <p><span class="info-label">Idade:</span> <span class="info-value" id="bacteria-age">${formatNumber(bacteria.age / 60)} segundos</span></p>
            <p><span class="info-label">Saúde:</span> <span class="info-value" id="bacteria-health">${formatNumber(bacteria.health)}</span></p>
            <p><span class="info-label">Energia:</span> <span class="info-value" id="bacteria-energy">${formatNumber(bacteria.energy)}</span></p>
            <p><span class="info-label">Tamanho:</span> <span class="info-value">${formatNumber(bacteria.size)}</span></p>
            <p><span class="info-label">Velocidade:</span> <span class="info-value">${formatNumber(bacteria.speed)}</span></p>
    `;
    
    // Adiciona informações sobre os genes, se disponíveis
    if (bacteria.dna && bacteria.dna.genes) {
        html += `
            <hr style="border-color: #363a45; margin: 10px 0;">
            <p style="font-weight: bold; margin-bottom: 8px;">Genes:</p>
        `;
        
        // Genes principais
        const mainGenes = [
            { name: 'Metabolismo', gene: 'metabolism' },
            { name: 'Imunidade', gene: 'immunity' },
            { name: 'Regeneração', gene: 'regeneration' },
            { name: 'Agressividade', gene: 'aggressiveness' },
            { name: 'Sociabilidade', gene: 'sociability' },
            { name: 'Curiosidade', gene: 'curiosity' },
            { name: 'Velocidade', gene: 'speed' },
            { name: 'Agilidade', gene: 'agility' },
            { name: 'Percepção', gene: 'perception' }
        ];
        
        // Adiciona cada gene com uma barra de progresso
        mainGenes.forEach(({ name, gene }) => {
            const value = bacteria.dna.genes[gene];
            if (value !== undefined) {
                html += `
                    <p>
                        <span class="info-label">${name}:</span> 
                        <span class="info-value">${formatNumber(value)}</span>
                        ${createGeneBar(value)}
                    </p>
                `;
            }
        });
        
        // Adiciona gene de comunicação neural se disponível
        if (bacteria.dna.hasGene && typeof bacteria.dna.hasGene === 'function') {
            const hasNeural = bacteria.dna.hasGene('neural_communication');
            html += `
                <p>
                    <span class="info-label">Comunicação Neural:</span> 
                    <span class="info-value" style="color: ${hasNeural ? '#4CD137' : '#E74C3C'}">${hasNeural ? 'Ativo' : 'Inativo'}</span>
                </p>
            `;
        }
    }
    
    // Adiciona informação sobre o estado atual
    if (bacteria.stateManager && bacteria.stateManager.getCurrentState) {
        html += `
            <hr style="border-color: #363a45; margin: 10px 0;">
            <p><span class="info-label">Estado Atual:</span> <span class="info-value" id="bacteria-state">${bacteria.stateManager.getCurrentState()}</span></p>
        `;
    } else if (bacteria.states && bacteria.states.currentState) {
        html += `
            <hr style="border-color: #363a45; margin: 10px 0;">
            <p><span class="info-label">Estado Atual:</span> <span class="info-value" id="bacteria-state">${bacteria.states.currentState}</span></p>
        `;
    }
    
    // Adiciona informações sobre relacionamentos, se disponíveis
    if (window.bacteria_communication && window.bacteria_communication.getRelationship && bacteria.id) {
        html += `
            <hr style="border-color: #363a45; margin: 10px 0;">
            <p style="font-weight: bold; margin-bottom: 8px;">Relacionamentos:</p>
        `;
        
        try {
            const totalRelationships = window.bacteria_communication.countRelationships(bacteria.id);
            html += `<p><span class="info-label">Total:</span> <span class="info-value" id="bacteria-relationships">${totalRelationships}</span></p>`;
        } catch (error) {
            console.error("Erro ao obter relacionamentos:", error);
            html += `<p class="info-message">Dados de relacionamento indisponíveis</p>`;
        }
    }
    
    html += `</div>`;
    
    // Atualiza o conteúdo do painel
    infoContent.innerHTML = html;
}

/**
 * Limpa o painel de informações da bactéria
 */
function clearBacteriaInfo() {
    const infoContent = document.getElementById('bacteria-info-content');
    if (infoContent) {
        infoContent.innerHTML = '<p class="info-message">Clique em uma bactéria para ver suas informações.</p>';
    }
}

/**
 * Eventos do mouse
 */
function mousePressed() {
    if (!setupComplete || !simulation) return false;

    // Verifica se o clique foi na área de controles ou chat
    if (mouseX >= width || mouseX < 0 || mouseY >= height || mouseY < 0) {
        return false; // Permite que o evento seja processado pelos controles
    }

    if (simulation.isPlacingObstacle) {
        simulation.obstacleStart = createVector(mouseX, mouseY);
        return false;
    } else {
        // Verifica se clicou em alguma bactéria
        for (let b of simulation.entityManager.bacteria) {
            let d = dist(mouseX, mouseY, b.pos.x, b.pos.y);
            if (d < b.size * 3) {
                simulation.selectedBacteria = b;
                simulation.isDragging = true;
                
                // Exibe informações da bactéria selecionada
                displayBacteriaInfo(b);
                
                // Corrige o acesso à velocidade, verificando a estrutura aninhada
                try {
                    if (b.movement) {
                        if (b.movement.movement && b.movement.movement.velocity) {
                            // Nova estrutura aninhada
                            b.movement.movement.velocity.mult(0);
                        } else if (b.movement.velocity) {
                            // Estrutura direta
                            b.movement.velocity.mult(0);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao parar bactéria selecionada:", error);
                }
                
                // Corrige o acesso ao estado
                try {
                    if (b.stateManager && typeof b.stateManager.setCurrentState === 'function') {
                        b.stateManager.setCurrentState("resting");
                    } else if (b.states && typeof b.states.setCurrentState === 'function') {
                        b.states.setCurrentState(window.BacteriaStates.RESTING);
                    } else if (b.states) {
                        b.states.currentState = window.BacteriaStates.RESTING;
                    }
                } catch (error) {
                    console.error("Erro ao alterar estado da bactéria selecionada:", error);
                }
                
                return false;
            }
        }

        // Se não clicou em uma bactéria, adiciona comida
        let validPosition = true;
        for (let obstacle of simulation.obstacles) {
            if (obstacle.collidesWith(createVector(mouseX, mouseY), 5)) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            const food = simulation.addFood(mouseX, mouseY);
            // Adiciona efeito visual
            if (simulation.effects) {
                simulation.effects.push(new PopEffect(mouseX, mouseY, "🍪", 20));
            }
        }

        return false;
    }
}

/**
 * Ajusta o tamanho do canvas quando a janela é redimensionada
 */
function windowResized() {
    // Recalcula o tamanho do canvas
    const totalWidth = windowWidth;
    const simulationWidth = totalWidth - controlsWidth - chatWidth;
    const simulationHeight = windowHeight;
    
    // Redimensiona o canvas
    resizeCanvas(simulationWidth, simulationHeight);
    
    // Atualiza as dimensões da simulação
    if (simulation) {
        simulation.width = simulationWidth;
        simulation.height = simulationHeight;
    }
}

function mouseDragged() {
    if (!simulation || !setupComplete) return false;
    
    if (simulation.isDragging && simulation.selectedBacteria) {
        simulation.selectedBacteria.pos.x = constrain(mouseX, 10, width - 10);
        simulation.selectedBacteria.pos.y = constrain(mouseY, 10, height - 10);
        
        // Corrige o acesso à velocidade, verificando a estrutura aninhada
        if (simulation.selectedBacteria.movement) {
            if (simulation.selectedBacteria.movement.movement && 
                simulation.selectedBacteria.movement.movement.velocity) {
                // Nova estrutura aninhada
                simulation.selectedBacteria.movement.movement.velocity.mult(0);
            } else if (simulation.selectedBacteria.movement.velocity) {
                // Estrutura direta
                simulation.selectedBacteria.movement.velocity.mult(0);
            }
        }
        
        // Corrige o acesso ao estado
        if (simulation.selectedBacteria.stateManager && 
            typeof simulation.selectedBacteria.stateManager.setCurrentState === 'function') {
            simulation.selectedBacteria.stateManager.setCurrentState("resting");
        } else if (simulation.selectedBacteria.states && 
                  typeof simulation.selectedBacteria.states.setCurrentState === 'function') {
            simulation.selectedBacteria.states.setCurrentState(window.BacteriaStates.RESTING);
        } else if (simulation.selectedBacteria.state) {
            // Fallback para o método antigo
            simulation.selectedBacteria.state = window.BacteriaStates.RESTING;
        }
    }
    return false;
}

function mouseReleased() {
    if (!simulation || !setupComplete) return false;
    
    if (simulation.isPlacingObstacle && simulation.obstacleStart && mouseY < height) {
        let w = mouseX - simulation.obstacleStart.x;
        let h = mouseY - simulation.obstacleStart.y;
        
        if (w < 0) {
            simulation.obstacleStart.x += w;
            w = abs(w);
        }
        if (h < 0) {
            simulation.obstacleStart.y += h;
            h = abs(h);
        }
        
        if (w > 10 && h > 10) {
            simulation.obstacles.push(new Obstacle(simulation.obstacleStart.x, simulation.obstacleStart.y, w, h));
        }
        
        simulation.obstacleStart = null;
    }

    if (simulation.isDragging && simulation.selectedBacteria) {
        simulation.isDragging = false;
        let newVel = p5.Vector.random2D();
        
        // Corrige o acesso à velocidade, verificando a estrutura aninhada
        try {
            if (simulation.selectedBacteria.movement) {
                if (simulation.selectedBacteria.movement.movement && 
                    simulation.selectedBacteria.movement.movement.velocity) {
                    // Nova estrutura aninhada
                    simulation.selectedBacteria.movement.movement.velocity.set(newVel.x, newVel.y);
                } else if (simulation.selectedBacteria.movement.velocity) {
                    // Estrutura direta
                    simulation.selectedBacteria.movement.velocity.set(newVel.x, newVel.y);
                }
            }
        } catch (error) {
            console.error("Erro ao definir velocidade após arrasto:", error);
        }
        
        // Mantém as informações da bactéria visíveis mesmo após soltá-la
        // Não limpa o painel de informações aqui
        
        simulation.selectedBacteria = null;
    }
    return false;
}

/**
 * Eventos do teclado
 */
function keyPressed() {
    // Verifica se a simulação está pronta
    if (!setupComplete || !simulation || !simulation.controls || !simulation.controls.initialized) {
        console.log('Simulação não está pronta para processar eventos');
        return false;
    }

    // Previne comportamento padrão para teclas específicas
    if ([' ', 'r', 'R', 's', 'S', 'l', 'L', 'e', 'E'].includes(key)) {
        event.preventDefault();
    }

    if (keyCode === ESCAPE) {
        simulation.isDragging = false;
        simulation.selectedBacteria = null;
        clearBacteriaInfo();
        return false;
    }

    switch (key) {
        case ' ':  // Espaço - Pausa/Continua
            simulation.paused = !simulation.paused;
            if (simulation.controls.pauseButton) {
                simulation.controls.pauseButton.html(simulation.paused ? 'Continuar' : 'Pausar');
            }
            break;
        case 'r':  // R - Reinicia
        case 'R':
            if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
                simulation.reset();
            }
            break;
        case 's':  // S - Salva
        case 'S':
            if (simulation.controls && simulation.controls.callbacks.onSave) {
                simulation.controls.callbacks.onSave();
            }
            break;
        case 'l':  // L - Carrega
        case 'L':
            if (simulation.controls && simulation.controls.callbacks.onLoad) {
                simulation.controls.callbacks.onLoad();
            }
            break;
        case 'e':  // E - Evento aleatório
        case 'E':
            if (simulation.controls && simulation.controls.callbacks.onRandomEvent) {
                simulation.controls.callbacks.onRandomEvent();
            }
            break;
    }
    return false;
}

/**
 * Inicializa os controles de interface
 */
function initControls() {
    // Obtém referências para os botões existentes
    const emergencyBtn = document.getElementById('emergency-btn');
    const debugBtn = document.getElementById('debug-btn');
    const neuralBtn = document.getElementById('neural-btn');
    
    // Verifica se os botões foram encontrados
    if (!emergencyBtn || !debugBtn || !neuralBtn) {
        console.error("Não foi possível encontrar todos os botões de controle");
        return;
    }
    
    // Configura o botão de emergência
    emergencyBtn.onclick = () => {
        // Pausa a simulação
        if (window.simulation) {
            window.simulation.pause();
        }
        
        // Pergunta se deseja salvar o estado atual
        if (confirm('Simulação pausada! Deseja salvar o estado atual antes de reiniciar?')) {
            // Implementar lógica de salvamento aqui
            alert('Funcionalidade de salvamento ainda não implementada');
        }
        
        // Recarrega a página após confirmação
        if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
            location.reload();
        } else {
            // Retoma a simulação se o usuário cancelar
            if (window.simulation) {
                window.simulation.resume();
            }
        }
    };
    
    // Estado inicial do modo de depuração
    let debugMode = false;
    
    // Configura o botão de debug
    debugBtn.onclick = () => {
        debugMode = !debugMode;
        
        if (debugMode) {
            debugBtn.innerText = 'DEBUG: ON';
            debugBtn.style.backgroundColor = '#3498DB';
            
            // Ativa modo de depuração
            if (window.simulation && window.simulation.renderSystem) {
                window.simulation.renderSystem.debugMode = true;
                console.log('Modo de depuração ativado');
            }
        } else {
            debugBtn.innerText = 'DEBUG: OFF';
            debugBtn.style.backgroundColor = '#95A5A6';
            
            // Desativa modo de depuração
            if (window.simulation && window.simulation.renderSystem) {
                window.simulation.renderSystem.debugMode = false;
                console.log('Modo de depuração desativado');
            }
        }
    };
    
    // Estado inicial do modo neural
    let neuralMode = 'AUTO';
    
    // Configura o botão neural
    neuralBtn.onclick = () => {
        if (!window.simulation || !window.simulation.communicationSystem) {
            console.error("Sistema de comunicação não disponível");
            neuralBtn.style.backgroundColor = '#E74C3C';
            neuralBtn.innerText = 'NEURAL: ERRO';
            return;
        }
        
        // Determina o próximo modo
        let nextMode;
        switch (neuralMode) {
            case 'AUTO': nextMode = 'ON'; break;
            case 'ON': nextMode = 'OFF'; break;
            case 'OFF': 
            default: nextMode = 'AUTO'; break;
        }
        
        // Alterna para o próximo modo
        try {
            // Chama o método no sistema de comunicação
            const resultMode = window.simulation.communicationSystem.toggleNeuralCommunication(nextMode);
            neuralMode = resultMode; // Atualiza com o valor retornado (que pode ser diferente)
            
            // Atualiza a aparência do botão
            switch (neuralMode) {
                case 'AUTO':
                    neuralBtn.innerText = 'NEURAL: AUTO';
                    neuralBtn.style.backgroundColor = '#2ECC71';
                    break;
                case 'ON':
                    neuralBtn.innerText = 'NEURAL: ON';
                    neuralBtn.style.backgroundColor = '#F39C12';
                    break;
                case 'OFF':
                    neuralBtn.innerText = 'NEURAL: OFF';
                    neuralBtn.style.backgroundColor = '#95A5A6';
                    break;
                default:
                    neuralBtn.innerText = 'NEURAL: ' + neuralMode;
                    neuralBtn.style.backgroundColor = '#3498DB';
            }
        } catch (error) {
            console.error("Erro ao alternar modo de comunicação neural:", error);
            neuralBtn.style.backgroundColor = '#E74C3C';
            neuralBtn.innerText = 'NEURAL: ERRO';
        }
    };
}

/**
 * Efeito de popup visual
 */
class PopEffect {
    /**
     * Cria um novo efeito de pop
     * @param {number} x - Posição X 
     * @param {number} y - Posição Y
     * @param {string} symbol - Símbolo a mostrar
     * @param {number} duration - Duração em frames
     */
    constructor(x, y, symbol, duration = 30) {
        this.pos = createVector(x, y);
        this.symbol = symbol || "✓";
        this.duration = duration;
        this.timer = duration;
        this.scale = 1.0;
        this.alpha = 255;
    }
    
    /**
     * Atualiza o efeito
     * @returns {boolean} - Verdadeiro se o efeito ainda está ativo
     */
    update() {
        this.timer--;
        this.pos.y -= 0.5; // Sobe lentamente
        this.scale = 1.0 + (1 - this.timer/this.duration) * 0.5; // Aumenta gradualmente
        this.alpha = 255 * (this.timer/this.duration); // Desaparece gradualmente
        
        return this.timer > 0;
    }
    
    /**
     * Desenha o efeito
     */
    draw() {
        push();
        textAlign(CENTER, CENTER);
        textSize(18 * this.scale);
        fill(255, 255, 255, this.alpha);
        text(this.symbol, this.pos.x, this.pos.y);
        pop();
    }
}

/**
 * Atualiza apenas as informações dinâmicas da bactéria (sem reconstruir todo o painel)
 * @param {Object} bacteria - A bactéria selecionada
 */
function updateDynamicBacteriaInfo(bacteria) {
    if (!bacteria) return;
    
    // Formata valores numéricos para exibição
    const formatNumber = (num) => {
        if (typeof num !== 'number') return 'N/A';
        return num.toFixed(2);
    };
    
    // Atualiza os valores dinâmicos usando IDs específicos
    try {
        // Atualiza idade
        const ageElement = document.getElementById('bacteria-age');
        if (ageElement) ageElement.textContent = `${formatNumber(bacteria.age / 60)} segundos`;
        
        // Atualiza saúde
        const healthElement = document.getElementById('bacteria-health');
        if (healthElement) healthElement.textContent = formatNumber(bacteria.health);
        
        // Atualiza energia
        const energyElement = document.getElementById('bacteria-energy');
        if (energyElement) energyElement.textContent = formatNumber(bacteria.energy);
        
        // Atualiza estado atual, se disponível
        const stateElement = document.getElementById('bacteria-state');
        if (stateElement) {
            if (bacteria.stateManager && bacteria.stateManager.getCurrentState) {
                stateElement.textContent = bacteria.stateManager.getCurrentState();
            } else if (bacteria.states && bacteria.states.currentState) {
                stateElement.textContent = bacteria.states.currentState;
            }
        }
        
        // Atualiza relacionamentos, se disponível
        const relationshipsElement = document.getElementById('bacteria-relationships');
        if (relationshipsElement && window.bacteria_communication && window.bacteria_communication.countRelationships) {
            try {
                const totalRelationships = window.bacteria_communication.countRelationships(bacteria.id);
                relationshipsElement.textContent = totalRelationships;
            } catch (error) {
                console.error("Erro ao atualizar contagem de relacionamentos:", error);
            }
        }
    } catch (error) {
        console.error("Erro ao atualizar informações dinâmicas:", error);
        // Em caso de erro, faz a atualização completa
        displayBacteriaInfo(bacteria);
    }
} 