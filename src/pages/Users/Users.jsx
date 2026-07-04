import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import AddUserModal from "../../components/Users/AddUserModal";
import UserModal from "../../components/Users/UserModal";
import useLanguageStore from "../../store/languageStore";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { script } = useLanguageStore();

  const translations = {
    title: script === "latin" ? "Foydalanuvchilar" : "Фойдаланувчилар",
    addUser:
      script === "latin" ? "+ Yangi foydalanuvchi" : "+ Янги фойдаланувчи",
    id: "ID",
    email: "Email",
    firstName: "Имя",
    lastName: "Фамилия",
    role: "Роль",
    registered: "Дата регистрации",
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseAddModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchUsers();
    handleCloseModal();
  };

  const handleUserCreated = () => {
    fetchUsers();
    handleCloseAddModal();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      nazorat:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      rahbar:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      operator:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      boshmexanik:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      mehanik:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      buxgalter:
        "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      yurist:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      partner: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      tasischi:
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      nazoratbux:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      electrengineer:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
    return (
      colors[role] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  const getRoleName = (role) => {
    const roles = {
      admin: "Админ",
      tasischi: "Таъсисчи",
      nazoratbux: "Назорат Бухгалтер",
      nazorat: "Назорат",
      rahbar: "Бошқарувчи",
      operator: "Оператор",
      boshmexanik: "Бош механик",
      mehanik: "Механик",
      buxgalter: "Бухгалтер",
      yurist: "Юрист",
      partner: "Хамкор",
      electrengineer: "Электронщик",
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {translations.title}
        </h1>
        <button
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          onClick={handleAddUser}
        >
          {translations.addUser}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.id}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.email}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.firstName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.lastName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.role}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {translations.registered}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300">
                    {user.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {user.firstName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {user.lastName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                        user.role,
                      )}`}
                    >
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt
                      ? new Date(
                          user.createdAt.seconds * 1000,
                        ).toLocaleDateString("ru-RU")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isUserModalOpen && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserModal
          onClose={handleCloseAddModal}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default Users;
