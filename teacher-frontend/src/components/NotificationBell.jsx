import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { getNotifications } from "../services/notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch notifications function
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data || []);
      // Count unread notifications
      const unread = data?.filter(note => !note.is_read) || [];
      setUnreadCount(unread.length);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = async () => {
    setOpen(!open);
    if (!open) {
      await fetchNotifications();
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) { // Only fetch in background when dropdown is closed
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [open]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white shadow-lg rounded-xl border z-50">
          <div className="p-3 font-semibold border-b flex items-center justify-between">
            <span>Notifications</span>
            <button 
              onClick={fetchNotifications}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No notifications</div>
          ) : (
            <ul className="divide-y">
              {notifications.map((note, idx) => (
                <li key={idx} className={`p-3 text-sm hover:bg-gray-50 ${!note.is_read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{note.title || "New notification"}</p>
                      <p className="text-gray-600">{note.message || "New update!"}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {note.created_at
                          ? new Date(note.created_at).toLocaleString()
                          : ""}
                      </div>
                    </div>
                    {!note.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
