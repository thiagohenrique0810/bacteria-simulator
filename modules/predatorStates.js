/**
 * Sistema de estados específico para predadores
 */
class PredatorStates {
    /**
     * Construtor da classe de estados do predador
     * @param {Predator} predator - Referência para o predador
     */
    constructor(predator) {
        this.predator = predator;
        this.currentState = 'PATROLLING'; // Estado inicial
        this.energy = 100; // Energia inicial
        this.conditions = {}; // Condições atuais
        
        // Limites de energia para mudança de estado
        this.energyThresholds = {
            REST: 20,    // Abaixo disso, descansa
            HUNT: 30,    // Acima disso, pode caçar
            MATE: 70     // Acima disso, pode reproduzir
        };
        
        // Verifica se já existe states no predador
        if (predator.states) {
            this.energy = typeof predator.states.getEnergy === 'function' ? 
                         predator.states.getEnergy() : 100;
        }
        
        // Define os estados e suas características
        this.states = {
            'RESTING': {
                speedMultiplier: 0,
                enter: () => {
                    console.log("Predador entrando em estado de descanso");
                    if (this.predator.movement) this.predator.movement.stop();
                },
                update: () => this.handleRestingState()
            },
            'HUNTING': {
                speedMultiplier: 1.2,
                enter: () => {
                    console.log("Predador entrando em estado de caça");
                    if (this.predator.movement) this.predator.movement.resume();
                },
                update: () => this.handleHuntingState()
            },
            'MATING': {
                speedMultiplier: 0.8,
                enter: () => {
                    console.log("Predador entrando em estado de reprodução");
                    if (this.predator.movement) this.predator.movement.resume();
                },
                update: () => this.handleMatingState()
            },
            'PATROLLING': {
                speedMultiplier: 0.7,
                enter: () => {
                    console.log("Predador entrando em estado de patrulha");
                    if (this.predator.movement) this.predator.movement.resume();
                },
                update: () => this.handlePatrollingState()
            }
        };
        
        // Métodos para gerenciamento de energia
        this.getEnergy = () => this.energy;
        this.addEnergy = (amount) => {
            this.energy = constrain(this.energy + amount, 0, 100);
        };
        this.removeEnergy = (amount) => {
            this.energy = constrain(this.energy - amount, 0, 100);
        };
        
        // Disponibiliza os métodos de energia para o predador
        predator.states = {
            getEnergy: this.getEnergy,
            addEnergy: this.addEnergy,
            removeEnergy: this.removeEnergy
        };
    }

    /**
     * Atualiza o estado do predador
     * @param {Object} conditions - Condições atuais
     * @returns {Object} - Ações para o estado atual
     */
    update(conditions) {
        try {
            // Armazena as condições para uso nos métodos de manipulação de estado
            this.conditions = conditions || {};
            
            // Define o próximo estado baseado nas condições
            let nextState = this.currentState;
            
            // Mapeamento de predicados para estados correspondentes
            const stateTransitions = [
                { 
                    predicate: () => this.energy < 20, 
                    state: 'RESTING'
                },
                { 
                    predicate: () => conditions && conditions.canReproduce && conditions.partnerNearby, 
                    state: 'MATING'
                },
                { 
                    predicate: () => conditions && conditions.bacteria && 
                                     this.predator.findClosestPrey(conditions.bacteria) !== null, 
                    state: 'HUNTING'
                },
                { 
                    predicate: () => true, // Fallback
                    state: 'PATROLLING'
                }
            ];
            
            // Encontra o primeiro estado cuja condição é satisfeita
            for (const transition of stateTransitions) {
                if (transition.predicate()) {
                    nextState = transition.state;
                    break;
                }
            }
            
            // Se o estado mudou, executa a ação de entrada
            if (nextState !== this.currentState) {
                this.currentState = nextState;
                if (this.states[this.currentState] && typeof this.states[this.currentState].enter === 'function') {
                    this.states[this.currentState].enter();
                }
            }
            
            // Executa a ação do estado atual
            let stateAction = {
                shouldMove: true,
                speedMultiplier: 1.0,
                targetType: 'random'
            };
            
            // Chama o método apropriado para o estado atual
            switch (this.currentState) {
                case 'RESTING':
                    this.handleRestingState();
                    stateAction.shouldMove = false;
                    break;
                case 'MATING':
                    this.handleMatingState();
                    stateAction.targetType = 'mate';
                    stateAction.speedMultiplier = 0.8;
                    break;
                case 'HUNTING':
                    this.handleHuntingState();
                    stateAction.targetType = 'hunt';
                    stateAction.speedMultiplier = 1.2;
                    break;
                case 'PATROLLING':
                default:
                    this.handlePatrollingState();
                    stateAction.targetType = 'random';
                    stateAction.speedMultiplier = 0.7;
                    break;
            }
            
            return stateAction;
        } catch (error) {
            console.error("Erro no update do PredatorStates:", error);
            // Em caso de erro, retorna uma ação segura de movimento aleatório
            return {
                shouldMove: true,
                speedMultiplier: 0.5,
                targetType: 'random'
            };
        }
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
        try {
            // Obtém a lista de predadores do contexto
            const predators = this.conditions ? this.conditions.predators : null;
            
            // Encontra um parceiro para reprodução
            const partner = this.predator.findReproductionPartner(predators);
            
            if (partner && partner.pos) {
                // Move em direção ao parceiro
                const direction = createVector(
                    partner.pos.x - this.predator.pos.x,
                    partner.pos.y - this.predator.pos.y
                );
                
                // Normaliza e aplica a velocidade
                direction.normalize();
                direction.mult(this.predator.maxSpeed * 0.8);
                
                // Aplica a direção ao movimento do predador
                if (this.predator.movement && typeof this.predator.movement.setDirection === 'function') {
                    this.predator.movement.setDirection(direction);
                }
            } else {
                // Se não encontrou parceiro, faz movimento aleatório de patrulha
                this.handlePatrollingState();
            }
        } catch (error) {
            console.error("Erro no estado de reprodução:", error);
            // Fallback para patrulha em caso de erro
            this.handlePatrollingState();
        }
    }

    /**
     * Gerencia o estado de caça
     */
    handleHuntingState() {
        try {
            // Verifica se a lista de bactérias está disponível no contexto
            const bacteria = this.conditions ? this.conditions.bacteria : null;
            
            // Usa findClosestPrey em vez de findNearestPrey que não existe
            const prey = this.predator.findClosestPrey(bacteria);
            
            if (prey && prey.pos) {
                // Move em direção à presa
                const direction = createVector(
                    prey.pos.x - this.predator.pos.x,
                    prey.pos.y - this.predator.pos.y
                );
                
                // Normaliza e aplica a velocidade
                direction.normalize();
                direction.mult(this.predator.maxSpeed * 1.2);
                
                // Aplica a direção ao movimento do predador
                if (this.predator.movement && typeof this.predator.movement.setDirection === 'function') {
                    this.predator.movement.setDirection(direction);
                }
            } else {
                // Se não encontrou presa, faz movimento aleatório de patrulha
                this.handlePatrollingState();
            }
        } catch (error) {
            console.error("Erro no estado de caça:", error);
            // Fallback para patrulha em caso de erro
            this.handlePatrollingState();
        }
    }

    /**
     * Gerencia o estado de patrulha
     */
    handlePatrollingState() {
        try {
            // Movimento aleatório
            if (random() < 0.05) {
                // Cria um vetor de direção aleatória
                const angle = random(TWO_PI);
                const direction = createVector(cos(angle), sin(angle));
                
                // Aplica a velocidade adequada para patrulha
                direction.mult(this.predator.maxSpeed * 0.7);
                
                // Aplica a direção ao movimento do predador
                if (this.predator.movement && typeof this.predator.movement.setDirection === 'function') {
                    this.predator.movement.setDirection(direction);
                }
            }
        } catch (error) {
            console.error("Erro no estado de patrulha:", error);
            // Em caso de erro, para o movimento
            if (this.predator.movement && typeof this.predator.movement.stop === 'function') {
                this.predator.movement.stop();
            }
        }
    }
}

// Torna a classe global
window.PredatorStates = PredatorStates; 