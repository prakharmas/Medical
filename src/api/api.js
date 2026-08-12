import axios from "axios";
import getApiUrl from "../utils/getApiUrl";

const baseURL = getApiUrl();

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

function clearAuthAndRedirect() {
  localStorage.removeItem("access_token");
  if (!window.location.pathname.startsWith("/")) {
    window.location.href = "/";
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;
    if (status === 401 || status === 403 || detail === "Not authenticated") {
      clearAuthAndRedirect();
    }
    return Promise.reject(err);
  }
);

export default api;

export const login = (username, password, role) =>
  api.post("/login", { username, password, role });

export const getMe = () => api.get("/auth/me");

export const getPatients = () => api.get("/patients");
export const createPatient = (data) => api.post("/create-patient", data);
export const listPatientsDetailed = () => api.post("/list-patients-detailed");

export const getSummaries = () => api.get("/summaries");
export const generateSummary = (data) => api.post("/summaries/generate", data);

export const transcribeAudio = (formData) =>
  api.post("/voice/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createAudioSession = (data) =>
  api.post("/create-audio-session", data);

export const uploadAudioSession = (formData) =>
  api.post("/upload-audio-session", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const listAudioSessionsDetailed = (patientUid) =>
  api.post("/list-audio-sessions-detailed", { patient_uid: patientUid });

export const getAudioSessionTranscription = (uid) =>
  api.post("/get-audio-session-transcription", { uid });

export const submitTranscriptionForSummary = (uid) =>
  api.post("/submit-transcription-for-summary", { uid });

export const uploadRecords = (formData) =>
  api.post("/uploads/records", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createMedicalDocument = (data) =>
  api.post("/create-medical-document", data);

export const uploadMedicalDocument = (formData) =>
  api.post("/upload-medical-document", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const listMedicalDocuments = (patientUid) =>
  api.post("/list-medical-documents", { patient_uid: patientUid });

export const generateMedicalSummary = (data) =>
  api.post("/generate-medical-summary", data);

export const stopMedicalSummaryGeneration = (patientUid) =>
  api.post("/stop-medical-summary-generation", { patient_uid: patientUid });

export const getReports = () => api.get("/reports");

export const generateSummaryReport = (data) =>
  api.post("/generate-summary-report", data);

export const getSummaryReportArtifact = (data) =>
  api.post("/get-summary-report-artifact", data, { responseType: "blob" });

export const getAnalytics = () => api.get("/analytics/dashboard");

export const getDashboard = () => api.post("/dashboard");

export const getUserInfo = () => api.post("/get-user-info");

export const createPadTemplate = (data) =>
  api.post("/create-pad-template", data);

export const uploadPadTemplate = (formData) =>
  api.post("/upload-pad-template", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const listPadTemplatesDetailed = () =>
  api.post("/list-pad-templates-detailed");

export const getPadTemplateDetails = (uid) =>
  api.post("/get-pad-template-details", { uid });

export const getPadTemplateImage = (uid) =>
  api.post("/get-pad-template-image", { uid }, { responseType: "blob" });

export const editPadTemplate = (data) => api.post("/edit-pad-template", data);

export const renderTranscriptionOnPad = (data) =>
  api.post("/render-transcription-on-pad", data, { responseType: "blob" });

export const createUser = (data) => api.post("/create-user", data);
export const listUsersDetailed = () => api.post("/list-users-detailed");
export const editUser = (data) => api.post("/edit-user-route", data);
export const listEventsDetailed = (data) => api.post("/list-events-detailed", data);
export const editEvent = (data) => api.post("/edit-event", data);
export const checkUnreadEvents = () => api.post("/check-unread-events");
export const listChatsDetailed = () => api.post("/list-chats-detailed");
export const sendChatMessage = (data) => api.post("/send-chat-message", data);
export const getChatMessages = (data) => api.post("/get-chat-messages", data);
export const deleteChats = (data) => api.post("/delete-chats", data);
export const getStreamingChatMessage = (data) => api.post("/get-streaming-chat-message", data);
export const cancelChatMessageStream = (data) => api.post("/cancel-chat-message-stream", data);
