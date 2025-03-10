/**
 * Sistema de eventos aleatórios
 */
class RandomEvents {
    constructor() {
        this.events = [
            {
                name: 'Chuva de Nutrientes',
                description: 'Uma chuva de nutrientes aumenta o valor nutricional da comida',
                probability: 0.2,
                action: (simulation) => {
                    simulation.food.forEach(f => f.nutrition *= 1.5);
                    return true;
                }
            },
            {
                name: 'Onda de Calor',
                description: 'Uma onda de calor aumenta o gasto de energia',
                probability: 0.15,
                action: (simulation) => {
                    simulation.bacteria.forEach(b => b.health -= 10);
                    return true;
                }
            },
            {
                name: 'Mutação Benéfica',
                description: 'Algumas bactérias desenvolvem mutações benéficas',
                probability: 0.1,
                action: (simulation) => {
                    simulation.bacteria
                        .filter(() => Math.random() < 0.3)
                        .forEach(b => {
                            b.dna.mutate(0.2);
                            b.health += 20;
                        });
                    return true;
                }
            },
            {
                name: 'Abundância de Alimentos',
                description: 'Mais comida aparece no ambiente',
                probability: 0.25,
                action: (simulation) => {
                    for (let i = 0; i < 10; i++) {
                        simulation.addFood(
                            random(simulation.width),
                            random(simulation.height)
                        );
                    }
                    return true;
                }
            }
        ];
    }

    /**
     * Dispara um evento aleatório
     * @param {Simulation} simulation - Instância da simulação
     * @returns {Object|null} - Evento disparado ou null
     */
    triggerRandomEvent(simulation) {
        // Soma todas as probabilidades
        const totalProbability = this.events.reduce((sum, event) => sum + event.probability, 0);
        
        // Escolhe um número aleatório
        let random = Math.random() * totalProbability;
        
        // Encontra o evento baseado na probabilidade
        for (let event of this.events) {
            random -= event.probability;
            if (random <= 0) {
                if (event.action(simulation)) {
                    return event;
                }
                break;
            }
        }
        
        return null;
    }

    /**
     * Adiciona um novo evento
     * @param {Object} event - Novo evento
     */
    addEvent(event) {
        if (event.name && event.description && event.probability && event.action) {
            this.events.push(event);
        }
    }
}

// Exporta a classe
window.RandomEvents = RandomEvents; 