import request from 'request';
import { API_BASE_URL } from './common';
import { IUploadVideoRes } from './types';

export default {
  async upload(formData: FormData) {
    const item: IUploadVideoRes = await request(`${API_BASE_URL}/videos/upload`, {
      method: 'post',
      body: formData,
    });
    return item;
  },
}
