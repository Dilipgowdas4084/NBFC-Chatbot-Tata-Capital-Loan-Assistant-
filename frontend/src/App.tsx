import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';

interface UserSession {
  customerId: string;
  customerName: string;
}

type Page = 'dashboard' | 'chat';

function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLogin = (customerId: string, customerName: string) => {
    setUser({ customerId, customerName });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentPage === 'chat') {
    return (
      <ChatPage 
        customerId={user.customerId} 
        customerName={user.customerName} 
        onLogout={handleLogout}
        onBackToDashboard={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <DashboardPage 
      customerId={user.customerId} 
      customerName={user.customerName} 
      onStartChat={() => setCurrentPage('chat')}
      onLogout={handleLogout} 
    />
  );
}

export default App;
