export const setAuthToken = () => {};
  
  
  export const getAuthToken = () => {
    return localStorage.getItem("authUser") ? "__cookie__" : "";
  };
  
 
  export const removeAuthToken = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("authUser");
  };

export const setAuthUser = (user) => {
  if (!user) return;
  localStorage.setItem("authUser", JSON.stringify(user));
  localStorage.setItem("role", user.role || "");
};

export const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch {
    return null;
  }
};
