import { crearTicket } from '../actions' // Importamos la función que acabamos de crear

export default function NuevoTicketPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📝 Nuevo Ticket</h1>
        
        {/* Al enviar este formulario, se ejecutará la función 'crearTicket' del servidor */}
        <form action={crearTicket} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Título del problema</label>
            <input 
              name="titulo" 
              type="text" 
              required 
              placeholder="Ej: El ratón no funciona"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción detallada</label>
            <textarea 
              name="descripcion" 
              required 
              rows={4}
              placeholder="Explica qué ha pasado..."
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prioridad</label>
            <select 
              name="prioridad" 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            >
              <option value="BAJA">Baja (Puede esperar)</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta (Urgente)</option>
            </select>
          </div>

          {/* CATEGORÍA */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
  <select 
    name="categoria" 
    className="w-full rounded-md border-gray-300 p-3 shadow-sm bg-white"
  >
    <option value="HARDWARE">🖥️ Hardware (Equipos, Pantallas...)</option>
    <option value="SOFTWARE">💾 Software (Programas, Licencias...)</option>
    <option value="RED">🌐 Red e Internet</option>
    <option value="CUENTAS">🔑 Cuentas y Contraseñas</option>
    <option value="OTROS">❓ Otros</option>
  </select>
</div>

          <div className="pt-4 flex gap-2">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Guardar Ticket
            </button>
            <a href="/" className="w-full text-center bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition">
              Cancelar
            </a>
          </div>

        </form>
      </div>
    </div>
  )
}