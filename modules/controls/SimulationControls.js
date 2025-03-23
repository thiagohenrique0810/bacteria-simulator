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

        // NOVA SEÇÃO: Controles visuais para as bactérias
        const visualControlsDiv = this.createSection(this.container, 'Controles Visuais');
        visualControlsDiv.style('margin-top', '20px');
        visualControlsDiv.style('background-color', 'rgba(75, 0, 130, 0.2)');
        visualControlsDiv.style('border-radius', '8px');
        visualControlsDiv.style('border', '2px solid rgba(147, 112, 219, 0.5)');
        visualControlsDiv.style('padding', '15px');
        
        // Trilhas de movimento
        const trailsGroup = createDiv();
        trailsGroup.style('margin-bottom', '15px');
        trailsGroup.style('padding-bottom', '15px');
        trailsGroup.style('border-bottom', '1px solid rgba(147, 112, 219, 0.3)');
        visualControlsDiv.child(trailsGroup);
        
        // Cabeçalho: Trilhas
        const trailsHeader = createDiv('Trilhas de Movimento');
        trailsHeader.style('font-weight', 'bold');
        trailsHeader.style('margin-bottom', '10px');
        trailsHeader.style('color', '#c8a2c8');
        trailsGroup.child(trailsHeader);
        
        // Checkbox para habilitar/desabilitar trilhas
        this.showTrailsCheckbox = createCheckbox('Mostrar trilhas', true);
        this.showTrailsCheckbox.style('margin-bottom', '8px');
        this.showTrailsCheckbox.style('color', '#e6e6fa');
        trailsGroup.child(this.showTrailsCheckbox);
        
        // Opacidade das trilhas
        this.trailOpacitySlider = createSlider(0.1, 1.0, 0.6, 0.1);
        const trailOpacityRow = this.addControlRow(trailsGroup, 'Opacidade:', this.trailOpacitySlider);
        trailOpacityRow.style('margin-bottom', '8px');
        trailOpacityRow.style('color', '#e6e6fa');
        
        // Comprimento das trilhas
        this.trailLengthSlider = createSlider(5, 50, 30, 5);
        const trailLengthRow = this.addControlRow(trailsGroup, 'Comprimento:', this.trailLengthSlider);
        trailLengthRow.style('margin-bottom', '8px');
        trailLengthRow.style('color', '#e6e6fa');
        
        // Grupo: Tipos de bactérias
        const bacteriaTypesGroup = createDiv();
        bacteriaTypesGroup.style('margin-bottom', '15px');
        visualControlsDiv.child(bacteriaTypesGroup);
        
        // Cabeçalho: Tipos de bactérias
        const typesHeader = createDiv('Tipos de Bactérias');
        typesHeader.style('font-weight', 'bold');
        typesHeader.style('margin-bottom', '10px');
        typesHeader.style('color', '#c8a2c8');
        bacteriaTypesGroup.child(typesHeader);
        
        // Descrição
        const typesDescription = createDiv('Selecione a distribuição dos tipos de bactérias');
        typesDescription.style('font-size', '12px');
        typesDescription.style('color', '#e6e6fa');
        typesDescription.style('margin-bottom', '10px');
        bacteriaTypesGroup.child(typesDescription);
        
        // Controles deslizantes para cada tipo de bactéria
        // Bacilos
        this.bacilosSlider = createSlider(0, 100, 25, 5);
        const bacilosRow = this.addControlRow(bacteriaTypesGroup, 'Bacilos (%):', this.bacilosSlider);
        bacilosRow.style('margin-bottom', '5px');
        bacilosRow.style('color', '#e6e6fa');
        
        // Cocos
        this.cocosSlider = createSlider(0, 100, 25, 5);
        const cocosRow = this.addControlRow(bacteriaTypesGroup, 'Cocos (%):', this.cocosSlider);
        cocosRow.style('margin-bottom', '5px');
        cocosRow.style('color', '#e6e6fa');
        
        // Espirilos
        this.espirilosSlider = createSlider(0, 100, 25, 5);
        const espirilosRow = this.addControlRow(bacteriaTypesGroup, 'Espirilos (%):', this.espirilosSlider);
        espirilosRow.style('margin-bottom', '5px');
        espirilosRow.style('color', '#e6e6fa');
        
        // Vibriões
        this.vibrioesSlider = createSlider(0, 100, 25, 5);
        const vibrioesRow = this.addControlRow(bacteriaTypesGroup, 'Vibriões (%):', this.vibrioesSlider);
        vibrioesRow.style('margin-bottom', '5px');
        vibrioesRow.style('color', '#e6e6fa');
        
        // Botão para aplicar distribuição personalizada
        this.applyTypesButton = createButton('Aplicar aos Novos');
        this.applyTypesButton.style('margin-top', '10px');
        this.applyTypesButton.style('padding', '5px 10px');
        this.applyTypesButton.style('background', '#9370db');
        this.applyTypesButton.style('color', 'white');
        this.applyTypesButton.style('border', 'none');
        this.applyTypesButton.style('border-radius', '4px');
        this.applyTypesButton.style('cursor', 'pointer');
        this.applyTypesButton.mouseOver(() => this.applyTypesButton.style('background', '#8a66cc'));
        this.applyTypesButton.mouseOut(() => this.applyTypesButton.style('background', '#9370db'));
        bacteriaTypesGroup.child(this.applyTypesButton);
    }

    /**
     * Configura os event listeners para os controles
     * @param {Object} callbacks - Objeto com funções de callback
     */
    setupEventListeners(callbacks) {
        console.log('🔧 Configurando event listeners para os controles da simulação');

        // Configura o botão de pausar
        this.pauseButton.mousePressed(() => {
            const isPaused = togglePause();
            this.pauseButton.html(isPaused ? 'Continuar' : 'Pausar');
            if (callbacks && callbacks.onPauseToggle) {
                callbacks.onPauseToggle(isPaused);
            }
        });

        // Configura o botão de reiniciar
        this.resetButton.mousePressed(() => {
            if (callbacks && callbacks.onReset) {
                callbacks.onReset();
            }
        });

        // Slider de velocidade
        this.speedSlider.input(() => {
            const value = this.speedSlider.value();
            if (callbacks && callbacks.onSpeedChange) {
                callbacks.onSpeedChange(value);
            }
        });

        // Sliders de parâmetros de bactérias
        this.initialBacteriaSlider.input(() => {
            const value = parseInt(this.initialBacteriaSlider.value());
            this.initialBacteriaValue.html(value);
            if (callbacks && callbacks.onChange) {
                callbacks.onChange({ initialBacteria: value });
            }
        });

        // Slider de proporção de fêmeas
        this.femaleRatioSlider.input(() => {
            const value = parseInt(this.femaleRatioSlider.value());
            this.femaleRatioValue.html(value + '%');
            if (callbacks && callbacks.onChange) {
                callbacks.onChange({ femaleRatio: value });
            }
        });

        // Slider de limite de população
        this.populationLimitSlider.input(() => {
            const value = parseInt(this.populationLimitSlider.value());
            this.popLimitValue.html(value);
            if (callbacks && callbacks.onChange) {
                callbacks.onChange({ populationLimit: value });
            }
        });

        // Slider de energia inicial
        this.initialEnergySlider.input(() => {
            const value = parseInt(this.initialEnergySlider.value());
            if (callbacks && callbacks.onChange) {
                callbacks.onChange({ initialEnergy: value });
            }
        });

        // Slider de tempo de vida
        this.lifespanSlider.input(() => {
            const value = parseInt(this.lifespanSlider.value()) * 3600; // Converte horas para segundos
            if (callbacks && callbacks.onLifespanChange) {
                callbacks.onLifespanChange(value);
            }
        });

        // Slider de perda de saúde
        this.healthLossSlider.input(() => {
            const value = parseFloat(this.healthLossSlider.value());
            if (callbacks && callbacks.onHealthLossChange) {
                callbacks.onHealthLossChange(value);
            }
        });

        // Slider de intervalo de alimentação
        this.feedingIntervalSlider.input(() => {
            const value = parseInt(this.feedingIntervalSlider.value()) * 60; // Converte minutos para segundos
            if (callbacks && callbacks.onFeedingIntervalChange) {
                callbacks.onFeedingIntervalChange(value);
            }
        });

        // Configura o botão de adicionar bactérias
        console.log('🔧 Tentando configurar o botão de adicionar bactérias...');
        
        if (!this.addBacteriaButton) {
            console.error('❌ ERRO: Botão addBacteriaButton não está definido em this');
            console.log('🔍 Tentando recuperar o botão pelo DOM...');
            
            // Tenta encontrar pelo DOM
            try {
                const buttonSelector = 'button:contains("Adicionar Bactérias")';
                const buttonElements = document.querySelectorAll('button');
                let found = false;
                
                console.log(`🔍 Encontrados ${buttonElements.length} botões no DOM`);
                
                buttonElements.forEach((btn, index) => {
                    const text = btn.innerText || btn.textContent;
                    console.log(`Botão ${index}: "${text}"`);
                    
                    if (text && text.includes('Adicionar Bactérias')) {
                        console.log(`✅ Botão encontrado: "${text}"`);
                        this.addBacteriaButton = btn;
                        found = true;
                    }
                });
                
                if (!found) {
                    console.log('🔍 Não foi possível encontrar o botão pelo texto, tentando usar p5.js...');
                    // Se estamos usando p5.js, podemos tentar recuperar pelo seletor específico
                    const p5buttons = selectAll('button');
                    p5buttons.forEach((btn, index) => {
                        const text = btn.html();
                        if (text && text.includes('Adicionar Bactérias')) {
                            console.log(`✅ Botão encontrado via p5.js: "${text}"`);
                            this.addBacteriaButton = btn.elt;
                            found = true;
                        }
                    });
                }
                
                if (!found) {
                    console.error('❌ ERRO: Não foi possível encontrar o botão de nenhuma forma');
                    this.createEmergencyButton(callbacks);
                    return;
                }
            } catch (error) {
                console.error('❌ ERRO ao tentar recuperar o botão:', error);
                this.createEmergencyButton(callbacks);
                return;
            }
        }
        
        try {
            console.log('🔧 Configurando listener para:', this.addBacteriaButton);
            
            // Verificar se estamos lidando com um elemento DOM ou um objeto p5.js
            const isP5Button = this.addBacteriaButton.elt !== undefined;
            
            if (isP5Button) {
                // Se for um objeto p5.js, configuramos o evento mousePressed
                console.log('🔍 Detectado como objeto p5.js, usando mousePressed');
                this.addBacteriaButton.mousePressed(() => {
                    console.log('🖱️ Botão de adicionar bactérias foi clicado! (via p5.js)');
                    
                    // Obter valores dos sliders apropriados
                    const count = parseInt(this.addBacteriaAmountSlider.value() || 10);
                    const femaleRatio = parseFloat(this.addBacteriaFemaleRatioSlider.value() || 50);
                    
                    console.log(`📊 Valores a serem enviados: ${count} bactérias, ${femaleRatio}% fêmeas`);
                    
                    if (callbacks && typeof callbacks.onAddBacteria === 'function') {
                        callbacks.onAddBacteria(count, femaleRatio);
                        console.log('✅ Callback onAddBacteria executado');
                    } else {
                        console.error('❌ Callback onAddBacteria não está disponível');
                        this.tryAlternativeMethods(count, femaleRatio);
                    }
                });
            } else {
                // Se for um elemento DOM nativo, podemos usar cloneNode e addEventListener
                console.log('🔍 Detectado como elemento DOM nativo, usando addEventListener');
                
                // Remover listeners antigos para evitar duplicação
                const newButton = this.addBacteriaButton.cloneNode(true);
                if (this.addBacteriaButton.parentNode) {
                    this.addBacteriaButton.parentNode.replaceChild(newButton, this.addBacteriaButton);
                    this.addBacteriaButton = newButton;
                }
                
                // Configura o event listener
                this.addBacteriaButton.addEventListener('click', () => {
                    console.log('🖱️ Botão de adicionar bactérias foi clicado! (via DOM)');
                    
                    // Obter valores dos sliders apropriados
                    const count = parseInt(this.addBacteriaAmountSlider.value() || 10);
                    const femaleRatio = parseFloat(this.addBacteriaFemaleRatioSlider.value() || 50);
                    
                    console.log(`📊 Valores a serem enviados: ${count} bactérias, ${femaleRatio}% fêmeas`);
                    
                    if (callbacks && typeof callbacks.onAddBacteria === 'function') {
                        callbacks.onAddBacteria(count, femaleRatio);
                        console.log('✅ Callback onAddBacteria executado');
                    } else {
                        console.error('❌ Callback onAddBacteria não está disponível');
                        this.tryAlternativeMethods(count, femaleRatio);
                    }
                });
            }
            
            console.log('✅ Botão de adicionar bactérias configurado com sucesso');
        } catch (error) {
            console.error('❌ ERRO ao configurar botão de adicionar bactérias:', error);
            this.createEmergencyButton(callbacks);
        }

        // Checkbox para mostrar trilhas
        const showTrailsCheckbox = document.getElementById('show-trails-checkbox');
        if (showTrailsCheckbox && callbacks.onShowTrailsChange) {
            showTrailsCheckbox.addEventListener('change', () => {
                callbacks.onShowTrailsChange(showTrailsCheckbox.checked);
            });
        }

        // Configuração dos outros controles continua normalmente...
    }
    
    /**
     * Cria um botão de emergência para adicionar bactérias
     * @param {Object} callbacks - Callbacks para os controles
     */
    createEmergencyButton(callbacks) {
        console.log('🚨 Criando botão de emergência para adicionar bactérias');
        
        try {
            // Cria um botão de emergência usando p5.js
            const emergencyButton = createButton('⚠️ Adicionar Bactérias (Emergência)');
            emergencyButton.position(20, 20);
            emergencyButton.size(250, 40);
            emergencyButton.style('background-color', '#ff5722');
            emergencyButton.style('color', 'white');
            emergencyButton.style('border', 'none');
            emergencyButton.style('border-radius', '4px');
            emergencyButton.style('cursor', 'pointer');
            emergencyButton.style('font-weight', 'bold');
            emergencyButton.style('font-size', '14px');
            emergencyButton.style('z-index', '9999');
            emergencyButton.style('box-shadow', '0 4px 8px rgba(0,0,0,0.3)');
            
            // Adiciona evento de clique
            emergencyButton.mousePressed(() => {
                console.log('🖱️ Botão de emergência foi clicado!');
                
                // Usa valores padrão para o botão de emergência
                const count = 10;
                const femaleRatio = 50;
                
                if (callbacks && typeof callbacks.onAddBacteria === 'function') {
                    callbacks.onAddBacteria(count, femaleRatio);
                } else if (window.simulation && window.simulation.controlSystem && 
                    typeof window.simulation.controlSystem.handleButtonAddBacteria === 'function') {
                    window.simulation.controlSystem.handleButtonAddBacteria();
                } else if (window.simulation && window.simulation.entityManager && 
                    typeof window.simulation.entityManager.addMultipleBacteria === 'function') {
                    window.simulation.entityManager.addMultipleBacteria(count, femaleRatio);
                }
            });
            
            console.log('✅ Botão de emergência criado com sucesso');
        } catch (error) {
            console.error('❌ ERRO ao criar botão de emergência:', error);
        }
    }

    /**
     * Obtém a distribuição atual dos tipos de bactérias
     * @returns {Object} Objeto com as proporções de cada tipo de bactéria
     */
    getBacteriaTypeDistribution() {
        const distribution = {
            bacilos: parseFloat(document.getElementById('bacilos-slider')?.value || 25) / 100,
            cocos: parseFloat(document.getElementById('cocos-slider')?.value || 25) / 100,
            espirilos: parseFloat(document.getElementById('espirilos-slider')?.value || 25) / 100,
            vibrioes: parseFloat(document.getElementById('vibrioes-slider')?.value || 25) / 100
        };
        
        return distribution;
    }

    /**
     * Configura os sliders de tipos de bactérias para manter o total em 100%
     * @param {Object} callbacks - Objeto com as funções de callback
     */
    setupBacteriaTypeSliders(callbacks) {
        const sliderIds = ['bacilos-slider', 'cocos-slider', 'espirilos-slider', 'vibrioes-slider'];
        const valueIds = ['bacilos-value', 'cocos-value', 'espirilos-value', 'vibrioes-value'];
        
        // Configurar cada slider
        sliderIds.forEach((sliderId, index) => {
            const slider = document.getElementById(sliderId);
            const valueElement = document.getElementById(valueIds[index]);
            
            if (slider && valueElement) {
                slider.addEventListener('input', () => {
                    // Atualiza o valor exibido
                    const value = parseInt(slider.value);
                    valueElement.textContent = value + '%';
                    
                    // Ajusta os outros sliders para manter o total em 100%
                    this.updateOtherSliders(sliderId, value, sliderIds, valueIds);
                });
            }
        });
    }

    /**
     * Atualiza os outros sliders para manter o total em 100%
     * @param {string} currentSliderId - ID do slider que está sendo ajustado
     * @param {number} currentValue - Valor atual do slider
     * @param {Array<string>} allSliderIds - Array com todos os IDs de sliders
     * @param {Array<string>} allValueIds - Array com todos os IDs de elementos de valor
     */
    updateOtherSliders(currentSliderId, currentValue, allSliderIds, allValueIds) {
        // Calcula o total atual de todos os sliders
        let total = 0;
        const sliders = {};
        
        allSliderIds.forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                sliders[id] = slider;
                total += parseInt(slider.value);
            }
        });

        // Se o total não for 100, ajuste os outros sliders proporcionalmente
        if (total !== 100) {
            const excess = total - 100;
            if (excess !== 0) {
                // Calcula quanto cada slider (exceto o atual) deve ser ajustado
                const otherSlidersCount = allSliderIds.length - 1;
                if (otherSlidersCount > 0) {
                    // Distribui o excesso igualmente entre os outros sliders
                    let remainingExcess = excess;
                    const otherSliderIds = allSliderIds.filter(id => id !== currentSliderId);
                    
                    // Ordena os sliders do maior para o menor para ajustar primeiro os maiores
                    otherSliderIds.sort((a, b) => parseInt(sliders[b].value) - parseInt(sliders[a].value));
                    
                    // Ajusta cada slider, garantindo que nenhum fique negativo
                    for (let i = 0; i < otherSliderIds.length; i++) {
                        const id = otherSliderIds[i];
                        const slider = sliders[id];
                        const valueElement = document.getElementById(allValueIds[allSliderIds.indexOf(id)]);
                        
                        let adjustment = Math.round(remainingExcess / (otherSliderIds.length - i));
                        let newValue = Math.max(0, parseInt(slider.value) - adjustment);
                        
                        // Não permitir que o slider seja menor que 0
                        if (newValue < 0) newValue = 0;
                        
                        // Não permitir ajustes que excederiam o valor limite
                        if (parseInt(slider.value) - newValue > remainingExcess) {
                            newValue = parseInt(slider.value) - remainingExcess;
                        }
                        
                        // Atualiza o valor do slider e o texto
                        slider.value = newValue;
                        if (valueElement) valueElement.textContent = newValue + '%';
                        
                        // Atualiza o excesso restante
                        remainingExcess -= (parseInt(slider.value) - newValue);
                    }
                    
                    // Verifica novamente o total e ajusta o último slider se necessário
                    let finalTotal = parseInt(sliders[currentSliderId].value);
                    otherSliderIds.forEach(id => {
                        finalTotal += parseInt(sliders[id].value);
                    });
                    
                    if (finalTotal !== 100 && otherSliderIds.length > 0) {
                        const lastId = otherSliderIds[otherSliderIds.length - 1];
                        const lastSlider = sliders[lastId];
                        const lastValueElement = document.getElementById(allValueIds[allSliderIds.indexOf(lastId)]);
                        
                        const finalAdjustment = 100 - finalTotal;
                        lastSlider.value = parseInt(lastSlider.value) + finalAdjustment;
                        if (lastValueElement) lastValueElement.textContent = lastSlider.value + '%';
                    }
                }
            }
        }
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

    /**
     * Tenta métodos alternativos para adicionar bactérias quando o callback não está disponível
     * @param {number} count - Número de bactérias a adicionar
     * @param {number} femaleRatio - Porcentagem de fêmeas (0-100)
     */
    tryAlternativeMethods(count, femaleRatio) {
        // Tentar usar a função global disponível no SimulationControlSystem
        if (window.simulation && window.simulation.controlSystem && 
            typeof window.simulation.controlSystem.handleButtonAddBacteria === 'function') {
            console.log('🔄 Tentando usar handleButtonAddBacteria do controlSystem');
            window.simulation.controlSystem.handleButtonAddBacteria();
            return true;
        } 
        
        // Tentar chamar diretamente o método do entityManager
        if (window.simulation && window.simulation.entityManager && 
            typeof window.simulation.entityManager.addMultipleBacteria === 'function') {
            console.log('🔄 Tentando usar entityManager.addMultipleBacteria diretamente');
            window.simulation.entityManager.addMultipleBacteria(count, femaleRatio);
            return true;
        }
        
        console.error('❌ Não foi possível encontrar um método alternativo para adicionar bactérias');
        return false;
    }
}; 