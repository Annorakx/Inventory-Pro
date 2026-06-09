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
  ShieldAlert,
  Download,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { apiCall } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorAccion, setErrorAccion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

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
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const categoriasUnicas = [...new Set(productos.map((p) => p.category))];
  const productosFiltrados = productos.filter((item) => {
    const coincideBusqueda =
      item.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.barcode.includes(busqueda);
    const coincideCategoria =
      categoriaSeleccionada === "" || item.category === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  // --- PREPARACIÓN DE DATOS PARA GRÁFICOS ---
  // 1. Datos para BarChart: Top 5 productos con menos stock
  const datosBarras = [...productosFiltrados]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.substring(0, 12),
      stock: p.stock,
      min: p.min_stock,
    }));

  // 2. Datos para PieChart: Distribución por categoría
  const conteoCategorias = productosFiltrados.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const datosPie = Object.keys(conteoCategorias).map((cat) => ({
    name: cat,
    value: conteoCategorias[cat],
  }));

  const COLORES_PIE = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

  // --- FUNCIONES DE ACCIÓN ---
  const handleAprobar = async (id) => {
    try {
      const respuesta = await apiCall(`/api/productos/${id}/aprobar`, {
        method: "PUT",
      });
      if (respuesta.ok)
        setProductos(
          productos.map((p) =>
            p.id === id ? { ...p, status: "aprobado" } : p,
          ),
        );
    } catch (error) {
      console.error(error);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar permanentemente?")) return;
    try {
      const respuesta = await apiCall(`/api/productos/${id}`, {
        method: "DELETE",
      });
      if (respuesta.ok) setProductos(productos.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const exportarCSV = () => {
    const cabeceras = [
      "Código",
      "Producto",
      "Categoría",
      "Precio",
      "Stock",
      "Mínimo",
      "Estado",
    ];
    const filas = productosFiltrados.map((p) => [
      p.barcode,
      `"${p.name}"`,
      p.category,
      p.price,
      p.stock,
      p.min_stock,
      p.status,
    ]);
    const contenido = [cabeceras, ...filas].map((f) => f.join(",")).join("\n");
    const blob = new Blob([contenido], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Inventario_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera Principal */}
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <PackageSearch className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Inventory Pro{" "}
                <span className="text-cyan-400 text-sm font-mono ml-2">
                  v1.3
                </span>
              </h1>
              <p className="text-gray-400 text-sm">
                Panel de Control Administrativo
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/auditoria")}
              className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-2 rounded-xl border border-purple-500/30 transition-all"
            >
              <ShieldAlert className="w-5 h-5" /> Auditoría
            </button>
            <button
              onClick={() => navigate("/proponer")}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-900/20"
            >
              <Plus className="w-5 h-5" /> Nuevo
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
              className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SECCIÓN DE GRÁFICOS (CENTRO DE MANDO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-gray-200">Top 5: Stock Crítico</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosBarras}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="stock"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-gray-200">
                Distribución por Categoría
              </h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosPie}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {datosPie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORES_PIE[index % COLORES_PIE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RADAR Y ARCHIVERO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Rastrear producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            />
          </div>
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={exportarCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30 rounded-xl py-3 transition-all"
          >
            <Download className="w-5 h-5" /> Exportar CSV
          </button>
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm border-b border-gray-700">
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Categoría</th>
                <th className="p-4 font-semibold">Precio</th>
                <th className="p-4 font-semibold text-center">Stock</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {productosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-700/30 transition-colors group"
                >
                  <td className="p-4 text-gray-500 font-mono text-xs">
                    {item.barcode}
                  </td>
                  <td className="p-4 font-medium text-gray-200">{item.name}</td>
                  <td className="p-4 text-cyan-400/80 text-sm">
                    {item.category}
                  </td>
                  <td className="p-4 text-emerald-400 font-medium">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    {item.stock <= item.min_stock ? (
                      <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                        Crítico: {item.stock}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {item.stock}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === "aprobado" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status !== "aprobado" && (
                        <button
                          onClick={() => handleAprobar(item.id)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          navigate("/editar", { state: { producto: item } })
                        }
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(item.id)}
                        className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
