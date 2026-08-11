import React, { useState } from 'react';

const RECOMMENDED_EXERCISES = {
  Peito: [
    'Supino Reto com Barra / Halteres',
    'Supino Inclinado (Foco em Clavicular)',
    'Crossover na Polia (Ângulo Médio/Baixo)',
    'Peck Deck / Voador'
  ],
  Costas: [
    'Puxada Alta Frontal (Dorsal)',
    'Remada Curvada com Barra',
    'Remada Baixa Triângulo',
    'Pulldown na Polia (Isolamento)'
  ],
  Ombros: [
    'Elevação Lateral na Polia/Halteres',
    'Crucifixo Invertido (Posterior)',
    'Desenvolvimento com Halteres',
    'Elevação Frontal com Anilha/Polia'
  ],
  Biceps: [
    'Rosca Direta com Barra W',
    'Rosca Alternada / Inclinada',
    'Rosca Scott (Cabeça Curta)',
    'Rosca Martelo (Braquial)'
  ],
  Triceps: [
    'Tríceps Corda (Cabeça Lateral)',
    'Tríceps Testa com Barra W',
    'Tríceps Francês na Polia',
    'Tríceps Coice / Paralela'
  ],
  Abdomen: [
    'Abdominal Infra nas Paralelas',
    'Abdominal Supra na Polia com Carga',
    'Prancha Isométrica com Peso',
    'Abdominal Infra no Banco Inclinado'
  ],
  Pernas: [
    'Agachamento Livre / Hack',
    'Cadeira Extensora (Quadríceps)',
    'Mesa Flexora / Stiff (Isquiotibiais)',
    'Leg Press 45°'
  ],
  Panturrilhas: [
    'Gêmeos Sentado na Máquina (Foco em Sóleo)',
    'Gêmeos em Pé no Leg Press / Máquina (Foco em Gastrocnêmio)',
    'Elevação de Panturrilha Unilateral com Halter'
  ],
};

// Coordenadas centrais para a linha conectora
const MUSCLE_COORDS = {
  Ombros: { x: 140, y: 75 },
  Peito: { x: 100, y: 85 },
  Biceps: { x: 138, y: 105 },
  Abdomen: { x: 100, y: 135 },
  Pernas: { x: 112, y: 220 },
  Panturrilhas: { x: 112, y: 310 },
  Costas: { x: 100, y: 90 },
  Triceps: { x: 60, y: 105 }
};

export default function BodyMap({ onSelectMuscle }) {
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState('Peito');

  const activeMuscle = hoveredMuscle || selectedMuscle;
  const targetCoord = activeMuscle ? MUSCLE_COORDS[activeMuscle] : MUSCLE_COORDS['Peito'];

  const handleMuscleClick = (muscle) => {
    setSelectedMuscle(muscle);
    if (onSelectMuscle) onSelectMuscle(muscle);
  };

  return (
    <div className="bg-[#0e1210] p-5 rounded-xl border border-[#18201a] flex flex-col justify-between space-y-4">
      {/* Top Banner de Diagnóstico Muscular */}
      <div className="flex items-center justify-between pb-3 border-b border-[#18201a]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2be29d] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">
            MAPEAMENTO DE CARGA MUSCULAR
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400 bg-[#070908] px-2 py-0.5 rounded border border-[#18201a]">
          INTENSIFICAÇÃO: PEITORAL M
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* SVG Container envelopado exatamente em <div className="w-full max-w-[240px] mx-auto h-[300px]"> */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[240px] mx-auto h-[300px] flex justify-center items-center relative">
            <svg
              viewBox="0 0 200 380"
              className="w-full h-full object-contain"
            >
              {/* Linha Conectora Cirúrgica */}
              {activeMuscle && targetCoord && (
                <g>
                  <line
                    x1={targetCoord.x}
                    y1={targetCoord.y}
                    x2="185"
                    y2={targetCoord.y}
                    className="stroke-[#e07a7a] stroke-1 stroke-dasharray-[3,3] opacity-90"
                  />
                  <circle
                    cx="185"
                    cy={targetCoord.y}
                    r="3.5"
                    className="fill-[#e07a7a]"
                  />
                </g>
              )}

              {/* Cabeça */}
              <circle cx="100" cy="35" r="20" className="fill-[#070908] stroke-[#18201a] stroke-1" />

              {/* Ombros */}
              <path
                d="M 60,68 L 78,65 L 75,85 L 55,82 Z M 140,68 L 122,65 L 125,85 L 145,82 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Ombros'
                  ? 'fill-[#2be29d]/30 stroke-[#2be29d]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#2be29d]/15 hover:stroke-[#2be29d]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Ombros')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Ombros')}
              />

              {/* Peito */}
              <path
                d="M 78,65 L 122,65 L 120,105 L 100,110 L 80,105 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Peito'
                  ? 'fill-[#e07a7a]/40 stroke-[#e07a7a]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#e07a7a]/20 hover:stroke-[#e07a7a]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Peito')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Peito')}
              />

              {/* Bíceps */}
              <path
                d="M 52,85 L 72,87 L 68,130 L 50,120 Z M 148,85 L 128,87 L 132,130 L 150,120 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Biceps'
                  ? 'fill-[#2be29d]/30 stroke-[#2be29d]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#2be29d]/15 hover:stroke-[#2be29d]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Biceps')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Biceps')}
              />

              {/* Abdômen */}
              <path
                d="M 80,108 L 120,108 L 115,165 L 85,165 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Abdomen'
                  ? 'fill-[#2be29d]/30 stroke-[#2be29d]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#2be29d]/15 hover:stroke-[#2be29d]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Abdomen')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Abdomen')}
              />

              {/* Pernas */}
              <path
                d="M 78,170 L 98,170 L 93,270 L 73,260 Z M 122,170 L 102,170 L 107,270 L 127,260 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Pernas'
                  ? 'fill-[#2be29d]/30 stroke-[#2be29d]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#2be29d]/15 hover:stroke-[#2be29d]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Pernas')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Pernas')}
              />

              {/* Panturrilhas */}
              <path
                d="M 73,275 L 92,278 L 88,350 L 75,345 Z M 127,275 L 108,278 L 112,350 L 125,345 Z"
                className={`cursor-pointer transition-all duration-200 stroke-1 ${activeMuscle === 'Panturrilhas'
                  ? 'fill-[#2be29d]/30 stroke-[#2be29d]'
                  : 'fill-[#070908] stroke-[#18201a] hover:fill-[#2be29d]/15 hover:stroke-[#2be29d]'
                  }`}
                onMouseEnter={() => setHoveredMuscle('Panturrilhas')}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick('Panturrilhas')}
              />
            </svg>
          </div>

          {/* Badge Indicadora do Grupo Selecionado */}
          <div className="mt-2 px-3 py-1 bg-[#070908] border border-[#18201a] rounded-lg text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e07a7a]" />
            <span className="text-[#e07a7a] font-semibold">{activeMuscle || 'PEITORAL M'}</span>
          </div>
        </div>

        {/* Informações de Recuperação e Exercícios Alvo */}
        <div className="bg-[#070908] p-4 rounded-xl border border-[#18201a] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#18201a]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#2be29d]">RECUPERAÇÃO ESTIMADA</span>
            <span className="font-mono text-xs text-[#2be29d] font-bold">84%</span>
          </div>

          <div className="w-full bg-[#0e1210] h-1.5 rounded-full overflow-hidden border border-[#18201a]">
            <div className="bg-[#25d08e] h-full rounded-full w-[84%]" />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1">
            <span>INTENSIDADE ALVO</span>
            <span className="text-zinc-200 font-bold bg-[#18201a] px-2 py-0.5 rounded">RPE 8.5</span>
          </div>

          <div className="pt-2 border-t border-[#18201a] space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block">EXERCÍCIOS RECOMENDADOS</span>
            {(RECOMMENDED_EXERCISES[selectedMuscle || 'Peito'] || []).slice(0, 3).map((ex, idx) => (
              <div key={idx} className="bg-[#0e1210] px-2.5 py-1.5 rounded text-[11px] text-zinc-200 border border-[#18201a] flex justify-between items-center">
                <span className="truncate">{ex}</span>
                <span className="font-mono text-[9px] text-[#2be29d] bg-[#070908] px-1.5 py-0.5 rounded border border-[#18201a]">3x8-12</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}