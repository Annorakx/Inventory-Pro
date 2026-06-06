const BASE_URL = "http://127.0.0.1:8000";

// Función para hacer peticiones automatizadas
export const apiCall = async (endpoint, options = {}) => {
  // Buscar si tenemos el Pase VIP guardado en el navegador
  const token = localStorage.getItem("token");

  // Configurar los encabezados por defecto
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Si hay token, lo inyecta
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si seguridad nos rechaza (Token vencido o inválido)
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/"; // Lleva de vuelta al Login
    throw new Error("Sesión expirada");
  }

  return response;
};
