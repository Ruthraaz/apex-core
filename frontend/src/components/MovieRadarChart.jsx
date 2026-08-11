import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function MovieRadarChart({ scores }) {
  const data = [
    { subject: 'História', score: scores?.plot_score ?? 8.5, fullMark: 10 },
    { subject: 'Visual', score: scores?.cinematography_score ?? 9.0, fullMark: 10 },
    { subject: 'Áudio', score: scores?.sound_score ?? 8.0, fullMark: 10 },
    { subject: 'Empolgação', score: scores?.pacing_score ?? 8.0, fullMark: 10 },
    { subject: 'Impacto', score: scores?.cognitive_score ?? 9.2, fullMark: 10 },
    { subject: 'Inovação', score: scores?.originality_score ?? 8.8, fullMark: 10 },
  ];

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#18201a" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#2be29d"
            tick={{ fill: '#2be29d', fontSize: 10, fontFamily: 'monospace' }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#18201a" tick={false} />
          <Radar
            name="Scores"
            dataKey="score"
            stroke="#2be29d"
            fill="#25d08e"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
