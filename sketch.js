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
        simulation = new Simulation();
        
        // Ajusta as dimensões da simulação para o canvas
        simulation.width = simulationWidth;
        simulation.height = simulationHeight;
        
        // Inicializa o sistema de visualização
        visualization = new SimulationVisualization(simulation);
        
        // Inicializa o sistema de comunicação
        communication = new BacteriaCommunication(simulation);
        
        // Configura a simulação
        simulation.setup();
        
        // Inicializa os controles de interface
        initControls();
        
        // Marca setup como completo
        setupComplete = true;
        
        console.log('Setup completo');
    }, 100);
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
    
    // Disponibiliza o sistema de comunicação globalmente
    window.communication = communication;
    
    // Atualiza a simulação
    simulation.update();
    
    // Atualiza o sistema de comunicação
    communication.update();
    
    // Desenha a simulação
    visualization.draw();
    
    // Exibe informações
    visualization.displayInfo();
    
    // Estatísticas de depuração
    if (frameCount % 300 === 0) { // A cada 5 segundos aproximadamente
        console.log("Estatísticas de bactérias:", {
            contagem: simulation.bacteria.length,
            limite: simulation.populationLimit
        });
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
        for (let b of simulation.bacteria) {
            let d = dist(mouseX, mouseY, b.pos.x, b.pos.y);
            if (d < b.size * 3) {
                simulation.selectedBacteria = b;
                simulation.isDragging = true;
                b.movement.velocity.set(0, 0);
                b.states.currentState = window.BacteriaStates.RESTING;
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
            simulation.addFood(mouseX, mouseY);
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
        simulation.selectedBacteria.movement.velocity.set(0, 0);
        
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
        simulation.selectedBacteria.movement.velocity.set(newVel.x, newVel.y);
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

// Inicializa controles de interface
function initControls() {
    // Botão de emergência
    emergencyButton = createButton('EMERGÊNCIA');
    emergencyButton.position(10, height - 50);
    emergencyButton.size(100, 40);
    emergencyButton.style('background-color', '#ff3333');
    emergencyButton.style('color', '#ffffff');
    emergencyButton.style('font-weight', 'bold');
    emergencyButton.style('border', 'none');
    emergencyButton.style('border-radius', '5px');
    emergencyButton.style('cursor', 'pointer');
    
    emergencyButton.mousePressed(function() {
        console.log("Botão de emergência pressionado - criando novas bactérias");
        
        // Cria 10 novas bactérias no meio da tela com movimento inicial
        for (let i = 0; i < 10; i++) {
            // Posição aleatória próxima ao centro
            const x = width/2 + random(-100, 100);
            const y = height/2 + random(-100, 100);
            
            // Cria a bactéria com estado inicial "exploring" e energia inicial 70
            const bacteria = new Bacteria({
                x: x,
                y: y,
                initialState: "exploring",
                initialEnergy: 70
            });
            
            // Adiciona velocidade inicial aleatória
            const initialVelocity = p5.Vector.random2D();
            initialVelocity.mult(2); // Velocidade moderada
            bacteria.movement.velocity.set(initialVelocity);
            
            // Força um movimento inicial
            const initialForce = p5.Vector.random2D();
            initialForce.mult(1);
            bacteria.movement.applyForce(initialForce);
            
            // Adiciona a bactéria à simulação
            simulation.entityManager.addBacteria(bacteria);
            
            // Log de criação
            console.log(`Criada bactéria de emergência ID=${bacteria.id}, sexo=${bacteria.isFemale ? 'F' : 'M'}`);
        }
    });
    
    // Botão toggle de depuração
    debugButton = createButton('DEBUG: ON');
    debugButton.position(120, height - 50);
    debugButton.size(100, 40);
    debugButton.style('background-color', '#33aa33');
    debugButton.style('color', '#ffffff');
    debugButton.style('font-weight', 'bold');
    debugButton.style('border', 'none');
    debugButton.style('border-radius', '5px');
    debugButton.style('cursor', 'pointer');
    
    // Estado inicial do debug
    let debugEnabled = true;
    
    debugButton.mousePressed(function() {
        debugEnabled = !debugEnabled;
        
        // Atualiza o texto do botão
        debugButton.html(debugEnabled ? 'DEBUG: ON' : 'DEBUG: OFF');
        
        // Atualiza o estilo do botão
        debugButton.style('background-color', debugEnabled ? '#33aa33' : '#666666');
        
        // Atualiza o modo de debug na renderização
        if (simulation && simulation.renderSystem) {
            simulation.renderSystem.setDebugMode(debugEnabled);
            console.log(`Modo de depuração ${debugEnabled ? 'ativado' : 'desativado'}`);
        }
    });
} 