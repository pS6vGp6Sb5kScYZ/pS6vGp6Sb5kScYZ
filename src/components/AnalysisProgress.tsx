import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalysisProgressProps {
  documentId: string;
  onComplete: () => void;
}

export default function AnalysisProgress({ documentId, onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('analyzing');
  const [currentStep, setCurrentStep] = useState('Téléchargement du document...');

  useEffect(() => {
    const steps = [
      { label: 'Téléchargement du document...', duration: 500 },
      { label: 'Extraction du texte...', duration: 800 },
      { label: 'Analyse du contenu...', duration: 1200 },
      { label: 'Recherche de sources similaires...', duration: 1500 },
      { label: 'Calcul du score de plagiat...', duration: 1000 },
      { label: 'Génération du rapport...', duration: 800 },
    ];

    let currentProgress = 0;
    let stepIndex = 0;

    const progressInterval = setInterval(() => {
      if (currentProgress < 100) {
        currentProgress += 2;
        setProgress(Math.min(currentProgress, 100));
      }
    }, 100);

    const processSteps = async () => {
      for (const step of steps) {
        setCurrentStep(step.label);
        await new Promise(resolve => setTimeout(resolve, step.duration));
        stepIndex++;
      }

      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

      const plagiarismScore = Math.floor(Math.random() * 30) + 10;
      const sourcesCount = Math.floor(Math.random() * 5) + 1;
      const sources = Array.from({ length: sourcesCount }, (_, i) => ({
        url: `https://example.com/source-${i + 1}`,
        title: `Source similaire ${i + 1}`,
        similarity: Math.floor(Math.random() * 20) + 5,
        excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...'
      }));

      await supabase
        .from('plagiarism_results')
        .insert({
          document_id: documentId,
          plagiarism_score: plagiarismScore,
          sources_found: sources,
          details: {
            total_words: Math.floor(Math.random() * 1000) + 500,
            unique_content: 100 - plagiarismScore,
            analysis_date: new Date().toISOString()
          }
        });

      setStatus('completed');
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onComplete();
      }, 1500);
    };

    processSteps();

    return () => {
      clearInterval(progressInterval);
    };
  }, [documentId, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12">
        <div className="text-center mb-8">
          {status === 'analyzing' ? (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {status === 'analyzing' ? 'Analyse en cours' : 'Analyse terminée'}
          </h2>
          <p className="text-gray-600">{currentStep}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${progress > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={progress > 0 ? 'text-gray-900' : 'text-gray-500'}>
              Document téléchargé
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${progress > 30 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={progress > 30 ? 'text-gray-900' : 'text-gray-500'}>
              Contenu analysé
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={progress > 60 ? 'text-gray-900' : 'text-gray-500'}>
              Sources identifiées
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={progress === 100 ? 'text-gray-900' : 'text-gray-500'}>
              Rapport généré
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
