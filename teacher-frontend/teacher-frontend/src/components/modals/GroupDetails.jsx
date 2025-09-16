import React, { useEffect, useState } from "react";
import { teacherAPI } from "../../api/teacherApi";
import ManageGroupStudents from "./ManageGroupStudents";
import { Users, Calendar, ArrowLeft } from "lucide-react";

const GroupDetails = ({ groupId, onBack }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await teacherAPI.getGroup(groupId); // backend getGroup/{id}
        setGroup(res.data);
      } catch (err) {
        setError("❌ Failed to load group");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  if (loading) return <p>Loading group...</p>;
  if (error) return <p>{error}</p>;
  if (!group) return <p>No group found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
          <p className="text-gray-600">{group.description}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
      </div>

      <div className="flex items-center space-x-6 text-gray-600">
        <span className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          {group.students.length} students
        </span>
        <span className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(group.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* List current students */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Students in Group</h3>
        {group.students.length > 0 ? (
          <ul className="space-y-2">
            {group.students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between border p-2 rounded-lg"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-gray-600">{s.username} – {s.email}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No students in this group yet.</p>
        )}
      </div>

      {/* Manage Students (search/add/remove) */}
      <ManageGroupStudents groupId={groupId} />
    </div>
  );
};

export default GroupDetails;
