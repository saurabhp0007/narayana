import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { MediaUploadResponse } from '../types';

class MediaService {
  async uploadImage(file: File | Blob, fileName: string): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    return await api.upload<MediaUploadResponse>(
      API_ENDPOINTS.MEDIA.UPLOAD,
      formData
    );
  }

  async deleteImage(fileId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.MEDIA.DELETE(fileId));
  }
}

export default new MediaService();
