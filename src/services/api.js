import axios from "axios";

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Serialize array query params as repeated keys (vehicleTypes=A&vehicleTypes=B)
  // instead of axios' default vehicleTypes[]=A&vehicleTypes[]=B, since that's what
  // Spring's default List<String>/List<LocalDate> query binding expects.
  paramsSerializer: {
    indexes: null
  }
});

// 1. REQUEST INTERCEPTOR: Lisab tokeni päringutele
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
});

// 2. RESPONSE INTERCEPTOR: Puhastab prahi, kui token ei kehti
apiClient.interceptors.response.use(
  response => response, // Kui kõik on OK, liigume edasi
  error => {
    // Kui backend vastab 401 (Unauthorized) või 403 (Forbidden)
    // See tähendab, et token on vale, aegunud või kasutaja andmebaasist kustutatud
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Token on vigane või aegunud. Logime välja.");
      localStorage.removeItem('jwt'); // Kustutame vigase tokeni

      // Valikuline: suuna kasutaja sisselogimise lehele
      // window.location.href = '/users';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
