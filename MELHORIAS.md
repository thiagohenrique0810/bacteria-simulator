Para implementar inteligência nas bactérias do seu simulador, você pode seguir algumas abordagens progressivas, desde regras simples baseadas em comportamento até redes neurais evolutivas. Aqui estão algumas ideias organizadas por complexidade:

1. Regras Baseadas em Estado (Fácil - Médio)
Cada bactéria pode ter um estado e tomar decisões baseadas em condições do ambiente. Isso pode ser feito com um sistema de Máquina de Estados Finitos (FSM - Finite State Machine).

Estados possíveis:

Exploração: Movem-se aleatoriamente procurando comida.
Busca por comida: Se detectam comida, vão em direção a ela.
Fuga: Se um predador ou uma bactéria agressiva está por perto, tentam escapar.
Reprodução: Se tiverem energia suficiente e um parceiro compatível, se reproduzem.
Descanso: Se estiverem com pouca energia, param para recuperar força.
Exemplo de Implementação:

js
Copiar
Editar
class Bacteria {
  constructor() {
    this.state = "exploring"; // Estado inicial
    this.energy = 100; 
  }

  update() {
    switch (this.state) {
      case "exploring":
        this.moveRandom();
        if (this.detectFood()) this.state = "seekingFood";
        break;
      case "seekingFood":
        this.moveToFood();
        if (this.energy > 80) this.state = "reproducing";
        break;
      case "fleeing":
        this.fleeFromPredator();
        break;
      case "reproducing":
        this.reproduce();
        break;
      case "resting":
        this.recoverEnergy();
        break;
    }
  }
}
2. Sistema de Aprendizado por Reforço (Médio - Difícil)
Aqui você pode implementar um Q-Learning ou outro método de aprendizado por reforço. As bactérias aprendem quais ações maximizam sua sobrevivência com base em recompensas e punições.

Exemplo de Recompensas:

Comer comida: +10 pontos
Fugir de um predador com sucesso: +5 pontos
Gastar energia sem encontrar comida: -5 pontos
Cada bactéria aprende com a experiência e melhora sua tomada de decisões.

Exemplo de Algoritmo Q-Learning Simples:

js
Copiar
Editar
class Bacteria {
  constructor() {
    this.qTable = {}; // Memória de aprendizado
    this.state = "exploring";
  }

  chooseAction(state) {
    if (!this.qTable[state]) this.qTable[state] = { move: 0, eat: 0, flee: 0 };
    return Object.keys(this.qTable[state]).reduce((a, b) => 
      this.qTable[state][a] > this.qTable[state][b] ? a : b
    );
  }

  update() {
    let action = this.chooseAction(this.state);
    this.performAction(action);
    this.updateQTable(this.state, action);
  }

  updateQTable(state, action) {
    let reward = this.getReward(state, action);
    this.qTable[state][action] = (this.qTable[state][action] + reward) / 2;
  }
}
3. Redes Neurais Evolutivas (Difícil - Avançado)
Se quiser algo mais avançado, pode usar redes neurais evolutivas. Cada bactéria teria uma rede neural simples que decide ações com base no ambiente. As melhores sobreviventes passam seus "genes" (pesos da rede neural) para as próximas gerações com mutações sutis.

Isso pode ser feito com Neuroevolução (como NEAT - NeuroEvolution of Augmenting Topologies) ou frameworks como TensorFlow.js.

Exemplo:
Cada bactéria tem uma rede neural que recebe como entrada:

Distância até comida
Distância até predador
Energia atual
E decide mover, fugir ou comer com base nas conexões da rede.

js
Copiar
Editar
import * as tf from "@tensorflow/tfjs";

class Bacteria {
  constructor() {
    this.brain = this.createBrain();
  }

  createBrain() {
    return tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 5, activation: "relu" }),
        tf.layers.dense({ units: 3, activation: "softmax" }) // Três saídas: mover, fugir, comer
      ]
    });
  }

  decideAction(inputs) {
    let output = this.brain.predict(tf.tensor2d([inputs]));
    return output.argMax(1).dataSync()[0]; // Retorna a ação com maior probabilidade
  }
}
Qual Escolher?
🔹 Se quiser algo rápido e eficiente → Use a Máquina de Estados
🔹 Se quiser um sistema que aprende com o tempo → Use Aprendizado por Reforço
🔹 Se quiser evolução inteligente e realista → Use Neuroevolução