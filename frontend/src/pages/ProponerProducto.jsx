import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { apiCall } from "../services/api";

export default function ProponerProducto() {
  const navigate = useNavigate();
  // Estado para guardar lo que el usuario escribe
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    min_stock: "5", // Valor por defecto sugerido
  });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // Función que actualiza el estado cada vez que se teclea algo
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función que se ejecuta al darle al botón de Guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });

    try {
      // Formateamos los datos para que FastAPI no se queje (ej. texto a número)
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
      };

      const respuesta = await apiCall("/api/productos/proponer", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (respuesta.ok) {
        setMensaje({
          tipo: "exito",
          texto: "¡Producto propuesto! Redirigiendo al panel...",
        });
        // Si todo sale bien, lo devolvemos al Dashboard después de 2 segundos
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        const errorData = await respuesta.json();
        setMensaje({
          tipo: "error",
          texto: errorData.detail || "Error al registrar el producto.",
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error de conexión con el servidor.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gray-900/50 p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlusCircle className="w-7 h-7 text-cyan-400" />
            <h2 className="text-xl font-bold">Proponer Nuevo Producto</h2>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
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

        {/* Formulario */}
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="Ej. 750123456789"
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="Ej. Lácteos, Snacks..."
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                placeholder="Ej. Leche Deslactosada 1L"
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stock Inicial
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="0"
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                <Save className="w-5 h-5" /> Enviar Propuesta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
