'use client';

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Graficos({ datosCategoria, datosEstado, datosEvolucion }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* Distribución por Categoría */}
      <div className="glass-card p-6 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
          Tickets por Categoría
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosCategoria}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              >
                {datosCategoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} tickets`, 'Cantidad']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carga por Estado */}
      <div className="glass-card p-6 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
          Carga de Trabajo (Estados)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosEstado}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {datosEstado.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.name === 'Abierto' ? '#3b82f6' : 
                    entry.name === 'Proceso' ? '#f59e0b' : '#10b981'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolución Mensual */}
      <div className="glass-card p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
          Tickets Registrados (Últimos meses)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosEvolucion}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tickets" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}
