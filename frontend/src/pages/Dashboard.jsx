import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  PackageSearch,
  AlertTriangle,
  CheckCircle,
  Plus,
} from "lucide-react";
import { apiCall } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAccion, setErrorAccion] = useState("");

  // useEffect se ejecuta automáticamente cuando entras a la pantalla
  useEffect(() => {
    // 1. Declaramos la función ADENTRO del useEffect para cumplir con las mejores prácticas de React
    const cargarInventario = async () => {
      try {
        const respuesta = await apiCall("/api/inventario");
        const data = await respuesta.json();
        setProductos(data.productos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. La llamamos inmediatamente
    cargarInventario();
  }, []); // <-- El Linter ahora estará completamente feliz

  // Función para aprobar un producto pendiente
  const handleAprobar = async (id) => {
    setErrorAccion("");
    try {
      const respuesta = await apiCall(`/api/productos/${id}/aprobar`, {
        method: "PUT",
      });

      if (respuesta.ok) {
        // Optimistic UI: Actualizamos el estado local de inmediato para reflejar el cambio
        setProductos(
          productos.map((p) =>
            p.id === id ? { ...p, status: "aprobado" } : p,
          ),
        );
      } else {
        const dataErr = await respuesta.json();
        // Si el guardia del backend nos frena por rol, capturamos el error
        setErrorAccion(
          dataErr.detail || "No tienes permisos para realizar esta acción",
        );
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      setErrorAccion("Error de conexión con el servidor");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera del Panel */}
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">
              Dashboard de Inventario
            </h1>
          </div>
          <button
            onClick={() => navigate("/proponer")}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold px-4 py-2 rounded-lg transition-colors border border-red-500/50"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>

        {/* Alerta de Error de Permisos */}
        {errorAccion && (
          <div className="bg-amber-500/10 border border-amber-500 text-amber-500 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium">
            ⚠️ {errorAccion}
          </div>
        )}

        {/* Tabla de Productos */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-10 text-center text-gray-400 animate-pulse">
              Descargando datos del servidor...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 border-b border-gray-700">
                  <th className="p-4 font-semibold">Código</th>
                  <th className="p-4 font-semibold">Producto</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold">Precio</th>
                  <th className="p-4 font-semibold text-center">Stock</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="p-4 text-gray-400 font-mono text-sm">
                      {item.barcode}
                    </td>
                    <td className="p-4 font-medium text-gray-200">
                      {item.name}
                    </td>
                    <td className="p-4 text-cyan-400 text-sm">
                      {item.category}
                    </td>
                    <td className="p-4 text-green-400 font-medium">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {item.stock <= item.min_stock ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold border border-red-500/30">
                          <AlertTriangle className="w-4 h-4" />
                          {item.stock}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-medium">
                          {item.stock}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.status === "aprobado" ||
                          item.status === "approved"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {/* El botón solo aparece si el estado no es aprobado */}
                      {item.status !== "aprobado" &&
                      item.status !== "approved" ? (
                        <button
                          onClick={() => handleAprobar(item.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
