/**
 * Sistema de eventos aleatórios para a simulação
 */
class RandomEvents {
    /**
     * Inicializa o sistema de eventos aleatórios
     */
    constructor() {
        this.events = [
            {
                name: 'Tempestade',
                description: 'Uma tempestade agita o ambiente!',
                probability: 0.2,
                duration: 300, // 5 segundos
                effect: (simulation) => {
                    // Agita todas as bactérias e comida
                    const force = 5;
                    simulation.bacteria.forEach(bacteria => {
                        const angle = random(TWO_PI);
                        const push = p5.Vector.fromAngle(angle, force);
                        bacteria.movement.applyForce(push);
                    });
                    simulation.food.forEach(food => {
                        const angle = random(TWO_PI);
                        food.position.add(p5.Vector.fromAngle(angle, force));
                    });
                }
            },
            {
                name: 'Onda de Calor',
                description: 'Uma onda de calor afeta o metabolismo das bactérias!',
                probability: 0.15,
                duration: 600, // 10 segundos
                effect: (simulation) => {
                    // Aumenta o consumo de energia
                    simulation.bacteria.forEach(bacteria => {
                        bacteria.health -= random(5, 15);
                    });
                }
            },
            {
                name: 'Chuva de Nutrientes',
                description: 'Uma chuva de nutrientes enriquece o ambiente!',
                probability: 0.2,
                duration: 180, // 3 segundos
                effect: (simulation) => {
                    // Adiciona comida extra
                    const amount = floor(random(10, 20));
                    for (let i = 0; i < amount; i++) {
                        simulation.addFood(
                            random(width),
                            random(height),
                            random(20, 40)
                        );
                    }
                }
            },
            {
                name: 'Mutação Espontânea',
                description: 'Radiação causa mutações espontâneas!',
                probability: 0.1,
                duration: 300, // 5 segundos
                effect: (simulation) => {
                    // Causa mutações aleatórias
                    simulation.bacteria.forEach(bacteria => {
                        if (random() < 0.3) {
                            const gene = random(Object.keys(bacteria.dna.genes));
                            if (typeof bacteria.dna.genes[gene] === 'number') {
                                bacteria.dna.genes[gene] *= random(0.8, 1.2);
                            }
                        }
                    });
                }
            },
            {
                name: 'Epidemia',
                description: 'Uma epidemia afeta as bactérias mais fracas!',
                probability: 0.1,
                duration: 450, // 7.5 segundos
                effect: (simulation) => {
                    // Afeta bactérias com baixa imunidade
                    simulation.bacteria.forEach(bacteria => {
                        const immunity = bacteria.dna.genes.immunity;
                        if (random() > immunity) {
                            bacteria.health -= random(10, 30) * (1 - immunity);
                        }
                    });
                }
            },
            {
                name: 'Migração',
                description: 'Um grupo de bactérias migrou para o ambiente!',
                probability: 0.1,
                duration: 120, // 2 segundos
                effect: (simulation) => {
                    // Adiciona novas bactérias com DNA aleatório
                    const amount = floor(random(3, 8));
                    for (let i = 0; i < amount; i++) {
                        simulation.addBacteria(
                            random(width),
                            random(height),
                            new DNA()
                        );
                    }
                }
            },
            {
                name: 'Terremoto',
                description: 'Um terremoto reorganiza o ambiente!',
                probability: 0.05,
                duration: 180, // 3 segundos
                effect: (simulation) => {
                    // Reorganiza obstáculos e comida
                    simulation.obstacles.forEach(obstacle => {
                        if (random() < 0.5) {
                            obstacle.x = random(width - obstacle.w);
                            obstacle.y = random(height - obstacle.h);
                        }
                    });
                    simulation.food.forEach(food => {
                        if (random() < 0.3) {
                            food.position.x = random(width);
                            food.position.y = random(height);
                        }
                    });
                }
            }
        ];

        this.activeEvents = new Map();
        this.eventHistory = [];
    }

    /**
     * Dispara um evento aleatório
     * @param {Object} simulation - Referência para a simulação
     */
    triggerRandomEvent(simulation) {
        // Filtra eventos pela probabilidade
        const possibleEvents = this.events.filter(event => random() < event.probability);
        
        if (possibleEvents.length > 0) {
            // Escolhe um evento aleatório
            const event = random(possibleEvents);
            
            // Aplica o efeito
            event.effect(simulation);
            
            // Registra o evento
            const eventInfo = {
                name: event.name,
                description: event.description,
                timestamp: Date.now(),
                remainingDuration: event.duration
            };

            // Adiciona aos eventos ativos
            this.activeEvents.set(event.name, eventInfo);

            // Adiciona ao histórico
            this.eventHistory.push(eventInfo);

            // Mantém apenas os últimos 10 eventos no histórico
            if (this.eventHistory.length > 10) {
                this.eventHistory.shift();
            }

            return eventInfo;
        }

        return null;
    }

    /**
     * Atualiza os eventos ativos
     */
    update() {
        for (let [name, event] of this.activeEvents) {
            event.remainingDuration--;
            if (event.remainingDuration <= 0) {
                this.activeEvents.delete(name);
            }
        }
    }

    /**
     * Retorna os eventos ativos
     * @returns {Array} Lista de eventos ativos
     */
    getActiveEvents() {
        return Array.from(this.activeEvents.values());
    }

    /**
     * Retorna o histórico de eventos
     * @returns {Array} Lista de eventos ocorridos
     */
    getEventHistory() {
        return this.eventHistory;
    }

    /**
     * Limpa o histórico de eventos
     */
    clearEventHistory() {
        this.eventHistory = [];
        this.activeEvents.clear();
    }
}

// Tornando a classe global
window.RandomEvents = RandomEvents; 