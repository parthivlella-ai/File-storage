import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import UploadProgressModal from '../upload/UploadProgressModal';
import CreateFolderModal from '../folders/CreateFolderModal';
import FilePreviewModal from '../files/FilePreviewModal';
import FileDetailsDrawer from '../files/FileDetailsDrawer';
import RenameModal from '../files/RenameModal';
import MoveModal from '../files/MoveModal';
import ShareModal from '../files/ShareModal';
import { useFiles } from '../../context/FileContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { previewFile, setPreviewFile, detailsFile, setDetailsFile } = useFiles();

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <UploadProgressModal />
      <CreateFolderModal />
      <RenameModal />
      <MoveModal />
      <ShareModal />
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {detailsFile && <FileDetailsDrawer file={detailsFile} onClose={() => setDetailsFile(null)} />}
    </div>
  );
};

export default MainLayout;
