/**
 * Sistema de eventos aleatórios
 */
class RandomEvents {
    constructor() {
        this.events = [
            {
                name: 'Chuva de Comida',
                description: 'Uma chuva de nutrientes cai sobre o ambiente!',
                probability: 0.1,
                action: (simulation) => {
                    const amount = Math.floor(random(5, 15));
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
                name: 'Mutação Benéfica',
                description: 'Algumas bactérias desenvolveram mutações positivas!',
                probability: 0.05,
                action: (simulation) => {
                    const amount = Math.floor(simulation.bacteria.length * 0.2);
                    for (let i = 0; i < amount; i++) {
                        const bacteria = random(simulation.bacteria);
                        if (bacteria) {
                            bacteria.health = min(100, bacteria.health + 20);
                            bacteria.dna.mutate(0.2);
                        }
                    }
                }
            },
            {
                name: 'Tempestade',
                description: 'Uma tempestade agita o ambiente!',
                probability: 0.08,
                action: (simulation) => {
                    // Move todas as entidades aleatoriamente
                    for (let bacteria of simulation.bacteria) {
                        bacteria.pos.add(p5.Vector.random2D().mult(random(20, 50)));
                        bacteria.pos.x = constrain(bacteria.pos.x, 0, width);
                        bacteria.pos.y = constrain(bacteria.pos.y, 0, height);
                    }
                    
                    // Move a comida
                    for (let food of simulation.food) {
                        food.position.add(p5.Vector.random2D().mult(random(10, 30)));
                        food.position.x = constrain(food.position.x, 0, width);
                        food.position.y = constrain(food.position.y, 0, height);
                    }
                }
            }
        ];

        this.lastEventTime = 0;
        this.minInterval = 600; // Frames mínimos entre eventos
    }

    /**
     * Atualiza o sistema de eventos
     */
    update() {
        if (frameCount - this.lastEventTime < this.minInterval) return;

        for (let event of this.events) {
            if (random() < event.probability) {
                this.triggerEvent(event);
                this.lastEventTime = frameCount;
                break;
            }
        }
    }

    /**
     * Dispara um evento específico
     * @param {Object} event - Evento a ser disparado
     */
    triggerEvent(event) {
        if (window.simulation) {
            event.action(window.simulation);
            console.log(`Evento disparado: ${event.name} - ${event.description}`);
        }
    }

    /**
     * Dispara um evento aleatório
     * @param {Simulation} simulation - Instância da simulação
     * @returns {Object|null} - Evento disparado ou null
     */
    triggerRandomEvent(simulation) {
        if (this.events.length === 0) return null;

        const event = random(this.events);
        event.action(simulation);
        this.lastEventTime = frameCount;
        return event;
    }
}

// Torna a classe global
window.RandomEvents = RandomEvents; 