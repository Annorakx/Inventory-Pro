import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Destruimos el Pase VIP
    navigate("/"); // Volvemos al Login
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h1 className="text-2xl font-bold text-cyan-400">
            Dashboard General
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>

        <div className="p-10 border-2 border-dashed border-gray-700 rounded-xl text-center text-gray-400">
          <p className="text-xl">
            ¡Bienvenido a la zona segura! Aquí irán las estadísticas.
          </p>
        </div>
      </div>
    </div>
  );
}
