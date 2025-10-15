import { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "../services/notifications";

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

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
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
        className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
            <span className="text-[10px] text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 max-h-[500px] bg-white shadow-xl rounded-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 font-semibold border-b bg-gray-50 flex items-center justify-between">
            <span className="text-gray-800">Notifications</span>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button 
                onClick={fetchNotifications}
                className="text-xs text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((note) => (
                  <li 
                    key={note.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !note.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !note.is_read && handleMarkAsRead(note.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <p className={`text-sm ${!note.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {note.title || "New notification"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {note.message || "New update!"}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {note.created_at
                              ? new Date(note.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ""}
                          </span>
                          {!note.is_read && (
                            <span className="text-xs text-blue-600 font-medium">New</span>
                          )}
                        </div>
                      </div>
                      {!note.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
