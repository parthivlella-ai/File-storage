import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const FileContext = createContext(null);

export const FileProvider = ({ children }) => {
  const { isAuthenticated, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('securehub_view') || 'grid');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedFileIds, setSelectedFileIds] = useState([]);

  // Modals & Drawers state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [detailsFile, setDetailsFile] = useState(null);
  const [renameItem, setRenameItem] = useState(null); // { type: 'file'|'folder', item }
  const [moveItem, setMoveItem] = useState(null); // { type: 'file'|'folder', item }
  const [shareFile, setShareFile] = useState(null);

  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('securehub_view', mode);
  };

  // Load files and folders for current folder / filters
  const loadContent = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const folderParam = currentFolderId ? currentFolderId : 'root';
      const [filesRes, foldersRes] = await Promise.all([
        fileService.getFiles({
          folderId: folderParam,
          category: selectedCategory,
          search: searchQuery,
          sortBy,
          order: sortOrder,
        }),
        currentFolderId ? folderService.getFolders(currentFolderId) : folderService.getFolders(null),
      ]);

      setFiles(filesRes.files || []);
      setFolders(foldersRes.folders || []);

      if (currentFolderId) {
        const breadRes = await folderService.getBreadcrumbs(currentFolderId);
        setBreadcrumbs(breadRes.breadcrumbs || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      console.error('Failed to load files:', err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentFolderId, selectedCategory, searchQuery, sortBy, sortOrder, showError]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Upload files handler
  const uploadFiles = async (fileList, onProgress) => {
    try {
      const res = await fileService.uploadFiles(fileList, currentFolderId, onProgress);
      showSuccess(res.message || 'Files uploaded successfully');
      await loadContent();
      await refreshUser();
      return { success: true, files: res.files };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Create folder handler
  const createFolder = async (name, color) => {
    try {
      const res = await folderService.createFolder(name, currentFolderId, color);
      showSuccess(res.message || 'Folder created');
      await loadContent();
      return { success: true, folder: res.folder };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Rename item handler
  const renameCurrentItem = async (newName) => {
    if (!renameItem) return;
    try {
      if (renameItem.type === 'file') {
        await fileService.updateFile(renameItem.item._id, { name: newName });
        showSuccess(`Renamed to '${newName}'`);
      } else {
        await folderService.updateFolder(renameItem.item._id, { name: newName });
        showSuccess(`Folder renamed to '${newName}'`);
      }
      setRenameItem(null);
      await loadContent();
    } catch (err) {
      showError(err.message);
    }
  };

  // Move item handler
  const moveCurrentItem = async (destinationFolderId) => {
    if (!moveItem) return;
    try {
      if (moveItem.type === 'file') {
        await fileService.updateFile(moveItem.item._id, { folderId: destinationFolderId });
        showSuccess('File moved successfully');
      } else {
        await folderService.updateFolder(moveItem.item._id, { parentFolder: destinationFolderId });
        showSuccess('Folder moved successfully');
      }
      setMoveItem(null);
      await loadContent();
    } catch (err) {
      showError(err.message);
    }
  };

  // Toggle star
  const toggleStar = async (file) => {
    try {
      const newStatus = !file.isStarred;
      await fileService.updateFile(file._id, { isStarred: newStatus });
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? { ...f, isStarred: newStatus } : f))
      );
      showSuccess(newStatus ? 'Added to Starred' : 'Removed from Starred');
    } catch (err) {
      showError(err.message);
    }
  };

  // Move to trash
  const moveToTrash = async (type, id, name) => {
    try {
      if (type === 'file') {
        await fileService.moveToTrash(id);
        showSuccess(`'${name}' moved to Trash`);
      } else {
        await folderService.moveToTrash(id);
        showSuccess(`Folder '${name}' moved to Trash`);
      }
      await loadContent();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    }
  };

  // Batch actions
  const executeBatchAction = async (action, targetFolderId = null) => {
    if (selectedFileIds.length === 0) return;
    try {
      const res = await fileService.batchActions(action, selectedFileIds, targetFolderId);
      showSuccess(res.message);
      setSelectedFileIds([]);
      await loadContent();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    }
  };

  // Select/Deselect file
  const toggleSelectFile = (fileId) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f._id));
    }
  };

  // Navigate folder
  const navigateToFolder = (folderId, folderObj = null) => {
    setCurrentFolderId(folderId);
    setCurrentFolder(folderObj);
    setSelectedFileIds([]);
  };

  return (
    <FileContext.Provider
      value={{
        files,
        folders,
        breadcrumbs,
        currentFolderId,
        currentFolder,
        loading,
        viewMode,
        sortBy,
        sortOrder,
        selectedCategory,
        searchQuery,
        selectedFileIds,
        uploadModalOpen,
        createFolderModalOpen,
        previewFile,
        detailsFile,
        renameItem,
        moveItem,
        shareFile,
        setUploadModalOpen,
        setCreateFolderModalOpen,
        setPreviewFile,
        setDetailsFile,
        setRenameItem,
        setMoveItem,
        setShareFile,
        setViewMode: toggleViewMode,
        setSortBy,
        setSortOrder,
        setSelectedCategory,
        setSearchQuery,
        setSelectedFileIds,
        toggleSelectFile,
        selectAllFiles,
        navigateToFolder,
        loadContent,
        uploadFiles,
        createFolder,
        renameCurrentItem,
        moveCurrentItem,
        toggleStar,
        moveToTrash,
        executeBatchAction,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};
