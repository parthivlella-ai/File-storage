import React from 'react';
import Modal from '../common/Modal';
import UploadDropzone from './UploadDropzone';
import { useFiles } from '../../context/FileContext';

const UploadProgressModal = () => {
  const { uploadModalOpen, setUploadModalOpen } = useFiles();

  if (!uploadModalOpen) return null;

  return (
    <Modal
      isOpen={uploadModalOpen}
      onClose={() => setUploadModalOpen(false)}
      title="Upload Files"
      maxWidth="max-w-xl"
    >
      <UploadDropzone onComplete={() => setUploadModalOpen(false)} />
    </Modal>
  );
};

export default UploadProgressModal;
