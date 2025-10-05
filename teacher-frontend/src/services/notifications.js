import api from "../api";

export const getNotifications = async () => {
  const res = await api.get("/apps.notifications/");
  return res.data;
};
