import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const UserModal = ({ user, onClose, onUserUpdated, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email || "",
    displayName: user.displayName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    middleName: user.middleName || "",
    birthday: user.birthday || "",
    pinfl: user.pinfl || "",
    passportSeries: user.passportSeries || "",
    passportNumber: user.passportNumber || "",
    address: user.address || "",
    role: user.role || "operator",
    accessEndDate: user.accessEndDate || "",
  });
  const [loading, setLoading] = useState(false);

  const translations = {
    title: "Информация о пользователе",
    editTitle: "Редактирование пользователя",
    close: "×",
    email: "Логин",
    displayName: "Display Name",
    firstName: "Имя",
    lastName: "Фамилия",
    middleName: "Отчество",
    birthday: "День рождения",
    accessEndDate: "Дата завершения доступа",
    pinfl: "ПИНФЛ",
    passportSeries: "Серия паспорта",
    passportNumber: "Номер паспорта",
    address: "Адрес",
    role: "Роль",
    cancel: "Отмена",
    save: "Сохранить",
    saving: "Сохранение...",
    closeBtn: "Закрыть",
    edit: "Редактировать",
    accessStatus: "Статус доступа",
    active: "Активен",
    expired: "Доступ истек",
    daysLeft: "осталось",
    days: "дней",
  };

  const maskPinfl = (pinfl) => {
    if (!pinfl || pinfl.length < 3) return pinfl;
    return pinfl[0] + "*".repeat(pinfl.length - 2) + pinfl[pinfl.length - 1];
  };

  const maskPassportNumber = (number) => {
    if (!number || number.length < 3) return number;
    return (
      number[0] + "*".repeat(number.length - 2) + number[number.length - 1]
    );
  };

  const handleInputChange = (e) => {
    if (readOnly) return;

    const { name, value } = e.target;

    let processedValue = value;

    if (name === "passportNumber" && value.length > 7) return;
    if (name === "pinfl" && value.length > 14) return;
    if (name === "passportSeries" && value.length > 2) return;

    if (name === "passportNumber" || name === "pinfl") {
      processedValue = value.replace(/\D/g, "");
    }

    if (name === "passportSeries") {
      processedValue = value.toUpperCase().replace(/[^A-ZА-Я]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userDoc = doc(db, "users", user.id);
      const updateData = {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        birthday: formData.birthday,
        pinfl: formData.pinfl,
        passportSeries: formData.passportSeries,
        passportNumber: formData.passportNumber,
        address: formData.address,
        role: formData.role,
        accessEndDate: formData.accessEndDate,
      };

      await updateDoc(userDoc, updateData);
      onUserUpdated();
      setIsEditing(false);
      alert("Данные пользователя успешно обновлены");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Ошибка при обновлении пользователя: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user.email || "",
      displayName: user.displayName || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      birthday: user.birthday || "",
      pinfl: user.pinfl || "",
      passportSeries: user.passportSeries || "",
      passportNumber: user.passportNumber || "",
      address: user.address || "",
      role: user.role || "operator",
      accessEndDate: user.accessEndDate || "",
    });
    setIsEditing(false);
  };

  const getAccessStatus = () => {
    if (!formData.accessEndDate) {
      return {
        status: "active",
        text: translations.active,
        color: "text-green-600",
      };
    }

    const endDate = new Date(formData.accessEndDate);
    const today = new Date();

    if (endDate < today) {
      return {
        status: "expired",
        text: translations.expired,
        color: "text-red-600",
      };
    } else {
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return {
        status: "active",
        text: `${translations.active} (${translations.daysLeft} ${daysLeft} ${translations.days})`,
        color: daysLeft <= 7 ? "text-yellow-600" : "text-green-600",
      };
    }
  };

  const accessStatus = getAccessStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? translations.editTitle : translations.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {translations.close}
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Access Status */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.accessStatus}
              </label>
              <div
                className={`px-3 py-2 rounded-lg border ${
                  accessStatus.status === "expired"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                }`}
              >
                <span className={`font-medium ${accessStatus.color}`}>
                  {accessStatus.text}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.email}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.displayName}
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.firstName}
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.lastName}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Middle Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.middleName}
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.birthday}
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Access End Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.accessEndDate}
              </label>
              <input
                type="date"
                name="accessEndDate"
                value={formData.accessEndDate}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* PINFL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.pinfl}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="pinfl"
                  value={formData.pinfl}
                  onChange={handleInputChange}
                  maxLength={14}
                  placeholder="14 цифр"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                  {maskPinfl(user.pinfl)}
                </div>
              )}
            </div>

            {/* Passport Series */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.passportSeries}
              </label>
              <input
                type="text"
                name="passportSeries"
                value={formData.passportSeries}
                onChange={handleInputChange}
                disabled={!isEditing}
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 uppercase"
              />
            </div>

            {/* Passport Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.passportNumber}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  maxLength={7}
                  placeholder="7 цифр"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                  {maskPassportNumber(user.passportNumber)}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.address}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Город, улица, дом"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translations.role}
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              >
                <option value="admin">Админ</option>
                <option value="tasischi">Таъсисчи</option>
                <option value="nazoratbux">Назорат Бухгалтер</option>
                <option value="nazorat">Назорат</option>
                <option value="rahbar">Бошқарувчи</option>
                <option value="operator">Оператор</option>
                <option value="boshmexanik">Бош механик</option>
                <option value="mehanik">Механик</option>
                <option value="buxgalter">Бухгалтер</option>
                <option value="yurist">Юрист</option>
                <option value="partner">Хамкор</option>
                <option value="electrengineer">Электронщик</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {translations.closeBtn}
              </button>
              {!readOnly && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {translations.edit}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {translations.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? translations.saving : translations.save}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModal;
