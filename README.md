# Simulação de Bactérias

Uma simulação interativa de um ecossistema artificial onde bactérias evoluem e interagem entre si.

## Descrição

Este projeto simula um ambiente onde bactérias virtuais podem se mover, se alimentar, se reproduzir e evoluir ao longo do tempo. As bactérias possuem DNA que define suas características e comportamentos, que são passados para seus descendentes com possíveis mutações.

## Funcionalidades

- **Sistema de DNA**: Cada bactéria possui genes que controlam:
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

- **Comportamentos**:
  - Busca por comida
  - Reprodução
  - Descanso
  - Exploração
  - Fuga de predadores

- **Eventos Aleatórios**:
  - Tempestades
  - Ondas de calor
  - Chuva de nutrientes
  - Mutações espontâneas
  - Epidemias
  - Migrações
  - Terremotos

- **Sistema de Salvamento**:
  - Salvar estados da simulação
  - Carregar estados salvos
  - Exportar/Importar saves

## Controles

- **Mouse**:
  - Clique em uma bactéria para ver suas informações

- **Teclado**:
  - `Espaço`: Pausar/Continuar simulação
  - `R`: Reiniciar simulação
  - `S`: Salvar estado atual
  - `L`: Carregar último estado salvo
  - `E`: Gerar evento aleatório

## Interface

- **Controles de Simulação**:
  - Ajuste de velocidade
  - Botões de pausa e reinício
  - Visualização de estatísticas

- **Controles de Ambiente**:
  - Taxa de geração de comida
  - Número de obstáculos
  - Geração de eventos

- **Visualização**:
  - Estatísticas em tempo real
  - Indicadores de estado das bactérias
  - Modo debug opcional

## Estrutura do Projeto

```
bacterias/
├── index.html           # Página principal
├── sketch.js           # Script principal
├── modules/
│   ├── behavior.js     # Sistema de comportamento
│   ├── controls.js     # Interface de controle
│   ├── dna.js         # Sistema genético
│   ├── movement.js    # Sistema de movimento
│   ├── randomEvents.js # Sistema de eventos
│   ├── reproduction.js # Sistema reprodutivo
│   ├── saveSystem.js  # Sistema de salvamento
│   ├── simulation.js  # Núcleo da simulação
│   └── visualization.js # Sistema visual
├── bacteria.js        # Classe Bacteria
├── food.js           # Classe Food
└── obstacle.js       # Classe Obstacle
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
- O servidor Node.js oferece recursos adicionais como:
  - CORS: desabilitado por padrão
  - Cache: 3600 segundos
  - Timeout de Conexão: 120 segundos
  - Listagem de Diretórios: visível
  - AutoIndex: visível

## Desenvolvimento

Para adicionar novas funcionalidades:

1. Cada sistema está modularizado em arquivos separados
2. Use as classes existentes como base para novas implementações
3. Mantenha a consistência com o sistema de documentação
4. Teste as interações com outros sistemas antes de integrar

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 