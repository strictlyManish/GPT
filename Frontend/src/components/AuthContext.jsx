// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // 👈 React Router navigation

  // Check cookies on app load
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token) => {
    Cookies.set("authToken", token, { expires: 7 }); // store for 7 days
    setIsAuthenticated(true);
    navigate("/"); // 👈 redirect to Home after login
  };

  const logout = () => {
    Cookies.remove("authToken");
    setIsAuthenticated(false);
    navigate("/login"); // 👈 redirect to Login after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
export const useAuth = () => useContext(AuthContext);
