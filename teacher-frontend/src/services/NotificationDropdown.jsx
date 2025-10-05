import React, { useEffect, useState } from "react";
import { fetchNotifications } from "../services/notifications";

export default function NotificationDropdown({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications(token).then(setNotifications);
    }
  }, [open, token]);

  return (
    <div className="relative">
      {/* Bell icon */}
      <button onClick={() => setOpen(!open)} className="relative">
        🔔
        {notifications.some(n => !n.is_read) && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg max-h-96 overflow-y-auto z-50">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500">No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="p-4 border-b hover:bg-gray-100">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
