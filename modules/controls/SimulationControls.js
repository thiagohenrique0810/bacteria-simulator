/**
 * Controles específicos da simulação
 */
window.SimulationControls = class SimulationControls extends ControlsBase {
    /**
     * Inicializa os controles de simulação
     * @param {HTMLElement} container - Container para os controles
     */
    constructor(container) {
        super();
        this.container = container;
        this.setupControls();
    }

    /**
     * Configura os controles de simulação
     */
    setupControls() {
        const simDiv = this.createSection(this.container, 'Controles de Simulação');

        // Velocidade da simulação (aumentando o máximo para 5)
        this.speedSlider = createSlider(0.1, 5, 1, 0.1);
        this.speedSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Velocidade:', this.speedSlider);

        // Botões de controle principais
        const mainButtonsDiv = createDiv();
        mainButtonsDiv.style('margin', '15px 0');
        mainButtonsDiv.style('display', 'flex');
        mainButtonsDiv.style('gap', '10px');
        
        this.pauseButton = createButton('Pausar');
        this.resetButton = createButton('Reiniciar');
        
        // Estiliza os botões
        [this.pauseButton, this.resetButton].forEach(button => {
            button.style('padding', '8px 15px');
            button.style('border', 'none');
            button.style('border-radius', '4px');
            button.style('background', '#4CAF50');
            button.style('color', 'white');
            button.style('cursor', 'pointer');
            button.style('transition', 'background 0.3s');
            button.style('font-size', '14px');
            button.style('font-family', 'Arial, sans-serif');
            button.mouseOver(() => button.style('background', '#45a049'));
            button.mouseOut(() => button.style('background', '#4CAF50'));
        });
        
        mainButtonsDiv.child(this.pauseButton);
        mainButtonsDiv.child(this.resetButton);
        simDiv.child(mainButtonsDiv);

        // Número inicial de bactérias (NOVO)
        this.initialBacteriaSlider = createSlider(5, 100, 20, 5);
        this.initialBacteriaSlider.elt.type = 'range';
        const initialBacteriaRow = this.addControlRow(simDiv, 'Bactérias Iniciais:', this.initialBacteriaSlider);
        
        // Contador para número inicial de bactérias
        this.initialBacteriaValue = createSpan('20');
        this.initialBacteriaValue.style('margin-left', '10px');
        this.initialBacteriaValue.style('font-weight', 'bold');
        this.initialBacteriaValue.style('color', '#ffcc00');
        initialBacteriaRow.child(this.initialBacteriaValue);
        
        // Proporção de fêmeas (NOVO)
        this.femaleRatioSlider = createSlider(0, 100, 50, 5);
        this.femaleRatioSlider.elt.type = 'range';
        const femaleRatioRow = this.addControlRow(simDiv, 'Fêmeas (%):', this.femaleRatioSlider);
        
        // Contador para proporção de fêmeas
        this.femaleRatioValue = createSpan('50%');
        this.femaleRatioValue.style('margin-left', '10px');
        this.femaleRatioValue.style('font-weight', 'bold');
        this.femaleRatioValue.style('color', '#ffcc00');
        femaleRatioRow.child(this.femaleRatioValue);
        
        // Seção de controle "Adicionar Bactérias" (NOVO)
        const addBacteriaDiv = createDiv();
        addBacteriaDiv.style('margin-top', '15px');
        addBacteriaDiv.style('padding', '15px');
        addBacteriaDiv.style('background-color', 'rgba(65, 105, 225, 0.3)');
        addBacteriaDiv.style('border-radius', '8px');
        addBacteriaDiv.style('border', '2px solid rgba(100, 149, 237, 0.8)');
        addBacteriaDiv.style('box-shadow', '0 0 10px rgba(70, 130, 180, 0.5)');
        simDiv.child(addBacteriaDiv);
        
        // Título da seção
        const addBacteriaTitle = createDiv('Adicionar Bactérias');
        addBacteriaTitle.style('font-weight', 'bold');
        addBacteriaTitle.style('margin-bottom', '5px');
        addBacteriaTitle.style('color', '#80c9ff');
        addBacteriaTitle.style('font-size', '16px');
        addBacteriaTitle.style('text-align', 'center');
        addBacteriaDiv.child(addBacteriaTitle);
        
        // Mensagem explicativa
        const addBacteriaInfo = createDiv('A simulação começa sem bactérias. Use este controle para adicionar bactérias ao ambiente.');
        addBacteriaInfo.style('font-size', '12px');
        addBacteriaInfo.style('color', '#ccddff');
        addBacteriaInfo.style('margin-bottom', '12px');
        addBacteriaInfo.style('text-align', 'center');
        addBacteriaInfo.style('line-height', '1.4');
        addBacteriaDiv.child(addBacteriaInfo);
        
        // Quantidade para adicionar
        this.addBacteriaAmountSlider = createSlider(1, 50, 10, 1);
        this.addBacteriaAmountSlider.elt.type = 'range';
        const addBacteriaAmountRow = this.addControlRow(addBacteriaDiv, 'Quantidade:', this.addBacteriaAmountSlider);
        
        // Contador para quantidade
        this.addBacteriaAmountValue = createSpan('10');
        this.addBacteriaAmountValue.style('margin-left', '10px');
        this.addBacteriaAmountValue.style('font-weight', 'bold');
        this.addBacteriaAmountValue.style('color', '#ffcc00');
        addBacteriaAmountRow.child(this.addBacteriaAmountValue);
        
        // Proporção de fêmeas para adicionar
        this.addBacteriaFemaleRatioSlider = createSlider(0, 100, 50, 5);
        this.addBacteriaFemaleRatioSlider.elt.type = 'range';
        const addBacteriaFemaleRatioRow = this.addControlRow(addBacteriaDiv, 'Fêmeas (%):', this.addBacteriaFemaleRatioSlider);
        
        // Contador para proporção de fêmeas ao adicionar
        this.addBacteriaFemaleRatioValue = createSpan('50%');
        this.addBacteriaFemaleRatioValue.style('margin-left', '10px');
        this.addBacteriaFemaleRatioValue.style('font-weight', 'bold');
        this.addBacteriaFemaleRatioValue.style('color', '#ffcc00');
        addBacteriaFemaleRatioRow.child(this.addBacteriaFemaleRatioValue);
        
        // Botão para adicionar bactérias
        this.addBacteriaButton = createButton('Adicionar Bactérias');
        this.addBacteriaButton.style('margin-top', '15px');
        this.addBacteriaButton.style('padding', '10px 15px');
        this.addBacteriaButton.style('width', '100%');
        this.addBacteriaButton.style('border', 'none');
        this.addBacteriaButton.style('border-radius', '4px');
        this.addBacteriaButton.style('background', '#1e90ff');
        this.addBacteriaButton.style('color', 'white');
        this.addBacteriaButton.style('cursor', 'pointer');
        this.addBacteriaButton.style('transition', 'all 0.3s');
        this.addBacteriaButton.style('font-weight', 'bold');
        this.addBacteriaButton.style('font-size', '15px');
        this.addBacteriaButton.style('letter-spacing', '0.5px');
        this.addBacteriaButton.style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.2)');
        this.addBacteriaButton.mouseOver(() => {
            this.addBacteriaButton.style('background', '#0066cc');
            this.addBacteriaButton.style('transform', 'scale(1.03)');
        });
        this.addBacteriaButton.mouseOut(() => {
            this.addBacteriaButton.style('background', '#1e90ff');
            this.addBacteriaButton.style('transform', 'scale(1)');
        });
        addBacteriaDiv.child(this.addBacteriaButton);

        // Controles de população
        this.populationLimitSlider = createSlider(20, 500, 100, 10);
        this.populationLimitSlider.elt.type = 'range';
        const popLimitRow = this.addControlRow(simDiv, 'Máx. Bactérias:', this.populationLimitSlider);
        
        // Adiciona contador para mostrar o valor atual
        this.popLimitValue = createSpan('100');
        this.popLimitValue.style('margin-left', '10px');
        this.popLimitValue.style('font-weight', 'bold');
        this.popLimitValue.style('color', '#ffcc00');
        popLimitRow.child(this.popLimitValue);
        
        // Adiciona descrição para o controle de população
        const popLimitDesc = createDiv('Define o número máximo de bactérias permitidas na simulação.');
        popLimitDesc.style('font-size', '10px');
        popLimitDesc.style('color', '#aaa');
        popLimitDesc.style('margin-bottom', '10px');
        popLimitDesc.style('padding-left', '5px');
        simDiv.child(popLimitDesc);

        // Energia inicial (aumentando o valor padrão)
        this.initialEnergySlider = createSlider(50, 200, 150, 10);
        this.initialEnergySlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Energia Inicial:', this.initialEnergySlider);

        // Tempo de vida (aumentando o valor padrão)
        this.lifespanSlider = createSlider(1, 48, 24, 1);
        this.lifespanSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Tempo de Vida (h):', this.lifespanSlider);

        // Perda de saúde (diminuindo o valor padrão)
        this.healthLossSlider = createSlider(0.01, 0.3, 0.05, 0.01);
        this.healthLossSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Perda de Saúde:', this.healthLossSlider);

        // Intervalo de alimentação (aumentando o valor padrão)
        this.feedingIntervalSlider = createSlider(1, 15, 8, 1);
        this.feedingIntervalSlider.elt.type = 'range';
        this.addControlRow(simDiv, 'Intervalo Alimentação (min):', this.feedingIntervalSlider);
        
        // Botão para ativar/desativar chat de bactérias
        this.chatToggleDiv = createDiv();
        this.chatToggleDiv.style('margin-top', '20px');
        this.chatToggleDiv.style('padding', '10px 15px');
        this.chatToggleDiv.style('background-color', 'rgba(45, 45, 55, 0.8)');
        this.chatToggleDiv.style('border-radius', '5px');
        this.chatToggleDiv.style('border', '1px solid rgba(60, 60, 80, 0.5)');
        simDiv.child(this.chatToggleDiv);
        
        // Título da seção
        const chatToggleTitle = createDiv('Chat de Bactérias');
        chatToggleTitle.style('font-weight', 'bold');
        chatToggleTitle.style('margin-bottom', '8px');
        chatToggleTitle.style('font-size', '14px');
        chatToggleTitle.style('color', '#8cb4ff');
        this.chatToggleDiv.child(chatToggleTitle);
        
        // Botões para controlar o chat
        this.chatButtonsDiv = createDiv();
        this.chatButtonsDiv.style('display', 'flex');
        this.chatButtonsDiv.style('gap', '10px');
        this.chatToggleDiv.child(this.chatButtonsDiv);
        
        // Botão para mostrar/esconder chat
        this.toggleChatButton = createButton('Esconder Chat');
        this.toggleChatButton.style('flex', '1');
        this.toggleChatButton.style('padding', '8px 10px');
        this.toggleChatButton.style('border', 'none');
        this.toggleChatButton.style('border-radius', '4px');
        this.toggleChatButton.style('background-color', '#4d94ff');
        this.toggleChatButton.style('color', 'white');
        this.toggleChatButton.style('cursor', 'pointer');
        this.toggleChatButton.style('font-size', '13px');
        this.toggleChatButton.mouseOver(() => this.toggleChatButton.style('background-color', '#3a7fcf'));
        this.toggleChatButton.mouseOut(() => this.toggleChatButton.style('background-color', '#4d94ff'));
        this.chatButtonsDiv.child(this.toggleChatButton);
        
        // Botão para limpar chat (atalho para o botão no chat)
        this.clearChatButton = createButton('Limpar Chat');
        this.clearChatButton.style('flex', '1');
        this.clearChatButton.style('padding', '8px 10px');
        this.clearChatButton.style('border', 'none');
        this.clearChatButton.style('border-radius', '4px');
        this.clearChatButton.style('background-color', '#ff6b6b');
        this.clearChatButton.style('color', 'white');
        this.clearChatButton.style('cursor', 'pointer');
        this.clearChatButton.style('font-size', '13px');
        this.clearChatButton.mouseOver(() => this.clearChatButton.style('background-color', '#e55c5c'));
        this.clearChatButton.mouseOut(() => this.clearChatButton.style('background-color', '#ff6b6b'));
        this.chatButtonsDiv.child(this.clearChatButton);
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners(callbacks) {
        if (!callbacks) return;

        // Configura os botões principais
        this.pauseButton.mousePressed(() => {
            const isPaused = this.pauseButton.html() === 'Continuar';
            this.pauseButton.html(isPaused ? 'Pausar' : 'Continuar');
            if (callbacks.onPauseToggle) {
                callbacks.onPauseToggle(!isPaused);
            }
        });

        this.resetButton.mousePressed(() => {
            if (confirm('Tem certeza que deseja reiniciar a simulação?')) {
                if (callbacks.onReset) {
                    callbacks.onReset();
                }
            }
        });

        // Função auxiliar para notificar mudanças
        const notifyChange = () => {
            if (callbacks.onChange) {
                callbacks.onChange(this.getState());
            }
        };

        // Eventos de simulação
        this.speedSlider.input(() => {
            if (callbacks.onSpeedChange) {
                callbacks.onSpeedChange(this.speedSlider.value());
            }
            notifyChange();
        });

        // Eventos para os sliders de população inicial e proporção de fêmeas
        this.initialBacteriaSlider.input(() => {
            // Atualiza o texto do contador
            this.initialBacteriaValue.html(this.initialBacteriaSlider.value());
            notifyChange();
        });
        
        this.femaleRatioSlider.input(() => {
            // Atualiza o texto do contador
            this.femaleRatioValue.html(this.femaleRatioSlider.value() + '%');
            notifyChange();
        });
        
        // Eventos para os controles de adicionar bactérias
        this.addBacteriaAmountSlider.input(() => {
            // Atualiza o texto do contador
            this.addBacteriaAmountValue.html(this.addBacteriaAmountSlider.value());
        });
        
        this.addBacteriaFemaleRatioSlider.input(() => {
            // Atualiza o texto do contador
            this.addBacteriaFemaleRatioValue.html(this.addBacteriaFemaleRatioSlider.value() + '%');
        });

        this.populationLimitSlider.input(() => {
            // Atualiza o texto do contador
            this.popLimitValue.html(this.populationLimitSlider.value());
            notifyChange();
        });

        this.initialEnergySlider.input(notifyChange);
        this.lifespanSlider.input(() => {
            if (callbacks.onLifespanChange) {
                callbacks.onLifespanChange(this.lifespanSlider.value() * 3600);
            }
            notifyChange();
        });

        this.healthLossSlider.input(() => {
            if (callbacks.onHealthLossChange) {
                callbacks.onHealthLossChange(this.healthLossSlider.value());
            }
            notifyChange();
        });

        this.feedingIntervalSlider.input(() => {
            if (callbacks.onFeedingIntervalChange) {
                callbacks.onFeedingIntervalChange(this.feedingIntervalSlider.value() * 60);
            }
            notifyChange();
        });

        // Eventos para os botões de controle do chat
        this.toggleChatButton.mousePressed(() => {
            // Referência ao chat
            const chatElement = document.getElementById('bacteria-chat');
            if (chatElement) {
                // Verifica o estado atual
                const isVisible = chatElement.style.display !== 'none';
                
                if (isVisible) {
                    // Esconde o chat
                    chatElement.style.display = 'none';
                    this.toggleChatButton.html('Mostrar Chat');
                    // Reajusta o layout do canvas se necessário
                    if (window.windowResized) window.windowResized();
                } else {
                    // Mostra o chat
                    chatElement.style.display = 'flex';
                    this.toggleChatButton.html('Esconder Chat');
                    // Reajusta o layout do canvas se necessário
                    if (window.windowResized) window.windowResized();
                }
            }
        });
        
        this.clearChatButton.mousePressed(() => {
            // Referência ao sistema de comunicação
            if (window.communication && typeof window.communication.clearChat === 'function') {
                window.communication.clearChat();
            }
        });

        // Evento do botão de adicionar bactérias
        this.addBacteriaButton.mousePressed(() => {
            console.log("Botão de adicionar bactérias clicado!");
            console.log("Quantidade:", this.addBacteriaAmountSlider.value());
            console.log("Proporção de fêmeas:", this.addBacteriaFemaleRatioSlider.value(), "%");
            
            if (callbacks.onAddBacteria) {
                console.log("Callback onAddBacteria disponível, chamando...");
                callbacks.onAddBacteria(
                    this.addBacteriaAmountSlider.value(),
                    this.addBacteriaFemaleRatioSlider.value()
                );
            } else {
                console.error("Callback onAddBacteria NÃO está disponível!");
            }
        });
    }

    /**
     * Retorna o estado atual dos controles
     */
    getState() {
        return {
            simulationSpeed: Number(this.speedSlider?.value()) || 1,
            populationLimit: Number(this.populationLimitSlider?.value()) || 100,
            initialEnergy: Number(this.initialEnergySlider?.value()) || 100,
            lifespan: Number(this.lifespanSlider?.value()) || 12,
            healthLossRate: Number(this.healthLossSlider?.value()) || 0.05,
            feedingInterval: Number(this.feedingIntervalSlider?.value()) || 4,
            initialBacteria: Number(this.initialBacteriaSlider?.value()) || 20,
            femaleRatio: Number(this.femaleRatioSlider?.value()) || 50
        };
    }
}; 