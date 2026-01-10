import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import AnalysisProgress from './components/AnalysisProgress';

type Page = 'home' | 'analysis' | 'dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');

  const handleAnalysisStart = (documentId: string) => {
    setCurrentDocumentId(documentId);
    setCurrentPage('analysis');
  };

  const handleAnalysisComplete = () => {
    setCurrentPage('dashboard');
  };

  const handleNewAnalysis = () => {
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (currentPage === 'analysis' && currentDocumentId) {
    return (
      <AnalysisProgress
        documentId={currentDocumentId}
        onComplete={handleAnalysisComplete}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onNewAnalysis={handleNewAnalysis} />;
  }

  return <Home onAnalysisStart={handleAnalysisStart} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
