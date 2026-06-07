
import { toast } from 'react-toastify';

export const showSuccessToast = (message) => {
<<<<<<< HEAD
  toast.success(message || 'Gửi dữ liệu thành công', {
=======
  toast.success(message || 'Data Submitted Successfully', {
>>>>>>> hai
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
<<<<<<< HEAD
  toast.error(message || 'Đã xảy ra lỗi', {
=======
  toast.error(message || 'An error occurred', {
>>>>>>> hai
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
