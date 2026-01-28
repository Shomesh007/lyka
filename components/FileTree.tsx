import React, { useMemo } from 'react';
import { File, Folder, FolderOpen } from 'lucide-react';
import { GitHubNode } from '../types';

interface FileTreeProps {
  files: GitHubNode[];
  onSelect: (file: GitHubNode) => void;
  selectedPath: string | null;
}

// Helper to build a nested directory structure from flat paths
interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  children: Record<string, TreeNode>;
  originalNode?: GitHubNode;
}

const buildTree = (nodes: GitHubNode[]) => {
  const root: TreeNode = { name: '', path: '', type: 'tree', children: {} };

  nodes.forEach(node => {
    const parts = node.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: index === parts.length - 1 ? node.type : 'tree',
          children: {},
          originalNode: index === parts.length - 1 ? node : undefined
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

const TreeNodeItem: React.FC<{ 
  node: TreeNode; 
  depth: number; 
  onSelect: (n: GitHubNode) => void;
  selectedPath: string | null;
}> = ({ node, depth, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const isSelected = node.path === selectedPath;
  const hasChildren = Object.keys(node.children).length > 0;
  
  const handleClick = () => {
    if (node.type === 'tree') {
      setIsOpen(!isOpen);
    } else if (node.originalNode) {
      onSelect(node.originalNode);
    }
  };

  return (
    <div>
      <div 
        className={`
          flex items-center py-1 px-2 cursor-pointer text-sm select-none whitespace-nowrap overflow-hidden text-ellipsis
          hover:bg-slate-800 transition-colors
          ${isSelected ? 'bg-indigo-900/50 text-indigo-200' : 'text-slate-400'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="mr-2 opacity-70">
          {node.type === 'tree' ? (
            isOpen ? <FolderOpen size={14} className="text-yellow-500" /> : <Folder size={14} className="text-yellow-500" />
          ) : (
            <File size={14} className="text-blue-400" />
          )}
        </span>
        {node.name}
      </div>
      {isOpen && hasChildren && (
        <div>
          {(Object.values(node.children) as TreeNode[])
            .sort((a, b) => {
               // Folders first, then files
               if (a.type === 'tree' && b.type !== 'tree') return -1;
               if (a.type !== 'tree' && b.type === 'tree') return 1;
               return a.name.localeCompare(b.name);
            })
            .map(child => (
            <TreeNodeItem 
              key={child.path} 
              node={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelect, selectedPath }) => {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-4">
      {(Object.values(tree.children) as TreeNode[]).map(child => (
        <TreeNodeItem 
          key={child.path} 
          node={child} 
          depth={0} 
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
};