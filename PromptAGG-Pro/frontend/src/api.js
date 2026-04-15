import axios from "axios";

// Оставили только визуальную часть: Электрон может передать IP, чтобы показать его в кнопке "Скопировать IP"
const urlParams = new URLSearchParams(window.location.search);
const localIpFromElectron = urlParams.get('localIp');

if (localIpFromElectron) {
    localStorage.setItem('MANAGER_DISPLAY_IP', localIpFromElectron);
}

// Тупо берем IP из памяти. Нет IP = будет окно ввода. Есть IP = работаем.
let hubIp = localStorage.getItem('HUB_IP');

// Заглушка для первичной инициализации Axios (чтобы не падал до ввода IP)
const API_URL = `http://${hubIp || '127.0.0.1'}:8000`;

const api = axios.create({ 
    baseURL: API_URL,
    timeout: 5000 
});

export const HUB_IP = hubIp;
export const shutdownServer = () => api.post('/shutdown');

// --- ПРОЕКТЫ ---
export const getProjects = () => api.get('/content-plan/projects/');
export const createProject = (projectData) => api.post('/content-plan/projects/', projectData);
export const deleteProject = (projectId) => api.delete(`/content-plan/projects/${projectId}`);

// --- ПОСТЫ ---
export const getPosts = (projectId = 'mns') => api.get('/content-plan/', { params: { project_id: projectId } });
export const createPost = (postData) => api.post('/content-plan/', postData);
export const updatePost = (postId, postData) => api.put(`/content-plan/${postId}`, postData);
export const deletePost = (postId) => api.delete(`/content-plan/${postId}`);

// --- ИДЕИ ---
export const getIdeas = (projectId = 'mns') => api.get('/content-plan/ideas/', { params: { project_id: projectId } });
export const createIdea = (ideaData) => api.post('/content-plan/ideas/', ideaData);
export const updateIdea = (ideaId, ideaData) => api.put(`/content-plan/ideas/${ideaId}`, ideaData);
export const deleteIdea = (ideaId) => api.delete(`/content-plan/ideas/${ideaId}`);

// --- БИБЛИОТЕКА ---
export const getLibrary = () => api.get('/content-plan/library/');
export const createLibraryPrompt = (promptData) => api.post('/content-plan/library/', promptData);
export const updateLibraryPrompt = (promptId, promptData) => api.put(`/content-plan/library/${promptId}`, promptData);
export const deleteLibraryPrompt = (promptId) => api.delete(`/content-plan/library/${promptId}`);

// --- ГЕНЕРАЦИЯ ---
export const generateContent = (data) => api.post('/content-plan/generate', data);
export const generateViaXR2 = (slug, variables) => api.post('/content-plan/xr2-generate', { slug, variables });

export default {
    shutdownServer, 
    getProjects, createProject, deleteProject,
    getPosts, createPost, updatePost, deletePost,
    getIdeas, createIdea, updateIdea, deleteIdea, 
    getLibrary, createLibraryPrompt, updateLibraryPrompt, deleteLibraryPrompt,
    generateContent, generateViaXR2
};