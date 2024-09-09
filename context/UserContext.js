import { createContext, useContext, useState } from 'react';

// Create a context object
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [isOpen, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
  };

  const openHandler = () => {
    setOpen(true);
  }

  return (
    <UserContext.Provider value={{ isOpen, close, openHandler }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for accessing the context
export const useUser = () => useContext(UserContext);
