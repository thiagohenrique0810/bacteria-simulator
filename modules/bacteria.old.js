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
        }
        
        getCurrentState() {
            return this.currentState;
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
        
        update() {
            return {
                state: this.currentState,
                energy: this.energy,
                shouldMove: true,
                targetType: 'random',
                speedMultiplier: 1
            };
        }
    };
} 