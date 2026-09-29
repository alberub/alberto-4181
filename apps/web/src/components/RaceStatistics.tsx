import { Trophy } from '@phosphor-icons/react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { betStats, raceStats, races } from '../services/fixtures';
export function RaceStatistics() {
  const won = betStats[0].value;
  return (
    <div className="charts-grid">
      <section id="apuestas" className="panel bet-panel">
        <div className="panel-heading">
          <div>
            <h2>Tus apuestas</h2>
            <p>Resultados de la jornada simulada</p>
          </div>
          <span className="soft-icon">
            <Trophy size={21} />
          </span>
        </div>
        <div
          className="donut-wrap"
          role="img"
          aria-label={`${won} apuestas ganadas y ${betStats[1].value} perdidas`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={betStats}
                dataKey="value"
                innerRadius={70}
                outerRadius={90}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                paddingAngle={4}
                isAnimationActive={false}
              >
                {betStats.map((entry, index) => (
                  <Cell key={entry.name} fill={index === 0 ? '#2e624a' : '#e1e9de'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <strong>
              {Math.round((won / races.length) * 100)}
              <small>%</small>
            </strong>
            <span>de aciertos</span>
          </div>
        </div>
        <div className="bet-legend">
          <div>
            <span>
              <i className="dot won" />
              Ganadas
            </span>
            <strong>{won}</strong>
          </div>
          <div>
            <span>
              <i className="dot lost" />
              Perdidas
            </span>
            <strong>{betStats[1].value}</strong>
          </div>
        </div>
      </section>
      <section id="victorias" className="panel race-chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Victorias por caracol</h2>
            <p>Un día simulado · 6 caracoles · 6 carreras</p>
          </div>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label={raceStats.map((snail) => `${snail.name}: ${snail.wins} victorias`).join(', ')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={raceStats}
              margin={{ top: 12, right: 10, left: -28, bottom: 2 }}
              barSize={38}
            >
              <CartesianGrid vertical={false} stroke="#edf0eb" strokeDasharray="3 4" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#667168', fontSize: 10 }}
                interval={0}
                tickMargin={14}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#667168', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: '#f1f5ee' }}
                formatter={(value) => [value, 'Victorias']}
                contentStyle={{ border: '1px solid #dfe5db', borderRadius: 10 }}
              />
              <Bar dataKey="wins" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {raceStats.map((snail) => (
                  <Cell key={snail.id} fill={snail.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">
          <Trophy size={16} />
          Meteoro lidera la jornada con 3 victorias.
        </p>
      </section>
    </div>
  );
}
