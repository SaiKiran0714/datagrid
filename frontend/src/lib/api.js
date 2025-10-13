import axios from "axios";
import useErrorStore from "../store/errorStore";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { showError } = useErrorStore.getState();

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || error.message;

      if (status === 404) {
        showError("Resource not found", message);
      } else if (status === 500) {
        showError("Server error occurred", message);
      } else if (status >= 400 && status < 500) {
        showError("Request error", message);
      } else {
        showError("An error occurred", message);
      }
    } else if (error.request) {
      // Request made but no response received
      showError("Network error", "Unable to connect to the server. Please check your connection.");
    } else {
      // Something else happened
      showError("Error", error.message);
    }

    return Promise.reject(error);
  }
);

export async function getHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function getData(params) {
  const { data } = await api.get("/data", { params });
  return data;
}

export async function getRecord(id) {
  const { data } = await api.get(`/data/${id}`);
  return data;
}

export async function deleteRecord(id) {
  const { data } = await api.delete(`/data/${id}`);
  return data;
}

export async function getDistinct(field) {
  const { data } = await api.get("/data/distinct", { params: { field } });
  return data?.values || [];
}
