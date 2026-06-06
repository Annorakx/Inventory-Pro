import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  PackageSearch,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  Edit,
} from "lucide-react";
import { apiCall } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAccion, setErrorAccion] = useState("");

  // Estados para los filtros en tiempo real (El Radar)
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  // Cargar el inventario desde el backend
  useEffect(() => {
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

    cargarInventario();
  }, []); // Manteniendo la función dentro cumplimos con las mejores prácticas de React

  // Función para aprobar un producto pendiente
  const handleAprobar = async (id) => {
    setErrorAccion("");
    try {
      const respuesta = await apiCall(`/api/productos/${id}/aprobar`, {
        method: "PUT",
      });

      if (respuesta.ok) {
        // Optimistic UI: Actualizamos el estado local de inmediato
        setProductos(
          productos.map((p) =>
            p.id === id ? { ...p, status: "aprobado" } : p,
          ),
        );
      } else {
        const dataErr = await respuesta.json();
        setErrorAccion(
          dataErr.detail || "No tienes permisos para realizar esta acción",
        );
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      setErrorAccion("Error de conexión con el servidor");
    }
  };

  // Función para eliminar un producto permanentemente
  const handleEliminar = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este producto permanentemente?",
      )
    ) {
      return;
    }

    setErrorAccion("");
    try {
      const respuesta = await apiCall(`/api/productos/${id}`, {
        method: "DELETE",
      });

      if (respuesta.ok) {
        // Filtramos el producto borrado del estado para que desaparezca al instante
        setProductos(productos.filter((p) => p.id !== id));
      } else {
        const dataErr = await respuesta.json();
        setErrorAccion(dataErr.detail || "No tienes permisos para eliminar");
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

  // --- LÓGICA DE FILTRADO EN TIEMPO REAL ---
  // Extraemos las categorías únicas disponibles en los productos actuales
  const categoriasUnicas = [...new Set(productos.map((p) => p.category))];

  // Filtramos la lista en memoria según la barra de búsqueda y el selector
  const productosFiltrados = productos.filter((item) => {
    const coincideBusqueda =
      item.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.barcode.includes(busqueda);

    const coincideCategoria =
      categoriaSeleccionada === "" || item.category === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

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

          {/* Botones de acción general */}
          <div className="flex gap-4">
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
        </div>

        {/* Alerta de Error de Permisos */}
        {errorAccion && (
          <div className="bg-amber-500/10 border border-amber-500 text-amber-500 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium">
            ⚠️ {errorAccion}
          </div>
        )}

        {/* CONTROLES DE BÚSQUEDA Y FILTRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Barra de Búsqueda */}
          <div className="md:col-span-2 relative flex items-center">
            <Search className="w-5 h-5 text-gray-500 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-md"
            />
          </div>

          {/* Selector de Categorías */}
          <div className="relative flex items-center">
            <Filter className="w-5 h-5 text-gray-500 absolute left-4 pointer-events-none" />
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-md appearance-none cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-4 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-10 text-center text-gray-400 animate-pulse">
              Descargando datos del servidor...
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">
              🔍 No se encontraron productos que coincidan con los filtros
              actuales.
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
                {productosFiltrados.map((item) => (
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
                      <div className="flex items-center justify-center gap-2">
                        {/* Botón Aprobar (Solo si el producto no está aprobado) */}
                        {item.status !== "aprobado" &&
                          item.status !== "approved" && (
                            <button
                              onClick={() => handleAprobar(item.id)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                        {/* Botón Editar (Viaja a la ruta llevando los datos del producto en el estado de navegación) */}
                        <button
                          onClick={() =>
                            navigate("/editar", { state: { producto: item } })
                          }
                          className="inline-flex items-center gap-1 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleEliminar(item.id)}
                          className="inline-flex items-center gap-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
