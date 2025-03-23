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
    
    // Cria o canvas com o tamanho ajustado e posicionado após o chat
    createCanvas(simulationWidth, simulationHeight);
    // Posiciona o canvas após o painel de chat
    document.querySelector('canvas').style.marginLeft = chatWidth + 'px';
    
    // Botão temporário para adicionar bactérias diretamente
    const emergencyButton = createButton('ADICIONAR 10 BACTÉRIAS (EMERGÊNCIA)');
    emergencyButton.position(chatWidth + 20, 20);
    emergencyButton.style('z-index', '10000');
    emergencyButton.style('background-color', 'red');
    emergencyButton.style('color', 'white');
    emergencyButton.style('padding', '10px');
    emergencyButton.style('font-weight', 'bold');
    emergencyButton.mousePressed(() => {
        console.log("Botão de emergência pressionado!");
        if (window.simulation) {
            console.log("Adicionando 10 bactérias diretamente via botão de emergência");
            
            // Método alternativo que não depende de addMultipleBacteria
            try {
                // Número de bactérias para adicionar
                const count = 10;
                // Metade fêmeas, metade machos
                const femaleCount = 5;
                
                for (let i = 0; i < count; i++) {
                    // Determina se esta bactéria será fêmea
                    const isFemale = i < femaleCount;
                    
                    // Verifica se simulation está disponível
                    if (!simulation) {
                        console.error("Simulação ainda não disponível");
                        continue;
                    }
                    
                    try {
                        // Cria bactéria diretamente, evitando complexidades
                        const x = random(width);
                        const y = random(height);
                        
                        // Cria uma instância simples de DNA sem depender de sliders
                        const simpleDNA = {
                            generation: 1,
                            baseLifespan: 12 * 3600 * 60,
                            fitness: 1.0,
                            genes: {
                                metabolism: random(0.5, 1.5),
                                immunity: random(0.5, 1.5),
                                regeneration: random(0.5, 1.5),
                                aggressiveness: random(0.5, 1.5),
                                sociability: random(0.5, 1.5),
                                curiosity: random(0.5, 1.5),
                                speed: random(0.5, 1.5),
                                agility: random(0.5, 1.5),
                                perception: random(0.5, 1.5),
                                fertility: random(0.5, 1.5),
                                mutationRate: random(0.01, 0.1),
                                adaptability: random(0.5, 1.5),
                                size: random(0.5, 1.5),
                                colorR: random(0, 1),
                                colorG: random(0, 1),
                                colorB: random(0, 1)
                            }
                        };
                        
                        // Cria uma bactéria diretamente sem usar o construtor da classe Bacteria
                        // Isso evita os problemas de controles não inicializados
                        const bacteria = {
                            id: Date.now() + Math.floor(random(0, 1000)),
                            pos: createVector(x, y),
                            size: 20,
                            dna: simpleDNA,
                            health: 150,
                            energy: 150,
                            age: 0,
                            lifespan: simpleDNA.baseLifespan,
                            lastMealTime: frameCount,
                            healthLossRate: 0.05,
                            starvationTime: 30 * 60 * 60,
                            isFemale: isFemale,
                            simulation: simulation,
                            isInfected: false,
                            activeDiseases: new Set(),
                            immuneMemory: new Set(),
                            canReproduce: true,
                            state: window.BacteriaStates.EXPLORING,
                            movement: {
                                pos: createVector(x, y),
                                velocity: createVector(random(-1, 1), random(-1, 1)),
                                acceleration: createVector(0, 0),
                                maxSpeed: 2 * simpleDNA.genes.speed,
                                baseMaxSpeed: 2 * simpleDNA.genes.speed,
                                maxForce: 0.1,
                                avoidRadius: 25,
                                update: function(ageRatio, obstacles, size, isResting, deltaTime) {
                                    // Verifique se o agente não está em repouso
                                    if (!isResting) {
                                        // Aplica a aceleração à velocidade
                                        this.velocity.add(this.acceleration);
                                        
                                        // Limita a velocidade máxima
                                        this.velocity.limit(this.maxSpeed);
                                        
                                        // Atualiza a posição
                                        this.pos.add(this.velocity);
                                        
                                        // Mantém dentro da tela
                                        this.pos.x = constrain(this.pos.x, size/2, simulation.width - size/2);
                                        this.pos.y = constrain(this.pos.y, size/2, simulation.height - size/2);
                                    }
                                    
                                    // Reseta a aceleração para o próximo ciclo
                                    this.acceleration.mult(0);
                                }
                            },
                            isDead: function() { return false; },
                            draw: function() {
                                push();
                                fill(isFemale ? color(255, 150, 200) : color(150, 200, 255));
                                noStroke();
                                ellipse(this.pos.x, this.pos.y, this.size, this.size);
                                pop();
                            },
                            update: function() {
                                this.age++;
                                
                                // Calcula a proporção de idade em relação ao tempo de vida (0-1)
                                const ageRatio = constrain(this.age / this.lifespan, 0, 1);
                                
                                // Determina se a bactéria está descansando
                                const isResting = this.state === window.BacteriaStates.RESTING;
                                
                                // Chama o método update do movimento com os parâmetros corretos
                                this.movement.update(
                                    ageRatio,
                                    simulation.obstacles, 
                                    this.size,
                                    isResting,
                                    1
                                );
                                
                                // Sincroniza as posições
                                this.pos.x = this.movement.pos.x;
                                this.pos.y = this.movement.pos.y;
                                
                                // Manter dentro dos limites da tela
                                this.pos.x = constrain(this.pos.x, 0, width);
                                this.pos.y = constrain(this.pos.y, 0, height);
                            }
                        };
                        
                        bacteria.pos = bacteria.movement.pos; // Sincronizar referências
                        
                        // Adiciona à simulação
                        simulation.bacteria.push(bacteria);
                        
                        console.log(`Bactéria ${i+1} criada com sucesso: ${isFemale ? 'fêmea' : 'macho'}`);
                    } catch (e) {
                        console.error("Erro ao criar bactéria:", e);
                    }
                }
                
                console.log(`Adicionadas ${count} bactérias. Total atual: ${simulation.bacteria.length}`);
            } catch (e) {
                console.error("Erro geral ao adicionar bactérias:", e);
            }
        } else {
            console.error("Simulação não disponível ainda");
        }
    });
    
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
    
    // Reposiciona o canvas
    document.querySelector('canvas').style.marginLeft = chatWidth + 'px';
    
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
        if (simulation.selectedBacteria.states && typeof simulation.selectedBacteria.states.setCurrentState === 'function') {
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