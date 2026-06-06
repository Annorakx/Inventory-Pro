import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProponerProducto from "./pages/ProponerProducto";
import EditarProducto from "./pages/EditarProducto";
// Este componente protege las rutas para que nadie entre sin token
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />

        {/* ESTA ES LA NUEVA RUTA */}
        <Route
          path="/proponer"
          element={
            <RutaProtegida>
              <ProponerProducto />
            </RutaProtegida>
          }
        />

        <Route
          path="/editar"
          element={
            <RutaProtegida>
              <EditarProducto />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
