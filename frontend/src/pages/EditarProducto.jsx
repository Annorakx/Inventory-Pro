import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { apiCall } from "../services/api";

export default function EditarProducto() {
  const navigate = useNavigate();
  const location = useLocation();
  const productoAEditar = location.state?.producto;

  // 1. REGLA DE ORO DE REACT: Los Hooks siempre se declaran arriba del todo, antes de cualquier "return" condicional
  // Usamos el operador ?. y valores por defecto para que no falle si el producto inicialmente no se ha cargado
  const [formData, setFormData] = useState({
    barcode: productoAEditar?.barcode || "",
    name: productoAEditar?.name || "",
    category: productoAEditar?.category || "",
    price: productoAEditar?.price || "",
    stock: productoAEditar?.stock || "",
    min_stock: productoAEditar?.min_stock || "",
  });

  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // 2. Redirección segura dentro de un useEffect si intentan ingresar directo por URL sin un producto seleccionado
  useEffect(() => {
    if (!productoAEditar) {
      navigate("/dashboard");
    }
  }, [productoAEditar, navigate]);

  // Si no hay producto válido en el estado de navegación, frenamos el renderizado aquí abajo
  if (!productoAEditar) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
      };

      const respuesta = await apiCall(`/api/productos/${productoAEditar.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setMensaje({
          tipo: "exito",
          texto: "¡Inventario actualizado! Redirigiendo...",
        });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const errorData = await respuesta.json();
        setMensaje({
          tipo: "error",
          texto: errorData.detail || "Error al actualizar.",
        });
      }
    } catch (error) {
      // Al usar console.error aquí solucionamos la advertencia del linter de variable no utilizada
      printConsoleError(error);
      setMensaje({
        tipo: "error",
        texto: "Error de conexión con el servidor.",
      });
    }
  };

  // Función auxiliar interna para no repetir código de consola
  function printConsoleError(err) {
    console.error("Detalle del error en la petición de actualización:", err);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gray-900/50 p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="w-7 h-7 text-blue-400" />
            <h2 className="text-xl font-bold">Editar Producto</h2>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Cancelar
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {mensaje.texto && (
          <div
            className={`p-4 text-center font-bold text-sm ${mensaje.tipo === "exito" ? "bg-green-500/20 text-green-400 border-b border-green-500/30" : "bg-red-500/20 text-red-400 border-b border-red-500/30"}`}
          >
            {mensaje.texto}
          </div>
        )}

        {/* Formulario Pre-llenado */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Código de Barras
                </label>
                <input
                  required
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Categoría
                </label>
                <input
                  required
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nombre del Producto
              </label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Precio ($)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stock Actual
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stock Mínimo
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                <Save className="w-5 h-5" /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
