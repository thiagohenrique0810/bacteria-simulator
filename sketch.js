/**
 * Simulação de Bactérias
 * Um ecossistema artificial onde bactérias evoluem e interagem
 */

let simulation;
let visualization;
let setupComplete = false;

/**
 * Configuração inicial
 */
function setup() {
    // Cria o canvas primeiro
    createCanvas(1000, 600);
    
    // Aguarda um momento para garantir que o p5.js está pronto
    window.setTimeout(() => {
        // Inicializa a simulação
        simulation = new Simulation();
        
        // Inicializa o sistema de visualização
        visualization = new SimulationVisualization(simulation);
        
        // Configura a simulação
        simulation.setup();
        
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
        background(51);
        fill(255);
        noStroke();
        textSize(20);
        textAlign(CENTER, CENTER);
        text('Carregando...', width/2, height/2);
        return;
    }

    // Limpa a tela
    background(51);

    // Atualiza a simulação
    simulation.update();
    
    // Desenha a simulação
    visualization.draw();
    
    // Exibe informações
    visualization.displayInfo();
}

/**
 * Eventos do mouse
 */
function mousePressed() {
    if (!setupComplete) return;

    // Verifica se o clique foi na área de controles
    const controlsContainer = document.getElementById('controls-container');
    if (controlsContainer && controlsContainer.contains(event.target)) {
        return false; // Permite que o evento seja processado pelos controles
    }

    if (mouseX >= 800) return false; // Ignora cliques na área de informações
    if (mouseY >= height) return false;

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
                b.behavior.currentBehavior = 'resting';
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

function mouseDragged() {
    if (simulation.isDragging && simulation.selectedBacteria) {
        simulation.selectedBacteria.pos.x = constrain(mouseX, 10, 780);
        simulation.selectedBacteria.pos.y = constrain(mouseY, 10, height - 10);
        simulation.selectedBacteria.movement.velocity.set(0, 0);
        simulation.selectedBacteria.behavior.currentBehavior = 'resting';
    }
    return false;
}

function mouseReleased() {
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
    if (keyCode === ESCAPE) {
        simulation.isDragging = false;
        simulation.selectedBacteria = null;
    }

    if (!simulation || !simulation.controls) return;

    switch (key) {
        case ' ':  // Espaço - Pausa/Continua
            simulation.paused = !simulation.paused;
            simulation.controls.pauseButton.html(simulation.paused ? 'Continuar' : 'Pausar');
            break;
        case 'r':  // R - Reinicia
        case 'R':
            if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
                simulation.reset();
            }
            break;
        case 's':  // S - Salva
        case 'S':
            if (simulation.controls.onSave) {
                simulation.controls.onSave();
            }
            break;
        case 'l':  // L - Carrega
        case 'L':
            if (simulation.controls.onLoad) {
                simulation.controls.onLoad();
            }
            break;
        case 'e':  // E - Evento aleatório
        case 'E':
            if (simulation.controls.onRandomEvent) {
                simulation.controls.onRandomEvent();
            }
            break;
    }
} 