import React, { useEffect, useState } from "react";
import { teacherAPI } from "../api/teacherApi";
import { Plus, Users, ClipboardList } from "lucide-react";
import CreateAssignmentModal from "./modals/CreateAssignmentModal";

const AssignmentsPage = () => {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // useEffect(() => {
  //   const fetchGroups = async () => {
  //     try {
  //       const res = await teacherAPI.getGroups();
  //       setGroups(res.data);
  //     } catch (err) {
  //       console.error("Failed to load groups", err);
  //     }
  //   };
  //   fetchGroups();
  // }, []);
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await teacherAPI.getAssignments();
        // console.log("Assignments API response:", res.data.results); 
        setGroups(Array.isArray(res.data) ? res.data : res.data.results || []); 
      } catch (err) {
        console.error("Failed to load groups", err);
        setGroups([]); // fallback
      }
    };
    fetchGroups();
  }, []);
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-600">Assign tests to student groups</p>
        </div>
        <button
          onClick={() => {
            setSelectedGroup(null);
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assignment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {group.group_name}
                </h3>
                <p className="text-sm text-gray-600">{group.test_title}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {group.student_count} students
              </span>
              <button
                onClick={() => {
                  setSelectedGroup(group);
                  setShowModal(true);
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Assign Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateAssignmentModal
          group={selectedGroup}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default AssignmentsPage;
