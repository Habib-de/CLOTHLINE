// src/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem('kiin_preferences') || '{}');
        if (prefs.darkMode !== undefined) setDarkMode(prefs.darkMode);
        if (prefs.notifications !== undefined) setNotifications(prefs.notifications);
        if (prefs.emailNotifications !== undefined) setEmailNotifications(prefs.emailNotifications);
        if (prefs.language) setLanguage(prefs.language);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!isLoading) {
      const preferences = {
        darkMode,
        notifications,
        emailNotifications,
        language
      };
      localStorage.setItem('kiin_preferences', JSON.stringify(preferences));
      
      // Apply dark mode to document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, notifications, emailNotifications, language, isLoading]);

  const savePreferences = () => {
    const preferences = {
      darkMode,
      notifications,
      emailNotifications,
      language
    };
    localStorage.setItem('kiin_preferences', JSON.stringify(preferences));
    return true;
  };

  return (
    <SettingsContext.Provider value={{
      darkMode,
      setDarkMode,
      notifications,
      setNotifications,
      emailNotifications,
      setEmailNotifications,
      language,
      setLanguage,
      savePreferences,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};