/**
 * Sistema de estados específico para predadores
 */
class PredatorStates {
    constructor(predator) {
        this.predator = predator;
        this.currentState = 'PATROLLING';
        
        // Define os estados possíveis e suas ações
        this.states = {
            RESTING: {
                enter: () => console.log('Predador descansando'),
                update: () => this.handleRestingState(),
                speedMultiplier: 0.5
            },
            MATING: {
                enter: () => console.log('Predador procurando parceiro'),
                update: () => this.handleMatingState(),
                speedMultiplier: 0.8
            },
            HUNTING: {
                enter: () => console.log('Predador caçando'),
                update: () => this.handleHuntingState(),
                speedMultiplier: 1.2
            },
            PATROLLING: {
                enter: () => console.log('Predador patrulhando'),
                update: () => this.handlePatrollingState(),
                speedMultiplier: 1.0
            }
        };

        // Define os limiares de energia para cada estado
        this.energyThresholds = {
            REST: 30,
            MATE: 80,
            HUNT: 50
        };
    }

    /**
     * Atualiza o estado do predador com base nas condições atuais
     */
    update(conditions) {
        const currentEnergy = this.predator.energy;

        // Determina o próximo estado com base nas condições
        let nextState = this.currentState;

        // Prioridade: RESTING -> MATING -> HUNTING -> PATROLLING
        if (currentEnergy <= this.energyThresholds.REST) {
            nextState = 'RESTING';
        } else if (currentEnergy >= this.energyThresholds.MATE && conditions.canReproduce && conditions.partnerNearby) {
            nextState = 'MATING';
        } else if (currentEnergy >= this.energyThresholds.HUNT && conditions.bacteria && conditions.bacteria.length > 0) {
            nextState = 'HUNTING';
        } else {
            nextState = 'PATROLLING';
        }

        // Se o estado mudou, executa a ação de entrada
        if (nextState !== this.currentState) {
            this.currentState = nextState;
            this.states[this.currentState].enter();
        }

        // Executa a ação do estado atual
        this.states[this.currentState].update();

        return {
            speedMultiplier: this.states[this.currentState].speedMultiplier,
            targetType: this.currentState === 'MATING' ? 'partner' : 'prey'
        };
    }

    /**
     * Gerencia o estado de descanso
     */
    handleRestingState() {
        // Reduz a velocidade e recupera energia lentamente
        this.predator.velocity.mult(0.95);
    }

    /**
     * Gerencia o estado de reprodução
     */
    handleMatingState() {
        const partner = this.predator.findReproductionPartner(this.predator.predators);
        if (partner) {
            // Move em direção ao parceiro
            const direction = p5.Vector.sub(partner.position, this.predator.position);
            direction.normalize();
            direction.mult(this.predator.maxSpeed * 0.8);
            this.predator.velocity.lerp(direction, 0.1);
        }
    }

    /**
     * Gerencia o estado de caça
     */
    handleHuntingState() {
        const prey = this.predator.findNearestPrey();
        if (prey) {
            // Move em direção à presa
            const direction = p5.Vector.sub(prey.position, this.predator.position);
            direction.normalize();
            direction.mult(this.predator.maxSpeed * 1.2);
            this.predator.velocity.lerp(direction, 0.1);
        }
    }

    /**
     * Gerencia o estado de patrulha
     */
    handlePatrollingState() {
        // Movimento aleatório
        if (random() < 0.05) {
            const angle = random(TWO_PI);
            this.predator.velocity.rotate(angle);
        }
    }
}

// Torna a classe global
window.PredatorStates = PredatorStates; 