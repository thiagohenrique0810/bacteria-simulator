/**
 * Gerenciador de estados para bactérias
 * Controla os estados, ações e energia das bactérias
 */
class BacteriaStateManager {
    /**
     * Inicializa o gerenciador de estados
     * @param {Bacteria} bacteria - Referência para a bactéria
     */
    constructor(bacteria) {
        this.bacteria = bacteria;
        this.currentEnergy = 100;
        this.currentState = 'exploring';
        this.lastStateChangeTime = 0;
        
        // Adiciona contador para limitar o tempo de descanso
        this.restingTime = 0;
        this.maxRestingTime = 120; // Tempo máximo de descanso (2 segundos em 60fps)
        
        // Timer para forçar mudança de estado
        this.stateTimer = 0;
        this.forceExploreInterval = 180; // A cada 3 segundos, força exploração
        
        // Adiciona tempo de espera para evitar loops de estados
        this.stateChangeCooldown = 0;
        this.maxStateChangeCooldown = 30; // Meio segundo em 60fps
        
        // Cooldown específico para reprodução para evitar loop
        this.reproductionCooldown = 0;
        this.maxReproductionCooldown = 300; // 5 segundos em 60fps
        
        // Armazena o último estado para controle
        this.lastState = '';
        
        // Contador de alternâncias entre estados
        this.stateAlternations = {};
    }
    
    /**
     * Obtém o estado atual
     * @returns {string} Estado atual da bactéria
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Define o estado atual
     * @param {string} state - Novo estado para a bactéria
     */
    setCurrentState(state) {
        // Verifica se está no período de cooldown e impede mudanças frequentes de estado
        if (this.stateChangeCooldown > 0 && this.currentState !== state) {
            return;
        }
        
        // Verifica cooldown específico de reprodução
        if (state === 'reproducing' && this.reproductionCooldown > 0) {
            return;
        }
        
        // Controle de alternância de estados
        if (this.currentState !== state) {
            // Registra o par de alternância para detectar loops
            const statePair = `${this.currentState}->${state}`;
            this.stateAlternations[statePair] = (this.stateAlternations[statePair] || 0) + 1;
            
            // Se houver muitas alternâncias rápidas entre dois estados, força um terceiro estado
            if (this.stateAlternations[statePair] > 3 && 
                frameCount - this.lastStateChangeTime < 90) {
                console.log(`Detectado loop entre ${this.currentState} e ${state}. Forçando estado 'resting'`);
                state = 'resting';
                this.stateAlternations = {}; // Reseta contadores
            }
            
            this.lastState = this.currentState;
            this.lastStateChangeTime = frameCount;
            this.currentState = state;
            
            // Log da mudança de estado
            console.log(`Bactéria ${this.bacteria.id} mudou para estado: ${state}`);
            
            // Aplica cooldown para prevenir mudanças rápidas de estado
            this.stateChangeCooldown = this.maxStateChangeCooldown;
            
            // Se estamos entrando no estado de reprodução, aplica um cooldown específico
            if (state === 'reproducing') {
                this.reproductionCooldown = this.maxReproductionCooldown;
            }
            
            // Reseta o contador de descanso se mudar para outro estado
            if (state !== 'resting') {
                this.restingTime = 0;
            }
        }
    }
    
    /**
     * Obtém a energia atual
     * @returns {number} Valor atual de energia
     */
    getEnergy() {
        return this.currentEnergy;
    }
    
    /**
     * Adiciona energia à bactéria
     * @param {number} amount - Quantidade de energia a adicionar
     */
    addEnergy(amount) {
        this.currentEnergy = Math.min(100, this.currentEnergy + amount);
    }
    
    /**
     * Remove energia da bactéria
     * @param {number} amount - Quantidade de energia a remover
     */
    removeEnergy(amount) {
        this.currentEnergy = Math.max(0, this.currentEnergy - amount);
    }
    
    /**
     * Consome energia ao realizar uma ação
     * @param {number} amount - Quantidade de energia a consumir
     */
    consumeEnergy(amount) {
        this.removeEnergy(amount);
    }
    
    /**
     * Atualiza o gerenciador de estados
     * @param {Object} conditions - Condições do ambiente
     * @returns {Object} Informações sobre o estado atual
     */
    update(conditions = null) {
        // Log para debugging
        if (frameCount % 60 === 0) {
            console.log(`StateManager update: energy=${this.currentEnergy.toFixed(1)}, state=${this.currentState}, timer=${this.stateTimer}`);
        }
        
        // Decrementa cooldowns
        if (this.stateChangeCooldown > 0) {
            this.stateChangeCooldown--;
        }
        
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown--;
            
            if (this.reproductionCooldown === 0 && this.currentState === 'reproducing') {
                // Força saída do estado de reprodução quando o cooldown terminar
                this.setCurrentState('exploring');
            }
        }
        
        // Incrementa o timer geral
        this.stateTimer++;
        
        // Força estado de exploração de tempos em tempos para evitar ficar preso em descanso
        if (this.stateTimer >= this.forceExploreInterval) {
            this.setCurrentState('exploring');
            this.stateTimer = 0;
            console.log(`Forçando estado de exploração para bactéria ${this.bacteria.id}`);
        }
        
        // Se está descansando, incrementa o contador de descanso
        if (this.currentState === 'resting') {
            this.restingTime++;
            
            // Se descansar por muito tempo, força mudar para exploração
            if (this.restingTime >= this.maxRestingTime) {
                this.setCurrentState('exploring');
                this.restingTime = 0;
                console.log(`Interrompendo descanso por tempo excessivo para bactéria ${this.bacteria.id}`);
            }
        }
        
        // Determina o estado baseado nas condições, se não estiver no tempo de exploração forçada
        if (this.stateTimer < this.forceExploreInterval - 30 && this.stateChangeCooldown === 0) {
            if (conditions) {
                // Sempre prioriza fuga de predadores, ignorando qualquer cooldown
                if (conditions.predatorNearby) {
                    this.setCurrentState('fleeing');
                } 
                // Prioriza comida se estiver com menos de 70 de energia
                else if (conditions.foodNearby && this.currentEnergy < 70) {
                    this.setCurrentState('seekingFood');
                } 
                // Prioriza reprodução se tiver bastante energia e não estiver em cooldown
                else if (conditions.mateNearby && conditions.mateReady && this.currentEnergy > 80 && this.reproductionCooldown === 0) {
                    this.setCurrentState('reproducing');
                } 
                // Só descansa se a energia estiver muito baixa
                else if (this.currentEnergy < 20) {
                    this.setCurrentState('resting');
                } 
                // Caso contrário, explora
                else {
                    this.setCurrentState('exploring');
                }
                
                // Se há um estado forçado do Q-Learning, use-o apenas se não estiver em cooldown
                if (conditions.forcedState && this.stateChangeCooldown === 0) {
                    const previousState = this.currentState;
                    
                    switch (conditions.forcedState) {
                        case 'seekFood': this.setCurrentState('seekingFood'); break;
                        case 'seekMate': 
                            // Verifica cooldown de reprodução e se o parceiro está pronto
                            if (this.reproductionCooldown === 0 && conditions.mateReady) {
                                this.setCurrentState('reproducing'); 
                            }
                            break;
                        case 'rest': 
                            // Limita o estado de descanso por q-learning também
                            if (this.restingTime < this.maxRestingTime) {
                                this.setCurrentState('resting'); 
                            } else {
                                console.log(`Ignorando estado de descanso forçado por tempo excessivo`);
                            }
                            break;
                        case 'explore': this.setCurrentState('exploring'); break;
                    }
                }
            }
        }
        
        // Consume energia baseado no estado
        if (this.currentState === 'resting') {
            this.addEnergy(0.2); // Aumentado para recuperar energia mais rápido
        } else if (this.currentState === 'reproducing') {
            // Consume mais energia ao se reproduzir
            this.removeEnergy(0.15);
        } else {
            this.removeEnergy(0.05);
        }
        
        // IMPORTANTE: Nunca deixa a energia chegar em 0
        if (this.currentEnergy < 10) {
            this.currentEnergy = 10;
        }
        
        // Retorna informações sobre o estado atual
        return {
            state: this.currentState,
            energy: this.currentEnergy,
            shouldMove: this.currentState !== 'resting', // Só não se move se estiver descansando
            targetType: this.getTargetTypeFromState(),
            speedMultiplier: this.getSpeedMultiplierFromState()
        };
    }
    
    /**
     * Obtém o tipo de alvo com base no estado atual
     * @returns {string} Tipo de alvo para movimento
     */
    getTargetTypeFromState() {
        switch (this.currentState) {
            case 'seekingFood': return 'food';
            case 'reproducing': return 'mate';
            case 'fleeing': return 'escape';
            default: return 'random';
        }
    }
    
    /**
     * Obtém o multiplicador de velocidade com base no estado atual
     * @returns {number} Multiplicador de velocidade
     */
    getSpeedMultiplierFromState() {
        switch (this.currentState) {
            case 'fleeing': return 1.5; // Mais rápido ao fugir
            case 'seekingFood': return 1.2; // Um pouco mais rápido ao buscar comida
            case 'reproducing': return 0.8; // Mais lento ao se reproduzir
            case 'resting': return 0; // Parado ao descansar
            default: return 1; // Velocidade normal explorando
        }
    }
}

// Exporta a classe para uso global
window.BacteriaStateManager = BacteriaStateManager; 