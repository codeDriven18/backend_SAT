import React, { useState } from "react";
import { teacherAPI } from "../../api/teacherApi";

const ManageGroupStudents = ({ groupId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await teacherAPI.searchStudents(query);
      setResults(res.data); // backend returns array of {id, username, name, email}
    } catch (err) {
      setMessage("❌ Error searching students");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      await teacherAPI.addStudentToGroup(groupId, { student_id: studentId });
      setMessage("✅ Student added to group");
    } catch (err) {
      setMessage("❌ Failed to add student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await teacherAPI.removeStudentFromGroup(groupId, { student_id: studentId });
      setMessage("✅ Student removed from group");
    } catch (err) {
      setMessage("❌ Failed to remove student");
    }
  };

  

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Manage Students</h2>

      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students by name or username..."
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {message && <p className="text-sm mb-2">{message}</p>}

      <ul className="space-y-2">
        {results.map((student) => (
          <li
            key={student.id}
            className="flex items-center justify-between border p-2 rounded-lg"
          >
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-gray-600">
                {student.username} – {student.email}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleAddStudent(student.id)}
                className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
              >
                Add
              </button>
              <button
                onClick={() => handleRemoveStudent(student.id)}
                className="text-sm px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageGroupStudents;
