import { useEffect, useState } from 'react';
import { FileCheck2, LogOut, FileText, TrendingDown, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Document {
  id: string;
  filename: string;
  created_at: string;
  status: string;
}

interface PlagiarismResult {
  plagiarism_score: number;
  sources_found: Array<{
    url: string;
    title: string;
    similarity: number;
    excerpt: string;
  }>;
  details: {
    total_words: number;
    unique_content: number;
  };
}

interface DashboardProps {
  onNewAnalysis: () => void;
}

export default function Dashboard({ onNewAnalysis }: DashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
      if (data.length > 0) {
        setSelectedDoc(data[0].id);
        loadResult(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadResult = async (docId: string) => {
    const { data, error } = await supabase
      .from('plagiarism_results')
      .select('*')
      .eq('document_id', docId)
      .maybeSingle();

    if (!error && data) {
      setResult(data);
    }
  };

  const handleSelectDocument = (docId: string) => {
    setSelectedDoc(docId);
    loadResult(docId);
  };

  const getScoreColor = (score: number) => {
    if (score < 15) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score < 15) return 'Excellent';
    if (score < 30) return 'Acceptable';
    return 'Attention';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileCheck2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PlagDetect</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes analyses</h1>
            <p className="text-gray-600 mt-1">Consultez vos rapports de détection de plagiat</p>
          </div>
          <button
            onClick={onNewAnalysis}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
          >
            Nouvelle analyse
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents analysés</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun document analysé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedDoc === doc.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Résultats de l'analyse</h2>
                    <span className={`px-4 py-2 rounded-full font-medium border-2 ${getScoreColor(result.plagiarism_score)}`}>
                      {getScoreLabel(result.plagiarism_score)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingDown className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">Score de plagiat</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{result.plagiarism_score}%</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <FileCheck2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">Contenu unique</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{result.details.unique_content}%</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm text-gray-600">Sources trouvées</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{result.sources_found.length}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>Similarité détectée</span>
                      <span>{result.plagiarism_score}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          result.plagiarism_score < 15
                            ? 'bg-green-500'
                            : result.plagiarism_score < 30
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${result.plagiarism_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {result.sources_found.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Sources similaires détectées</h3>
                    <div className="space-y-4">
                      {result.sources_found.map((source, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 flex-1">{source.title}</h4>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium ml-4">
                              {source.similarity}% similaire
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{source.excerpt}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Voir la source
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sélectionnez un document</h3>
                <p className="text-gray-600">Choisissez un document dans la liste pour voir les résultats</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
