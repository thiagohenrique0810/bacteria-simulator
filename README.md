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
  - Sistema modular através da classe `BacteriaStates`

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

### Ecossistema Complexo
- **Dinâmica Ambiental**:
  - Ciclo dia/noite afetando comportamentos
  - Geração de alimentos com taxas configuráveis
  - Obstáculos e barreiras no ambiente
  - Predadores que caçam as bactérias

- **Sistema de Doenças**:
  - Doenças com diferentes sintomas e taxas de contágio
  - Transmissão por contato entre bactérias
  - Imunidade adquirida após recuperação
  - Efeitos visuais para bactérias infectadas

- **Eventos Aleatórios**:
  - Tempestades
  - Ondas de calor
  - Chuva de nutrientes
  - Mutações espontâneas
  - Epidemias
  - Migrações
  - Terremotos

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

## Controles

- **Mouse**:
  - Clique em uma bactéria para ver suas informações
  - Arraste para movimentar a visualização
  - Clique em área vazia para adicionar comida

- **Teclado**:
  - `Espaço`: Pausar/Continuar simulação
  - `R`: Reiniciar simulação
  - `S`: Salvar estado atual
  - `L`: Carregar último estado salvo
  - `E`: Gerar evento aleatório

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
│   │   ├── Visualization.js # Representação visual
│   │   └── index.js         # Integração dos componentes de bactéria
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
│   ├── communication.js     # Sistema de comunicação
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
│   ├── simulation.js        # Adaptador da simulação (compatibilidade)
│   ├── utils.js             # Funções utilitárias
│   └── visualization.js     # Sistema visual
└── favicon.ico              # Ícone do site
```

## Otimizações e Melhorias Recentes

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

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 