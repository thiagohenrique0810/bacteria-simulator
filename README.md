# Simulador de Bactérias

Uma simulação interativa de um ecossistema artificial onde bactérias virtuais evoluem, interagem e se adaptam ao ambiente através de sistemas avançados de inteligência artificial.

## Descrição

Este projeto simula um ecossistema complexo onde bactérias virtuais podem se mover, se alimentar, se reproduzir e evoluir ao longo do tempo. As bactérias possuem DNA que define suas características e comportamentos, que são passados para seus descendentes com possíveis mutações, permitindo a simulação de processos evolutivos. O simulador inclui sistemas avançados de IA, interações sociais entre bactérias, ciclo dia/noite, predadores, doenças e diversos eventos ambientais.

## Principais Recursos

### Sistema de DNA e Evolução
- **Mecanismo Genético Complexo**: Cada bactéria possui genes que controlam:
  - Metabolismo
  - Imunidade
  - Regeneração
  - Agressividade
  - Sociabilidade
  - Curiosidade
  - Velocidade
  - Agilidade
  - Percepção
  - Fertilidade
  - Taxa de mutação
  - Adaptabilidade
  - Aparência (tamanho e cor)
- **Hereditariedade**: Genes são transmitidos às novas gerações com possibilidade de mutações
- **Seleção Natural**: Bactérias mais adaptadas têm maior chance de sobrevivência e reprodução

### Comportamentos Inteligentes
- **Máquina de Estados (FSM)**:
  - Estados implementados: exploração, busca por comida, fuga, reprodução, descanso
  - Transições dinâmicas baseadas em condições do ambiente
  - Sistema modular através da classe `BacteriaStateManager`
  - Gerenciamento de energia baseado no estado atual

- **Sistema Integrado de IA e Movimento**:
  - Análise do ambiente em tempo real (comida, parceiros, predadores, obstáculos)
  - Tomada de decisão inteligente baseada nas condições ambientais
  - Sistema híbrido de aprendizado (Q-Learning e Redes Neurais)
  - Ações aplicadas diretamente ao sistema de movimento
  - Comportamentos específicos para busca, fuga, exploração e descanso
  - Resposta a perigos com desvio de obstáculos e fuga de predadores

- **Aprendizado por Reforço (Q-Learning)**:
  - Sistema de recompensas baseado em ações
  - Memória de aprendizado através de Q-Table
  - Taxa de aprendizado e fator de desconto configuráveis
  - Ações disponíveis: explorar, buscar comida, buscar parceiro, descansar

- **Sistema Neural**:
  - Implementação modular de rede neural para tomada de decisões
  - Componentes separados para funções de ativação, memória e evolução
  - Inputs normalizados incluindo saúde, energia, proximidade de comida/parceiros/predadores
  - Sistema híbrido permitindo alternar entre Q-Learning e Rede Neural
  - Capacidade de evolução através de gerações com crossover de múltiplos pontos
  - Mutações adaptativas baseadas em fitness

### Interações Sociais
- **Sistema Social Avançado**:
  - Formação de amizades e inimizades entre bactérias
  - Papéis na comunidade baseados em genes (explorador, protetor, comunicador, etc.)
  - Comunicação entre bactérias próximas
  - Memória de relacionamentos anteriores

- **Sistema de Comunicação Neural**:
  - Comunicação avançada baseada em redes neurais
  - Bactérias com gene `neural_communication` podem usar comunicação neural
  - Codificação de estados internos em mensagens usando autoencoders
  - Decodificação de mensagens em ações específicas
  - Avaliação de resultados e recompensas para aprendizado
  - Três modos de comunicação (AUTO, ON, OFF) controláveis via interface
  - Estatísticas de uso do sistema neural com feedback visual

### Interface e Visualização
- **Controles Avançados**:
  - Painéis modulares para cada sistema (simulação, predadores, doenças, etc.)
  - Ajustes em tempo real de todos os parâmetros
  - Estatísticas detalhadas da evolução do ecossistema
  - Sistema de salvamento e carregamento de estados

- **Visualização Detalhada**:
  - Indicadores visuais de estado, saúde e energia
  - Visualização de relações sociais
  - Efeitos visuais para eventos e interações
  - Modo debug com informações detalhadas

- **Painel de Informações da Bactéria**:
  - Interface detalhada exibindo dados completos de bactérias selecionadas
  - Informações sobre ID, geração, idade, saúde e energia
  - Visualização de todos os genes com barras de progresso para valores
  - Exibição do estado atual e presença do gene de comunicação neural
  - Contagem de relacionamentos com outras bactérias
  - Atualização em tempo real dos valores a cada 0,5 segundos
  - Integração com o sistema de seleção por clique

## Controles

- **Mouse**:
  - Clique em uma bactéria para selecionar e ver suas informações detalhadas
  - Arraste uma bactéria selecionada para movê-la
  - Clique em área vazia para adicionar comida

- **Teclado**:
  - `Espaço`: Pausar/Continuar simulação
  - `R`: Reiniciar simulação
  - `S`: Salvar estado atual
  - `L`: Carregar último estado salvo
  - `E`: Gerar evento aleatório
  - `ESC`: Desselecionar bactéria atual e limpar painel de informações

- **Botões de Interface**:
  - `EMERGÊNCIA`: Pausa a simulação e permite reiniciar
  - `DEBUG`: Alterna o modo de depuração (informações visuais extras)
  - `NEURAL`: Alterna entre modos de comunicação neural:
    - `AUTO`: Apenas bactérias com gene de comunicação neural a utilizam
    - `ON`: Todas as bactérias usam comunicação neural (modo forçado)
    - `OFF`: Desativa completamente a comunicação neural

## Arquitetura do Projeto

O projeto segue uma arquitetura modular orientada a objetos, dividida em sistemas especializados:

```
bacterias/
├── index.html               # Página principal
├── sketch.js                # Script principal P5.js
├── modules/
│   ├── bacteria/            # Módulos específicos de bactérias
│   │   ├── BacteriaBase.js  # Classe base de bactérias
│   │   ├── Environment.js   # Interação com ambiente
│   │   ├── Learning.js      # Sistema de aprendizado
│   │   ├── Movement.js      # Sistema de movimento específico de bactérias
│   │   ├── Social.js        # Interações sociais
│   │   ├── StateManager.js  # Gerenciador de estados das bactérias
│   │   ├── Visualization.js # Representação visual
│   │   ├── Bacteria.js      # Classe de implementação da bactéria
│   │   └── index.js         # Integração dos componentes de bactéria
│   ├── communication/       # Sistema de comunicação modularizado
│   │   ├── CommunicationUtils.js       # Funções utilitárias
│   │   ├── CommunicationInterface.js   # Interface de usuário do chat
│   │   ├── MessageManager.js           # Gerenciamento de mensagens
│   │   ├── MessageGenerator.js         # Geração de conteúdo de mensagens
│   │   ├── RelationshipManager.js      # Gerenciamento de relacionamentos
│   │   ├── CommunicationSystem.js      # Sistema principal
│   │   ├── NeuralCommunication.js      # Sistema de comunicação neural
│   │   ├── initCommunication.js        # Script de inicialização do sistema
│   │   └── index.js                    # Integração de componentes
│   ├── controls/            # Módulos de interface
│   │   ├── ControlsBase.js  # Classe base de controles
│   │   ├── DiseaseControls.js # Controles de doenças
│   │   ├── EnvironmentControls.js # Controles de ambiente
│   │   ├── PredatorControls.js # Controles de predadores
│   │   ├── SaveControls.js  # Controles de salvamento
│   │   ├── SimulationControls.js # Controles de simulação
│   │   ├── VisualizationControls.js # Controles visuais
│   │   └── Controls.js      # Integração dos controles
│   ├── movement/            # Sistema de movimento modularizado
│   │   ├── MovementBase.js  # Classe base com funcionalidades essenciais
│   │   ├── MovementSteering.js # Comportamentos de direcionamento
│   │   ├── MovementObstacle.js # Lógica de desvio de obstáculos
│   │   └── index.js         # Integração dos componentes de movimento
│   ├── neural/              # Sistema neural modularizado
│   │   ├── ActivationFunctions.js # Funções de ativação
│   │   ├── Memory.js        # Sistema de memória de experiências
│   │   ├── Evolution.js     # Sistema de evolução (crossover, mutação)
│   │   ├── NeuralNetwork.js # Classe principal da rede neural
│   │   └── index.js         # Integração dos componentes neurais
│   ├── simulation/          # Sistema de simulação modularizado
│   │   ├── EntityManager.js # Gerenciamento de entidades
│   │   ├── StatsManager.js  # Gerenciamento de estatísticas
│   │   ├── EnvironmentSystem.js # Sistema de ambiente
│   │   ├── RenderSystem.js  # Sistema de renderização
│   │   ├── InteractionSystem.js # Sistema de interações
│   │   ├── SimulationControlSystem.js # Sistema de controles
│   │   ├── Simulation.js    # Classe principal da simulação
│   │   └── index.js         # Integração dos componentes de simulação
│   ├── bacteria.js          # Adaptador de bactérias (compatibilidade)
│   ├── bacteriaStates.js    # Máquina de estados
│   ├── behavior.js          # Sistema de comportamento
│   ├── constants.js         # Constantes globais
│   ├── disease.js           # Sistema de doenças
│   ├── dna.js               # Sistema genético
│   ├── events.js            # Sistema de eventos
│   ├── fix.js               # Correções e ajustes
│   ├── food.js              # Sistema de alimentação
│   ├── init.js              # Inicialização
│   ├── neural.js            # Adaptador neural (compatibilidade)
│   ├── obstacle.js          # Sistema de obstáculos
│   ├── predator.js          # Sistema de predadores
│   ├── predatorStates.js    # Estados dos predadores
│   ├── reproduction.js      # Sistema reprodutivo
│   ├── save.js              # Sistema de salvamento
│   ├── saveSystem.js        # Sistema avançado de salvamento
│   ├── attackEffect.js      # Efeitos visuais de ataques
│   ├── randomEvents.js      # Sistema de eventos aleatórios
│   ├── simulation.js        # Adaptador da simulação (compatibilidade)
│   ├── utils.js             # Funções utilitárias
│   ├── controls.js          # Sistema de controles (compatibilidade)
│   └── visualization.js     # Sistema visual
├── modulo-comunicacao.md    # Documentação do sistema de comunicação
├── MELHORIAS.md             # Registro de melhorias implementadas
├── food.js                  # Sistema de alimentação (raiz)
├── favicon.ico              # Ícone do site
└── LICENSE                  # Licença do projeto
```

## Otimizações e Melhorias Recentes

### Implementação do Sistema de Comunicação Neural (Junho/2024)
- **Sistema Neural para Comunicação entre Bactérias**:
  - Integração entre sistema de comunicação e redes neurais
  - Capacidade de codificar e decodificar mensagens usando autoencoders
  - Interpretação de mensagens em ações concretas (movimento, busca, descanso)
  - Sistema de avaliação de resultados e recompensas para aprendizado
  - Interface visual para monitoramento da comunicação neural
- **Controle por Modos**:
  - Modo AUTO: Bactérias com gene `neural_communication` usam comunicação neural
  - Modo ON: Todas as bactérias usam comunicação neural (comunicação forçada)
  - Modo OFF: Desativa completamente a comunicação neural
- **Visualização de Estatísticas**:
  - Monitoramento em tempo real do uso de comunicação neural
  - Acompanhamento de recompensas médias e evolução do aprendizado
  - Contagem de bactérias utilizando o sistema neural
- **Implementação Técnica**:
  - Integração com o sistema genético (gene de comunicação neural)
  - Carregamento dinâmico de componentes via `initCommunication.js`
  - Interface visual com estatísticas de recompensa e uso
  - Compatibilidade com sistemas existentes através do design modular

### Implementação do Painel de Informações da Bactéria (Julho/2024)
- **Interface Visual Interativa**:
  - Painel lateral integrado no container de chat existente
  - Design responsivo com barras de rolagem para informações extensas
  - Atualização automática a cada 0,5 segundos das informações da bactéria selecionada
  - Barras de progresso visuais para genes, facilitando a compreensão dos valores
  - Destacamento visual de genes especiais como comunicação neural
- **Seleção e Manipulação**:
  - Sistema de seleção por clique com feedback visual imediato
  - Capacidade de arrastar e soltar bactérias selecionadas para reposicionamento
  - Tecla ESC para desselecionar e limpar o painel de informações
  - Múltiplos modos de visualização de informações (básico, genético, social)
- **Informações Detalhadas**:
  - Identificadores básicos: ID, geração, idade
  - Atributos físicos: saúde, energia, tamanho, velocidade
  - Perfil genético: metabolismo, imunidade, agressividade, etc.
  - Estado atual e habilidades especiais
  - Informações sobre relacionamentos e comunicação neural
- **Integração com Sistemas Existentes**:
  - Compatibilidade com o sistema de DNA para visualização de genes
  - Integração com o sistema de comunicação para contagem de relacionamentos
  - Suporte a diferentes implementações (stateManager e states legados)
  - Tratamento de erros para garantir robustez

### Melhorias no Sistema de IA e Movimento (Maio/2024)
- **Integração da IA com Movimento**: Sistema redesenhado para que as bactérias utilizem efetivamente seu sistema de inteligência artificial para tomar decisões de movimento
  - Análise de ambiente aprimorada para detectar comida, predadores e parceiros
  - Q-Learning e redes neurais determinando comportamentos adaptativos
  - Sistema de recompensas refinado para aprendizado eficiente
- **Compatibilidade entre Sistemas**: 
  - Implementação híbrida permitindo funcionamento tanto com o novo `stateManager` quanto com o sistema legado `states`
  - Verificações de segurança para prevenção de erros por referências nulas
- **Comportamentos de Movimento Avançados**:
  - `moveRandom`: Exploração eficiente do ambiente
  - `moveTowards`: Perseguição de alvos (comida, parceiros)
  - `moveAway`: Fuga de predadores e ameaças
  - `avoidObstacles`: Sistema inteligente para contornar barreiras
- **Gerenciamento de Energia**:
  - Consumo de energia baseado em atividade (movimento, reprodução, etc.)
  - Recuperação durante períodos de descanso
  - Tomada de decisão considerando níveis de energia atuais
- **Sincronização de Sistemas**:
  - Os movimentos são sincronizados entre o sistema de decisão (IA), gerenciador de estados e sistema físico de movimento
  - Posições atualizadas consistentemente para evitar comportamentos estacionários

### Refatoração do Sistema de Comunicação
- **Arquitetura Modular**: Sistema de comunicação dividido em componentes especializados
  - `CommunicationInterface.js`: Gerencia elementos de UI do chat
  - `MessageManager.js`: Gerencia mensagens e histórico
  - `MessageGenerator.js`: Gera conteúdo para as mensagens
  - `RelationshipManager.js`: Gerencia relacionamentos entre bactérias
  - `CommunicationUtils.js`: Funções utilitárias
  - `CommunicationSystem.js`: Coordena todos os componentes
  - `NeuralCommunication.js`: Implementa comunicação baseada em redes neurais
  - `initCommunication.js`: Carrega dinamicamente todos os componentes
- **Comunicação Neural Avançada**:
  - Codificação neural de estados internos em mensagens
  - Decodificação neural de mensagens em ações
  - Sistema de avaliação de resultados e aprendizado por reforço
  - Visualização de estatísticas de comunicação em tempo real
  - Controle de modo (AUTO/ON/OFF) via interface gráfica
  - Capacidade genética determinando habilidade de comunicação neural
  - Vocabulário de tokens com significados emergentes
- **Responsabilidade Única**: Cada módulo tem função específica e bem definida
- **Gerenciamento de Mensagens**: Sistema completo para criação, envio e exibição de mensagens
- **Sistema de Relacionamentos**: Controle de amizades e inimizades entre bactérias
- **Personalização de Mensagens**: Mensagens adaptadas à personalidade e condições
- **Processamento Eficiente**: Otimização para grandes quantidades de bactérias
- **Retrocompatibilidade**: API pública compatível com código existente

### Refatoração do Sistema de Movimento
- **Arquitetura Modular**: Sistema de movimento dividido em componentes especializados
  - `MovementBase.js`: Gerencia a física básica de movimento (posição, velocidade, aceleração)
  - `MovementSteering.js`: Implementa comportamentos de direcionamento (busca, separação)
  - `MovementObstacle.js`: Gerencia detecção e desvio de obstáculos
- **Classe MovementBase**: Funcionalidades essenciais de movimento
  - Gestão de vetores de posição e velocidade
  - Aplicação de forças físicas
  - Limites de velocidade adaptados à idade
- **Classe MovementSteering**: Comportamentos avançados de direcionamento
  - Algoritmos para busca de alvos
  - Comportamento de separação para evitar aglomerações
  - Movimentos aleatórios e seguimento de campos de fluxo
- **Classe MovementObstacle**: Sistema de desvio de colisões
  - Detecção antecipada de obstáculos
  - Cálculo de rotas de desvio
  - Resposta a colisões diretas
- **Melhor Performance**: Otimização de cálculos de física e colisões
- **Fácil Extensibilidade**: Novos comportamentos podem ser adicionados sem modificar o núcleo
- **Retrocompatibilidade**: Interface pública preservada para manter compatibilidade com código existente

### Refatoração do Sistema Neural
- **Arquitetura Modular**: Sistema neural dividido em componentes especializados para facilitar manutenção
- **Separação de Responsabilidades**: Cada módulo com função específica (ativação, memória, evolução)
- **Classe ActivationFunctions**: Funções de ativação (sigmoid, ReLU, LeakyReLU, tanh) disponíveis como métodos estáticos
- **Classe NeuralMemory**: Sistema otimizado para armazenamento e recuperação de experiências
- **Classe NeuralEvolution**: Algoritmos de crossover e mutação separados da lógica principal
- **Retrocompatibilidade**: Interfaces públicas preservadas para manter compatibilidade com código existente

### Refatoração do Sistema de Simulação
- **Arquitetura Modular**: Sistema de simulação dividido em componentes especializados
- **Padrão de Responsabilidade Única**: Cada módulo com responsabilidade bem definida
- **Camada de Compatibilidade**: Adaptadores para manter compatibilidade com código legado
- **Eliminação de Duplicidades**: Remoção de arquivos redundantes e código duplicado

### Módulos Especializados
- **EntityManager**: Gerencia todas as entidades da simulação (bactérias, comida, obstáculos, predadores)
- **StatsManager**: Controla e atualiza estatísticas do ecossistema
- **EnvironmentSystem**: Gerencia condições ambientais e geração de recursos
- **RenderSystem**: Sistema otimizado de renderização
- **InteractionSystem**: Detecta e processa interações entre entidades
- **SimulationControlSystem**: Integração com controles de usuário

### Otimizações de Desempenho
- **Particionamento Espacial**: Sistema de grade para otimizar detecção de colisões
- **Gerenciamento de Memória**: Remoção eficiente de entidades
- **Renderização Eficiente**: Técnicas para manter FPS estável mesmo com centenas de entidades
- **Processamento por Lotes**: Agrupamento de operações similares para melhor performance

## Dependências

- [p5.js](https://p5js.org/) - Biblioteca para gráficos e interatividade

## Problemas Comuns e Soluções

### Bactérias não se movem
- **Sintoma**: Bactérias permanecem estáticas mesmo quando deveriam estar se movendo.
- **Causa provável**: Problemas na integração entre o sistema de IA, gerenciador de estados e sistema de movimento.
- **Solução**: Verifique se a posição da bactéria está sendo sincronizada com o sistema de movimento. No método `update()` da classe `Bacteria`, a posição deve ser atualizada com base na posição calculada pelo sistema de movimento: `this.pos.x = this.movement.movement.position.x; this.pos.y = this.movement.movement.position.y;`.

### Erros de referência (null ou undefined)
- **Sintoma**: Erros no console como "Cannot read properties of undefined" ou "Cannot read property 'x' of null".
- **Causa provável**: Tentativa de acessar propriedades de objetos que ainda não foram inicializados ou foram destruídos.
- **Solução**: Use verificações de segurança ao acessar propriedades aninhadas. Por exemplo, em vez de `bacteria.states.getEnergy()`, use `bacteria && bacteria.states && typeof bacteria.states.getEnergy === 'function' ? bacteria.states.getEnergy() : defaultValue`.

### Sistema de estados não inicializado
- **Sintoma**: Erro "Sistema de estados não inicializado para a bactéria X".
- **Causa provável**: Falha ao criar o gerenciador de estados no construtor da bactéria.
- **Solução**: Verifique se a classe `BacteriaStateManager` está corretamente carregada antes de criar instâncias de `Bacteria`. O construtor da classe `Bacteria` deve inicializar `this.stateManager` com uma nova instância de `BacteriaStateManager`.

### Problemas de desempenho
- **Sintoma**: Queda significativa no FPS com muitas bactérias.
- **Causa provável**: Cálculos excessivos de física, colisões ou lógica de IA muito complexa.
- **Solução**: 
  - Reduza a frequência de atualizações de IA para bactérias distantes da área visível
  - Utilize estruturas de dados espaciais como quadtrees para otimizar detecção de colisões
  - Limite a quantidade máxima de bactérias ativas simultaneamente
  - Reduza o cálculo de estatísticas para intervalos maiores (a cada 10-30 frames)

### Problemas de compatibilidade com navegadores
- **Sintoma**: A simulação não funciona em determinados navegadores ou dispositivos.
- **Causa provável**: Uso de recursos JavaScript não suportados universalmente.
- **Solução**: Certifique-se de usar polyfills para recursos modernos do JavaScript e verifique a compatibilidade com os principais navegadores (Chrome, Firefox, Safari, Edge).

## Como Usar

1. Clone o repositório
2. Execute um dos servidores locais disponíveis:

   ### Opção 1: Usando Python
   ```bash
   python -m http.server 8000
   ```
   Após executar, o servidor estará disponível em:
   - http://localhost:8000

   ### Opção 2: Usando Node.js
   ```bash
   npx http-server -p 8080
   ```
   Após executar, o servidor estará disponível em:
   - http://localhost:8080
   - http://127.0.0.1:8080
   - http://[seu-ip-local]:8080

3. Abra um dos endereços acima em seu navegador moderno
4. A simulação iniciará automaticamente
5. Use os controles para interagir com a simulação

### Notas sobre o Servidor
- Para parar o servidor, pressione `Ctrl+C` no terminal
- Certifique-se de que as portas escolhidas (8000 ou 8080) não estejam em uso
- O servidor Node.js oferece recursos adicionais como CORS, Cache e Listagem de Diretórios

## Funcionalidades em Desenvolvimento
- **Evolução de Espécies**: Surgimento de novas espécies de bactérias por deriva genética
- **Ecossistema Expandido**: Novos tipos de entidades e interações ambientais
- **Interface Web Avançada**: Dashboard com gráficos e análises estatísticas
- **Adaptação Dinâmica**: Algoritmos melhorados para adaptação das entidades ao ambiente
- **Ecossistemas Temáticos**: Ambientes especializados com regras e dinâmicas próprias
- **Sistema Neural Avançado**: Novos tipos de redes neurais e algoritmos de aprendizado

## Documentação Adicional

- **MELHORIAS.md**: Contém um registro detalhado das melhorias implementadas no simulador, incluindo otimizações de desempenho, melhorias no sistema de IA, evolução genética avançada, e outras atualizações recentes.
- **modulo-comunicacao.md**: Documentação específica sobre a implementação do sistema de comunicação entre bactérias, incluindo estratégias para desenvolvimento de linguagem própria e comunicação contextual.

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 