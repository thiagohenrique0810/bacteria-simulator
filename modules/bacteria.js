/**
 * Módulo principal para controle de bactérias
 * Este arquivo carrega todos os componentes relacionados à bactéria
 */

// Importa os componentes modulares da bactéria
// No HTML, os arquivos dos componentes devem ser incluídos na ordem correta
// antes deste arquivo

// Redireciona versão antiga para nova implementação (se necessário)
if (typeof BacteriaBase !== 'undefined' && typeof BacteriaSocial !== 'undefined') {
    console.log("Módulos de bactéria carregados com sucesso");
} else {
    console.warn("Falha ao carregar módulos da bactéria. Alguns componentes podem não funcionar corretamente.");
}

// Se a classe Bacteria já estiver definida pelo novo módulo, não faz nada
// Caso contrário, cria uma implementação simplificada para compatibilidade
if (typeof window.Bacteria === 'undefined') {
    console.warn('Definindo classe Bacteria placeholder. A implementação completa não foi carregada.');
    
    // Versão simples da classe Bacteria para servir como fallback
    window.Bacteria = class Bacteria {
        constructor(x, y, parentDNA = null, energy = 100) {
            this.pos = createVector(x, y);
            this.size = 20;
            this.dna = new DNA(parentDNA);
            this.health = energy;
            this.energy = energy;
            this.age = 0;
            this.lifespan = this.dna.baseLifespan;
            this.isFemale = random() > 0.5;
            console.warn('Usando versão simplificada de Bacteria - funcionalidade limitada!');
        }

        update() {
            console.warn('Método update não implementado na versão de fallback');
            return null;
        }

        draw() {
            push();
            fill(this.isFemale ? color(255, 150, 200) : color(150, 200, 255));
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
            pop();
        }

        isDead() {
            return this.health <= 0 || this.age >= this.lifespan;
        }
    };
}

/**
 * Implementação de fallback para BacteriaStateManager
 */
if (typeof window.BacteriaStateManager === 'undefined') {
    console.warn('Definindo classe BacteriaStateManager placeholder.');
    
    window.BacteriaStateManager = class BacteriaStateManager {
        constructor() {
            this.energy = 100;
            this.currentState = 'exploring';
            
            // Adiciona contador para limitar o tempo de descanso
            this.restingTime = 0;
            this.maxRestingTime = 120; // Tempo máximo de descanso (2 segundos em 60fps)
            
            // Timer para forçar mudança de estado
            this.stateTimer = 0;
            this.forceExploreInterval = 180; // A cada 3 segundos, força exploração
        }
        
        getCurrentState() {
            return this.currentState;
        }
        
        setCurrentState(state) {
            this.currentState = state;
            // Reseta o contador de descanso se mudar para outro estado
            if (state !== 'resting') {
                this.restingTime = 0;
            }
        }
        
        getEnergy() {
            return this.energy;
        }
        
        addEnergy(amount) {
            this.energy = Math.min(100, this.energy + amount);
        }
        
        removeEnergy(amount) {
            this.energy = Math.max(0, this.energy - amount);
        }
        
        update(conditions) {
            // Log para debugging
            if (frameCount % 60 === 0) {
                console.log(`StateManager update: energy=${this.energy}, state=${this.currentState}, timer=${this.stateTimer}`);
            }
            
            // Incrementa o timer geral
            this.stateTimer++;
            
            // Força estado de exploração de tempos em tempos para evitar ficar preso em descanso
            if (this.stateTimer >= this.forceExploreInterval) {
                this.currentState = 'exploring';
                this.stateTimer = 0;
                console.log("Forçando estado de exploração");
            }
            
            // Se está descansando, incrementa o contador de descanso
            if (this.currentState === 'resting') {
                this.restingTime++;
                
                // Se descansar por muito tempo, força mudar para exploração
                if (this.restingTime >= this.maxRestingTime) {
                    this.currentState = 'exploring';
                    this.restingTime = 0;
                    console.log("Interrompendo descanso por tempo excessivo");
                }
            }
            
            // Determina o estado baseado nas condições, se não estiver no tempo de exploração forçada
            if (this.stateTimer < this.forceExploreInterval - 30) {
                if (conditions) {
                    // Sempre prioriza fuga de predadores
                    if (conditions.predatorNearby) {
                        this.currentState = 'fleeing';
                        this.restingTime = 0;
                    } 
                    // Prioriza comida se estiver com menos de 70 de energia
                    else if (conditions.foodNearby && this.energy < 70) {
                        this.currentState = 'seekingFood';
                        this.restingTime = 0;
                    } 
                    // Prioriza reprodução se tiver bastante energia
                    else if (conditions.mateNearby && this.energy > 80) {
                        this.currentState = 'reproducing';
                        this.restingTime = 0;
                    } 
                    // Só descansa se a energia estiver muito baixa
                    else if (this.energy < 20) {
                        this.currentState = 'resting';
                    } 
                    // Caso contrário, explora
                    else {
                        this.currentState = 'exploring';
                        this.restingTime = 0;
                    }
                    
                    // Se há um estado forçado do Q-Learning, use-o
                    if (conditions.forcedState) {
                        const previousState = this.currentState;
                        
                        switch (conditions.forcedState) {
                            case 'seekFood': this.currentState = 'seekingFood'; break;
                            case 'seekMate': this.currentState = 'reproducing'; break;
                            case 'rest': 
                                // Limita o estado de descanso por q-learning também
                                if (this.restingTime < this.maxRestingTime) {
                                    this.currentState = 'resting'; 
                                } else {
                                    console.log("Ignorando estado de descanso forçado por tempo excessivo");
                                }
                                break;
                            case 'explore': this.currentState = 'exploring'; break;
                        }
                        
                        // Reseta o contador de descanso se mudar de estado
                        if (previousState !== this.currentState && this.currentState !== 'resting') {
                            this.restingTime = 0;
                        }
                    }
                }
            }
            
            // Consume energia baseado no estado
            if (this.currentState === 'resting') {
                this.addEnergy(0.2); // Aumentado para recuperar energia mais rápido
            } else {
                this.removeEnergy(0.05);
            }
            
            // IMPORTANTE: Nunca deixa a energia chegar em 0
            if (this.energy < 10) {
                this.energy = 10;
            }
            
            // Retorna informações sobre o estado atual
            return {
                state: this.currentState,
                energy: this.energy,
                shouldMove: this.currentState !== 'resting', // Só não se move se estiver descansando
                targetType: this.getTargetTypeFromState(),
                speedMultiplier: this.getSpeedMultiplierFromState()
            };
        }
        
        getTargetTypeFromState() {
            switch (this.currentState) {
                case 'seekingFood': return 'food';
                case 'reproducing': return 'mate';
                case 'fleeing': return 'escape';
                default: return 'random';
            }
        }
        
        getSpeedMultiplierFromState() {
            switch (this.currentState) {
                case 'fleeing': return 1.5; // Mais rápido ao fugir
                case 'seekingFood': return 1.2; // Um pouco mais rápido ao buscar comida
                case 'reproducing': return 0.8; // Mais lento ao se reproduzir
                case 'resting': return 0; // Parado ao descansar
                default: return 1; // Velocidade normal explorando
            }
        }
    };
} 