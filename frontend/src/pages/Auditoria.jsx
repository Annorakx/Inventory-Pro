import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ArrowLeft,
  Clock,
  User,
  Activity,
  Package,
  FileText,
} from "lucide-react";
import { apiCall } from "../services/api";

export default function Auditoria() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    const cargarLogs = async () => {
      try {
        const respuesta = await apiCall("/api/auditoria");
        if (respuesta.ok) {
          const data = await respuesta.json();
          setLogs(data.logs);
        } else {
          const dataErr = await respuesta.json();
          setErrorAccion(
            dataErr.detail || "No tienes permisos para ver la auditoría",
          );
        }
      } catch (error) {
        console.error("Error al cargar auditoría:", error);
        setErrorAccion("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    cargarLogs();
  }, []);

  // Función para darle color a la acción
  const getActionColor = (action) => {
    switch (action) {
      case "APROBACIÓN":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "EDICIÓN":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "ELIMINACIÓN":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">
              Bitácora de Auditoría
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al Dashboard
          </button>
        </div>

        {errorAccion ? (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-8 rounded-xl text-center font-bold text-lg">
            ⛔ Acceso Denegado: {errorAccion}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-10 text-center text-gray-400 animate-pulse">
                Desencriptando registros del sistema...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                No hay registros de auditoría todavía. Realiza algún cambio en
                el inventario.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 border-b border-gray-700">
                    <th className="p-4 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Fecha y Hora
                    </th>
                    <th className="p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Usuario
                      </div>
                    </th>
                    <th className="p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Acción
                      </div>
                    </th>
                    <th className="p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Producto
                      </div>
                    </th>
                    <th className="p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Detalles
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors text-sm"
                    >
                      <td className="p-4 text-gray-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-gray-200">
                        @{log.username}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded border text-xs font-bold ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-cyan-400 font-medium">
                        {log.product_name}
                      </td>
                      <td className="p-4 text-gray-400 italic">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
