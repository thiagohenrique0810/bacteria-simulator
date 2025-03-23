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
        
        // Parâmetros contínuos de movimento
        this.movementParams = {
            direction: 0,           // Direção de 0-360 graus
            speed: 0.5,             // Velocidade de 0-1
            wanderStrength: 0.3,    // Intensidade do movimento aleatório
            noiseStrength: 0.2,     // Intensidade do ruído perlin
            targetWeight: 0.5       // Peso do alvo vs. movimento aleatório
        };
        
        // Estado de transição para suavização de mudanças
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionDuration = 30; // Meio segundo em 60fps
        this.transitionFromState = '';
        this.transitionToState = '';
    }
    
    /**
     * Obtém o estado atual
     * @returns {string} Estado atual da bactéria
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Obtém os parâmetros de movimento atuais
     * @returns {Object} Parâmetros de movimento
     */
    getMovementParams() {
        return this.movementParams;
    }
    
    /**
     * Define os parâmetros de movimento
     * @param {Object} params - Novos parâmetros de movimento
     */
    setMovementParams(params) {
        if (!params) return;
        
        // Atualiza apenas os parâmetros definidos, mantendo os valores anteriores para os demais
        this.movementParams = {
            ...this.movementParams,
            ...params
        };
    }
    
    /**
     * Define o estado atual com transição suave
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
            
            // Configura a transição suave entre estados
            this.isTransitioning = true;
            this.transitionStartTime = frameCount;
            this.transitionFromState = this.currentState;
            this.transitionToState = state;
            
            this.lastState = this.currentState;
            this.lastStateChangeTime = frameCount;
            this.currentState = state;
            
            // Log da mudança de estado
            console.log(`Bactéria ${this.bacteria.id} está mudando para estado: ${state}`);
            
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
     * Processa a transição suave entre estados
     */
    updateTransition() {
        if (!this.isTransitioning) return;
        
        // Calcula o progresso da transição (0 a 1)
        const elapsed = frameCount - this.transitionStartTime;
        const progress = Math.min(1, elapsed / this.transitionDuration);
        
        // Se a transição foi concluída
        if (progress >= 1) {
            this.isTransitioning = false;
            return;
        }
        
        // Funções de easing para suavizar a transição (easeInOutCubic)
        const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
        // Não precisamos fazer interpolação de estado, pois estados são discretos
        // Mas poderíamos ajustar os parâmetros de movimento durante a transição, se necessário
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
     * @param {Object} actionOutput - Saída do sistema de aprendizado
     * @returns {Object} Informações sobre o estado atual
     */
    update(conditions = null, actionOutput = null) {
        // Processa transições suaves
        this.updateTransition();
        
        // Atualiza parâmetros de movimento com base na saída do sistema de aprendizado
        if (actionOutput && actionOutput.movementParams) {
            this.setMovementParams(actionOutput.movementParams);
        }
        
        // Define o estado com base na decisão da IA (se fornecida)
        if (actionOutput && actionOutput.action) {
            this.setCurrentState(actionOutput.action);
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
        
        // Gerenciamento de energia com base no estado atual
        if (this.currentState === 'resting') {
            // Recupera energia durante descanso
            this.addEnergy(0.15);
            this.restingTime++;
            
            // Sai do descanso após um tempo ou quando a energia estiver completa
            if (this.restingTime > this.maxRestingTime || this.currentEnergy >= 98) {
                this.setCurrentState('exploring');
            }
        } else if (this.currentState === 'reproducing') {
            // Gasto alto de energia durante reprodução
            this.consumeEnergy(0.3);
        } else if (this.currentState === 'seekingFood' || this.currentState === 'seekFood') {
            // Gasto moderado de energia durante busca por comida
            this.consumeEnergy(0.1);
        } else if (this.currentState === 'seekingMate' || this.currentState === 'seekMate') {
            // Gasto moderado de energia durante busca por parceiro
            this.consumeEnergy(0.15);
        } else if (this.currentState === 'exploring' || this.currentState === 'explore') {
            // Gasto normal de energia durante exploração
            this.consumeEnergy(0.08);
        } else if (this.currentState === 'fleeing') {
            // Gasto alto de energia durante fuga
            this.consumeEnergy(0.25);
        }
        
        // Se a energia estiver muito baixa, força o estado de descanso
        if (this.currentEnergy < 15 && this.currentState !== 'resting') {
            this.setCurrentState('resting');
        }
        
        // Força exploração ocasionalmente se ficar preso no mesmo estado
        this.stateTimer++;
        if (this.stateTimer > this.forceExploreInterval && 
            this.currentState !== 'exploring' && 
            this.currentState !== 'reproducing') {
            this.setCurrentState('exploring');
            this.stateTimer = 0;
        }
        
        // Reset do timer se não estamos explorando
        if (this.currentState === 'exploring') {
            this.stateTimer = 0;
        }
        
        // Retorna informações sobre o estado atual
        return {
            state: this.currentState,
            energy: this.currentEnergy,
            isTransitioning: this.isTransitioning,
            movementParams: this.movementParams
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