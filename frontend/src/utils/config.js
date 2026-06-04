const rawServerUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/';

export const Server_URL = rawServerUrl.endsWith('/') ? rawServerUrl : `${rawServerUrl}/`;
