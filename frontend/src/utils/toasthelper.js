
import { toast } from 'react-toastify';

export const showSuccessToast = (message) => {
  toast.success(message || 'Gửi dữ liệu thành công', {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const showErrorToast = (message) => {
  toast.error(message || 'Đã xảy ra lỗi', {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};
