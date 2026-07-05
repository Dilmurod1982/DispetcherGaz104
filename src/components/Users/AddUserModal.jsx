import React, { useState, useCallback, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { toast } from "react-toastify";

const AddUserModal = ({ onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    firstName: "",
    lastName: "",
    middleName: "",
    birthday: "",
    pinfl: "",
    passportSeries: "",
    passportNumber: "",
    address: "",
    role: "operator",
    accessEndDate: "",
    assignedCities: [], // Новое поле для прикрепленных районов/городов
  });
  const [loading, setLoading] = useState(false);
  const [uniqueErrors, setUniqueErrors] = useState({
    email: "",
    passportNumber: "",
    pinfl: "",
  });
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Сохраняем текущего пользователя до создания нового
  const [currentUser, setCurrentUser] = useState(null);

  // Роли, для которых показываем выбор районов
  const rolesWithCities = ["ray_disp", "tuman_bosh", "tuman_metrolog", "guest"];

  const translations = {
    title: "Добавить нового пользователя",
    close: "×",
    email: "Email *",
    password: "Пароль *",
    displayName: "Display Name *",
    firstName: "Имя *",
    lastName: "Фамилия *",
    middleName: "Отчество",
    birthday: "День рождения *",
    accessEndDate: "Дата завершения доступа",
    pinfl: "ПИНФЛ *",
    passportSeries: "Серия паспорта *",
    passportNumber: "Номер паспорта *",
    address: "Адрес",
    role: "Роль *",
    assignedCities: "Прикрепленные районы/города",
    selectAll: "Выбрать все",
    deselectAll: "Снять все",
    cancel: "Отмена",
    create: "Создать пользователя",
    creating: "Создание...",
    passwordHint:
      "Минимум 8 символов, заглавные и строчные буквы, цифры, специальные символы",
    weak: "Слабый пароль",
    medium: "Средний пароль",
    strong: "Сильный пароль",
    pinflHint: "14 цифр",
    passportSeriesHint: "2 буквы",
    passportNumberHint: "7 цифр",
    noCities: "Районы/города не найдены",
    loadingCities: "Загрузка районов/городов...",
  };

  // Загрузка городов при открытии модалки
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setCitiesLoading(true);
    try {
      const citiesSnapshot = await getDocs(collection(db, "cities"));
      const citiesData = citiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);
    } catch (error) {
      console.error("Error loading cities:", error);
      toast.error("Ошибка загрузки районов/городов");
    } finally {
      setCitiesLoading(false);
    }
  };

  const validatePassword = useCallback((password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }, []);

  const getPasswordStrength = useCallback(
    (password) => {
      if (!password) return { strength: 0, message: "" };

      let strength = 0;
      let message = "";

      if (password.length >= 8) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[a-z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 12.5;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;

      if (strength < 50) message = translations.weak;
      else if (strength < 75) message = translations.medium;
      else message = translations.strong;

      return { strength, message };
    },
    [translations],
  );

  const checkUniqueFields = useCallback(async (field, value) => {
    if (!value) return "";

    try {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where(field, "==", value));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const fieldNames = {
          email: "email",
          passportNumber: "номер паспорта",
          pinfl: "ПИНФЛ",
        };
        return `Такой ${fieldNames[field] || field} уже существует в базе`;
      }
      return "";
    } catch (error) {
      console.error("Error checking unique field:", error);
      return "Ошибка проверки уникальности";
    }
  }, []);

  const isFormValid = useCallback(() => {
    const requiredFields = {
      email: formData.email.trim() !== "" && !uniqueErrors.email,
      password:
        formData.password.trim() !== "" && validatePassword(formData.password),
      displayName: formData.displayName.trim() !== "",
      firstName: formData.firstName.trim() !== "",
      lastName: formData.lastName.trim() !== "",
      birthday: formData.birthday.trim() !== "",
      pinfl:
        formData.pinfl.trim() !== "" &&
        formData.pinfl.length === 14 &&
        !uniqueErrors.pinfl,
      passportSeries:
        formData.passportSeries.trim() !== "" &&
        formData.passportSeries.length === 2,
      passportNumber:
        formData.passportNumber.trim() !== "" &&
        formData.passportNumber.length === 7 &&
        !uniqueErrors.passportNumber,
      role: formData.role.trim() !== "",
    };

    // Если роль требует выбора районов, проверяем что выбрано хотя бы одно
    if (rolesWithCities.includes(formData.role)) {
      requiredFields.assignedCities = formData.assignedCities.length > 0;
    }

    return (
      Object.values(requiredFields).every(Boolean) &&
      !Object.values(uniqueErrors).some((error) => error !== "")
    );
  }, [formData, uniqueErrors, validatePassword, rolesWithCities]);

  const handleInputChange = async (e) => {
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

    if (name === "email" && processedValue) {
      const error = await checkUniqueFields("email", processedValue);
      setUniqueErrors((prev) => ({ ...prev, email: error }));
    }

    if (name === "passportNumber" && processedValue.length === 7) {
      const error = await checkUniqueFields("passportNumber", processedValue);
      setUniqueErrors((prev) => ({ ...prev, passportNumber: error }));
    }

    if (name === "pinfl" && processedValue.length === 14) {
      const error = await checkUniqueFields("pinfl", processedValue);
      setUniqueErrors((prev) => ({ ...prev, pinfl: error }));
    }
  };

  // Обработка выбора района/города
  const handleCityToggle = (cityId) => {
    setFormData((prev) => {
      const currentCities = prev.assignedCities || [];
      if (currentCities.includes(cityId)) {
        return {
          ...prev,
          assignedCities: currentCities.filter((id) => id !== cityId),
        };
      } else {
        return {
          ...prev,
          assignedCities: [...currentCities, cityId],
        };
      }
    });
  };

  // Выбрать все районы
  const handleSelectAll = () => {
    const allCityIds = cities.map((city) => city.id);
    setFormData((prev) => ({
      ...prev,
      assignedCities: allCityIds,
    }));
  };

  // Снять все районы
  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      assignedCities: [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.warning("Пожалуйста, заполните все обязательные поля корректно");
      return;
    }

    setLoading(true);

    try {
      // 1. Сохраняем текущего пользователя
      const currentUser = auth.currentUser;
      const currentUserEmail = currentUser?.email;
      const currentUserPassword = prompt(
        "Для создания нового пользователя, пожалуйста, введите ваш пароль для подтверждения:",
      );

      if (!currentUserEmail || !currentUserPassword) {
        toast.warning("Необходим пароль для подтверждения");
        setLoading(false);
        return;
      }

      // 2. Создаем нового пользователя
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // 3. Сохраняем данные пользователя в Firestore
      const userData = {
        ...formData,
        uid: userCredential.user.uid,
        createdAt: new Date(),
        isActive: true,
        // Сохраняем названия городов для отображения
        assignedCitiesNames: formData.assignedCities.map(
          (cityId) => cities.find((c) => c.id === cityId)?.name || cityId,
        ),
      };

      await addDoc(collection(db, "users"), userData);

      // 4. Выходим из нового пользователя
      await auth.signOut();

      // 5. Входим обратно под старым пользователем
      await signInWithEmailAndPassword(
        auth,
        currentUserEmail,
        currentUserPassword,
      );

      toast.success("Пользователь успешно создан!");
      onUserCreated();
    } catch (error) {
      console.error("Error creating user:", error);

      let errorMessage = "Ошибка при создании пользователя";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Пользователь с таким email уже существует";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Слишком слабый пароль";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const isFieldValid = (fieldName, value) => {
    switch (fieldName) {
      case "email":
        return value.trim() !== "" && !uniqueErrors.email;
      case "password":
        return value.trim() !== "" && validatePassword(value);
      case "displayName":
      case "firstName":
      case "lastName":
      case "birthday":
      case "role":
        return value.trim() !== "";
      case "pinfl":
        return (
          value.trim() !== "" && value.length === 14 && !uniqueErrors.pinfl
        );
      case "passportSeries":
        return value.trim() !== "" && value.length === 2;
      case "passportNumber":
        return (
          value.trim() !== "" &&
          value.length === 7 &&
          !uniqueErrors.passportNumber
        );
      default:
        return false;
    }
  };

  // Проверяем, нужно ли показывать выбор районов
  const showCitySelection = rolesWithCities.includes(formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {translations.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {translations.close}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.email}
                  {isFieldValid("email", formData.email) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    uniqueErrors.email ? "border-red-300" : "border-gray-300"
                  } ${
                    isFieldValid("email", formData.email)
                      ? "border-green-300"
                      : ""
                  }`}
                />
                {uniqueErrors.email && (
                  <div className="text-red-500 text-xs">
                    {uniqueErrors.email}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.password}
                  {isFieldValid("password", formData.password) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    isFieldValid("password", formData.password)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
                />
                {formData.password && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          passwordStrength.strength < 50
                            ? "bg-red-500"
                            : passwordStrength.strength < 75
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {passwordStrength.message} • {translations.passwordHint}
                    </div>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.displayName}
                  {isFieldValid("displayName", formData.displayName) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    isFieldValid("displayName", formData.displayName)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
                />
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.firstName}
                  {isFieldValid("firstName", formData.firstName) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    isFieldValid("firstName", formData.firstName)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.lastName}
                  {isFieldValid("lastName", formData.lastName) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    isFieldValid("lastName", formData.lastName)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Birthday */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.birthday}
                  {isFieldValid("birthday", formData.birthday) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    isFieldValid("birthday", formData.birthday)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Дата, когда доступ пользователя будет автоматически отключен
                </div>
              </div>

              {/* PINFL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.pinfl}
                  {isFieldValid("pinfl", formData.pinfl) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="pinfl"
                  value={formData.pinfl}
                  onChange={handleInputChange}
                  maxLength={14}
                  placeholder={translations.pinflHint}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    uniqueErrors.pinfl ? "border-red-300" : "border-gray-300"
                  } ${
                    isFieldValid("pinfl", formData.pinfl)
                      ? "border-green-300"
                      : ""
                  }`}
                />
                {uniqueErrors.pinfl && (
                  <div className="text-red-500 text-xs">
                    {uniqueErrors.pinfl}
                  </div>
                )}
                {formData.pinfl && formData.pinfl.length !== 14 && (
                  <div className="text-yellow-500 text-xs">
                    Должно быть 14 цифр
                  </div>
                )}
              </div>

              {/* Passport Series */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.passportSeries}
                  {isFieldValid("passportSeries", formData.passportSeries) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="passportSeries"
                  value={formData.passportSeries}
                  onChange={handleInputChange}
                  maxLength={2}
                  placeholder={translations.passportSeriesHint}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 uppercase ${
                    isFieldValid("passportSeries", formData.passportSeries)
                      ? "border-green-300"
                      : "border-gray-300"
                  }`}
                />
                {formData.passportSeries &&
                  formData.passportSeries.length !== 2 && (
                    <div className="text-yellow-500 text-xs">
                      Должно быть 2 буквы
                    </div>
                  )}
              </div>

              {/* Passport Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translations.passportNumber}
                  {isFieldValid("passportNumber", formData.passportNumber) && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  maxLength={7}
                  placeholder={translations.passportNumberHint}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    uniqueErrors.passportNumber
                      ? "border-red-300"
                      : "border-gray-300"
                  } ${
                    isFieldValid("passportNumber", formData.passportNumber)
                      ? "border-green-300"
                      : ""
                  }`}
                />
                {uniqueErrors.passportNumber && (
                  <div className="text-red-500 text-xs">
                    {uniqueErrors.passportNumber}
                  </div>
                )}
                {formData.passportNumber &&
                  formData.passportNumber.length !== 7 && (
                    <div className="text-yellow-500 text-xs">
                      Должно быть 7 цифр
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
                  placeholder="Город, улица, дом"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="admin">Админ</option>
                  <option value="direktor">Директор</option>
                  <option value="bolim">Бўлим</option>
                  <option value="vil_disp">Вилоят диспетчери</option>
                  <option value="ray_disp">Туман/шаҳар диспетчери</option>
                  <option value="guest">Мехмон</option>
                  <option value="tuman_bosh">ГТБ бошлиғи</option>
                  <option value="tuman_metrolog">Туман/шаҳар метрологи</option>
                  <option value="metrolog">Вилоят метрологи</option>
                </select>
              </div>

              {/* Прикрепленные районы/города - показываем только для определенных ролей */}
              {showCitySelection && (
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {translations.assignedCities}
                    {formData.assignedCities.length > 0 && (
                      <span className="text-green-500 ml-1">
                        ✓ ({formData.assignedCities.length})
                      </span>
                    )}
                  </label>

                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {translations.selectAll}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {translations.deselectAll}
                    </button>
                  </div>

                  {citiesLoading ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {translations.loadingCities}
                    </div>
                  ) : cities.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                      {cities.map((city) => {
                        const isChecked = formData.assignedCities.includes(
                          city.id,
                        );
                        const cityType =
                          city.type === "Город" ? "шаҳар" : "туман";
                        return (
                          <label
                            key={city.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCityToggle(city.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {city.name} ({cityType})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {translations.noCities}
                    </div>
                  )}

                  {formData.assignedCities.length === 0 && (
                    <div className="text-xs text-orange-500">
                      Выберите хотя бы один район/город
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {translations.cancel}
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? translations.creating : translations.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
