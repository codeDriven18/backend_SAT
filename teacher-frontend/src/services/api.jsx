import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/", // Django backend
});

export const getNotifications = () => API.get("/notifications/");
