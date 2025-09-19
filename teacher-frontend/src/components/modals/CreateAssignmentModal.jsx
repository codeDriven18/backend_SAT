import React, { useEffect, useState } from "react";
import { teacherAPI } from "../../api/teacherApi";

const CreateAssignmentModal = ({ group, onClose }) => {
  const [groups, setGroups] = useState([]);
  const [ownTests, setOwnTests] = useState([]);
  const [libraryTests, setLibraryTests] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(group?.id || "");
  const [selectedTest, setSelectedTest] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, ownRes, libRes] = await Promise.all([
          teacherAPI.getGroups(),
          teacherAPI.getTests(),
          teacherAPI.getLibraryTests(),
        ]);
  
        // Handle pagination-style responses (check if results exist)
        setGroups(Array.isArray(groupRes.data) ? groupRes.data : groupRes.data.results || []);
        setOwnTests(Array.isArray(ownRes.data) ? ownRes.data : ownRes.data.results || []);
        setLibraryTests(Array.isArray(libRes.data) ? libRes.data : libRes.data.results || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedGroup || !selectedTest) return;
    try {
      await teacherAPI.assignTestToGroup({
        group_id: Number(selectedGroup),
        test_id: Number(selectedTest),
      });
      alert("✅ Assignment created successfully");
      onClose();
    } catch (err) {
      console.error("Failed to create assignment", err);
      alert("❌ Failed to create assignment");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold">Create Assignment</h2>

        {/* Select Group */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Group</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">-- Choose a group --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Test */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Test</label>
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">-- Choose a test --</option>

            {/* Own Tests */}
            <optgroup label="My Tests">
              {ownTests.length > 0 ? (
                ownTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))
              ) : (
                <option disabled>(No tests found)</option>
              )}
            </optgroup>

            {/* Library Tests */}
            <optgroup label="Library Tests">
              {libraryTests.length > 0 ? (
                libraryTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))
              ) : (
                <option disabled>(No library tests available)</option>
              )}
            </optgroup>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
