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
  - Implementação de rede neural para tomada de decisões
  - Inputs normalizados incluindo saúde, energia, proximidade de comida/parceiros/predadores
  - Sistema híbrido permitindo alternar entre Q-Learning e Rede Neural
  - Capacidade de evolução através de gerações

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
│   │   ├── Movement.js      # Sistema de movimento
│   │   ├── Social.js        # Interações sociais
│   │   └── Visualization.js # Representação visual
│   ├── controls/            # Módulos de interface
│   │   ├── Controls.js      # Controles básicos
│   │   ├── ControlsBase.js  # Classe base de controles
│   │   ├── DiseaseControls.js # Controles de doenças
│   │   ├── EnvironmentControls.js # Controles de ambiente
│   │   ├── PredatorControls.js # Controles de predadores
│   │   ├── SaveControls.js  # Controles de salvamento
│   │   ├── SimulationControls.js # Controles de simulação
│   │   └── VisualizationControls.js # Controles visuais
│   ├── attackEffect.js      # Sistema de efeitos de ataque
│   ├── bacteria.js          # Integração de bactérias
│   ├── bacteriaStates.js    # Máquina de estados
│   ├── behavior.js          # Sistema de comportamento
│   ├── communication.js     # Sistema de comunicação
│   ├── constants.js         # Constantes globais
│   ├── controls.js          # Interface de controle
│   ├── disease.js           # Sistema de doenças
│   ├── dna.js               # Sistema genético
│   ├── events.js            # Sistema de eventos
│   ├── fix.js               # Correções e ajustes
│   ├── food.js              # Sistema de alimentação
│   ├── movement.js          # Sistema de movimento
│   ├── neural.js            # Rede neural
│   ├── obstacle.js          # Sistema de obstáculos
│   ├── predator.js          # Sistema de predadores
│   ├── predatorStates.js    # Estados dos predadores
│   ├── randomEvents.js      # Sistema de eventos aleatórios
│   ├── reproduction.js      # Sistema reprodutivo
│   ├── save.js              # Sistema de salvamento
│   ├── saveSystem.js        # Gerenciamento de salvamentos
│   ├── simulation.js        # Núcleo da simulação
│   ├── utils.js             # Funções utilitárias
│   └── visualization.js     # Sistema visual
├── food.js                  # Classe Food
└── favicon.ico              # Ícone do site
```

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

## Recursos Técnicos

### Otimizações
- **Particionamento Espacial**: Sistema de grade para otimizar detecção de colisões
- **Gerenciamento de Memória**: Remoção de entidades quando fora do campo de visão
- **Renderização Eficiente**: Técnicas de otimização para manter FPS estável com centenas de entidades

### Lógica Avançada
- **Máquina de Estados Finitos**: Gerenciamento de comportamentos através de estados e transições
- **Sistema de Eventos**: Arquitetura baseada em eventos para comunicação entre sistemas
- **Modularização**: Código altamente modularizado para facilitar manutenção e expansão

## Funcionalidades em Desenvolvimento
- **Evolução de Espécies**: Surgimento de novas espécies de bactérias por deriva genética
- **Ecossistema Expandido**: Novos tipos de entidades e interações ambientais
- **Interface Web Avançada**: Dashboard com gráficos e análises estatísticas

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 