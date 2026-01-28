import React, { useState, useEffect, useCallback } from 'react';
import { 
  Github, 
  Search, 
  Code2, 
  Bot, 
  Play, 
  Download, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  Settings,
  X
} from 'lucide-react';
import { GitHubNode, FileContent } from './types';
import { fetchRepoDetails, fetchRepoTree, fetchFileContent } from './services/githubService';
import { analyzeCode, explainCode } from './services/geminiService';
import { FileTree } from './components/FileTree';
import { Editor } from './components/Editor';

const DEMO_REPO = 'facebook/react';

export default function App() {
  // State
  const [repoInput, setRepoInput] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);
  const [files, setFiles] = useState<GitHubNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Load Repo
  const loadRepo = useCallback(async (repoFullName: string) => {
    setLoading(true);
    setError(null);
    setFiles([]);
    setActiveFile(null);
    
    try {
      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) throw new Error("Invalid repository format. Use owner/repo");

      const details = await fetchRepoDetails(owner, repo, githubToken || undefined);
      const tree = await fetchRepoTree(owner, repo, details.default_branch, githubToken || undefined);
      
      setCurrentRepo(repoFullName);
      setFiles(tree);
    } catch (err: any) {
      setError(err.message || "Failed to load repository");
    } finally {
      setLoading(false);
    }
  }, [githubToken]);

  // Handle File Select
  const handleFileSelect = async (node: GitHubNode) => {
    if (node.type !== 'blob') return;
    
    setLoadingFile(true);
    setError(null);
    try {
      const content = await fetchFileContent(node.url, githubToken || undefined);
      setActiveFile({
        path: node.path,
        content: content,
        sha: node.sha,
        isDirty: false
      });
      // Close AI panel when switching files to reset context
      setAiResponse(null); 
    } catch (err: any) {
      setError(err.message || "Failed to open file");
    } finally {
      setLoadingFile(false);
    }
  };

  // Handle Code Change
  const handleCodeChange = (newContent: string) => {
    if (activeFile) {
      setActiveFile({
        ...activeFile,
        content: newContent,
        isDirty: true
      });
    }
  };

  // Handle AI Action
  const handleAiAction = async () => {
    if (!activeFile || !aiPrompt.trim()) return;
    
    setIsProcessingAI(true);
    try {
      const result = await analyzeCode(activeFile.content, aiPrompt);
      
      // Update the code directly
      setActiveFile(prev => prev ? ({ ...prev, content: result, isDirty: true }) : null);
      setAiResponse("Code updated based on your instructions. Review the changes in the editor.");
    } catch (err) {
      setAiResponse("Error processing AI request. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAiExplain = async () => {
    if (!activeFile) return;
    setIsProcessingAI(true);
    setAiPanelOpen(true);
    try {
      const explanation = await explainCode(activeFile.content);
      setAiResponse(explanation);
    } catch (err) {
      setAiResponse("Could not generate explanation.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Key press for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadRepo(repoInput);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-700 bg-[#111827]">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-4">
            <Github size={24} />
            <span>GitGemini</span>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="owner/repo (e.g. facebook/react)"
              className="w-full bg-slate-800 text-sm rounded border border-slate-600 px-3 py-2 pr-8 focus:outline-none focus:border-indigo-500 transition-colors"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={() => loadRepo(repoInput)}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              <Search size={16} />
            </button>
          </div>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-slate-500 mt-2 flex items-center hover:text-slate-300"
          >
            <Settings size={12} className="mr-1" /> Configure Token
          </button>
          
          {showSettings && (
             <div className="mt-2 animate-fadeIn">
               <input 
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  className="w-full bg-slate-800 text-xs rounded border border-slate-600 px-2 py-1 mb-1"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
               />
               <p className="text-[10px] text-slate-500">Optional. Use to avoid API rate limits.</p>
             </div>
          )}
        </div>

        {/* Repo Title */}
        {currentRepo && (
           <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
             <span className="text-sm font-medium truncate" title={currentRepo}>{currentRepo}</span>
             {loading && <Loader2 size={14} className="animate-spin text-indigo-400" />}
           </div>
        )}

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 text-red-400 text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          
          {!currentRepo && !loading && (
            <div className="p-6 text-center text-slate-500 text-sm">
              <div className="mb-2">Enter a GitHub repository to browse code.</div>
              <div className="text-xs">Try: <button className="text-indigo-400 hover:underline" onClick={() => { setRepoInput(DEMO_REPO); loadRepo(DEMO_REPO); }}>{DEMO_REPO}</button></div>
            </div>
          )}

          {files.length > 0 && (
            <FileTree 
              files={files} 
              onSelect={handleFileSelect} 
              selectedPath={activeFile?.path || null} 
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-700 bg-[#111827] flex items-center justify-between px-4">
          <div className="flex items-center space-x-2 overflow-hidden">
             {activeFile ? (
               <>
                 <Code2 size={18} className="text-blue-400 flex-shrink-0" />
                 <span className="text-sm text-slate-200 font-mono truncate">{activeFile.path}</span>
                 {activeFile.isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" title="Unsaved changes"></span>}
               </>
             ) : (
               <span className="text-slate-500 text-sm">Select a file to view or edit</span>
             )}
          </div>

          {activeFile && (
            <div className="flex items-center space-x-3">
               <button 
                onClick={handleAiExplain}
                className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-300 transition-colors border border-slate-600"
                disabled={isProcessingAI}
              >
                <Bot size={14} className="mr-2" />
                Explain
              </button>
              
              <button 
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={`flex items-center px-3 py-1.5 rounded text-xs font-medium transition-colors border ${aiPanelOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}`}
              >
                <Bot size={14} className="mr-2" />
                AI Assistant
              </button>
              
              <button 
                onClick={downloadFile}
                className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium text-white transition-colors"
              >
                <Download size={14} className="mr-2" />
                Download
              </button>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex relative overflow-hidden">
          {loadingFile ? (
             <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-10">
                <div className="flex flex-col items-center">
                   <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
                   <span className="text-slate-400 text-sm">Fetching content...</span>
                </div>
             </div>
          ) : activeFile ? (
             <Editor 
                value={activeFile.content} 
                onChange={handleCodeChange} 
             />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 flex-col">
               <Github size={64} className="mb-4 opacity-20" />
               <p>Select a file to start editing</p>
               <p className="text-sm mt-4 max-w-md text-center px-4 opacity-70">
                 Note: This is a browser-based editor. Changes are local. Use the Download button to save your work or manually copy changes back to GitHub.
               </p>
            </div>
          )}

          {/* AI Panel - Floating Overlay or Split */}
          {aiPanelOpen && activeFile && (
            <div className="w-80 md:w-96 border-l border-slate-700 bg-[#1e293b] flex flex-col shadow-xl z-20 absolute right-0 top-0 bottom-0">
               <div className="p-3 border-b border-slate-600 flex justify-between items-center bg-[#111827]">
                  <span className="font-semibold text-sm flex items-center text-indigo-400">
                    <Bot size={16} className="mr-2" /> Gemini Assistant
                  </span>
                  <button onClick={() => setAiPanelOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={16} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-xs text-slate-400 mb-2">
                    Modify this file using natural language instructions.
                  </div>
                  
                  <textarea
                    className="w-full bg-[#0f172a] border border-slate-600 rounded p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-32"
                    placeholder="E.g., 'Add error handling to the fetch function' or 'Refactor this to use async/await'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  
                  <button
                    onClick={handleAiAction}
                    disabled={isProcessingAI || !aiPrompt.trim()}
                    className={`w-full py-2 rounded text-sm font-medium flex items-center justify-center transition-colors
                      ${isProcessingAI || !aiPrompt.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                    `}
                  >
                    {isProcessingAI ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
                    Generate Changes
                  </button>

                  {aiResponse && (
                    <div className="mt-6 border-t border-slate-600 pt-4">
                       <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Result</h4>
                       <div className="text-sm text-slate-300 whitespace-pre-wrap bg-[#0f172a] p-3 rounded border border-slate-700 max-h-60 overflow-y-auto font-mono text-xs">
                         {aiResponse}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
