import { GitHubNode } from '../types';

const BASE_URL = 'https://api.github.com';

interface RepoDetails {
  default_branch: string;
  full_name: string;
  description: string;
}

export const fetchRepoDetails = async (owner: string, repo: string, token?: string): Promise<RepoDetails> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch repo details: ${response.statusText}`);
  }
  return response.json();
};

export const fetchRepoTree = async (owner: string, repo: string, branch: string, token?: string): Promise<GitHubNode[]> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch file tree: ${response.statusText}`);
  }
  const data = await response.json();
  // Filter out truncated trees if the repo is massive, but for now just return the tree
  return data.tree;
};

export const fetchFileContent = async (url: string, token?: string): Promise<string> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }
  const data = await response.json();
  
  // Content is base64 encoded
  try {
    return atob(data.content.replace(/\n/g, ''));
  } catch (e) {
    return "Error: Could not decode file content (possibly binary or too large).";
  }
};
