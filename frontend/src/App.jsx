import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Provider } from 'react-redux';
import store from './redux/store';
import { StoreProvider, useStore } from './context/StoreContext';
import { CustomerProvider } from './context/CustomerContext';
import Navbar from './Components/Navbar';
import Footer from "./Components/Footer";

import './App.css'; 

function AppContent() {
  const location = useLocation();
  const { currentStore } = useStore();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  // Update document title based on current store
  React.useEffect(() => {
    if (currentStore) {
      document.title = currentStore.name;
    } else {
      document.title = 'EWA Luxe';
    }
  }, [currentStore]);

  if (isAuthPage) {
    return (
      <div>
        <Outlet />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <StoreProvider>
        <CustomerProvider>
          <AppContent />
        </CustomerProvider>
      </StoreProvider>
    </Provider>
  );
}

export default App;
