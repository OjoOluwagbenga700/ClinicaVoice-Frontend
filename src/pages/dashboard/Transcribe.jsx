import React, { useState, useRef, useEffect} from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  TextField,
  Stack,
  Alert,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import { useTranslation } from "react-i18next";
import { uploadFile, checkTranscriptionStatus } from "../../services/uploadService";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useUserRole } from "../../hooks/useUserRole";

export default function Transcribe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isClinician, isPatient, loading: roleLoading } = useUserRole();
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { id } = useParams();
  
  // File validation constants
  const VALID_AUDIO_FORMATS = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4'];
  const VALID_EXTENSIONS = ['.webm', '.mp3', '.wav', '.m4a'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
  
  // Determine if this is read-only mode (for patients viewing their reports)
  const isReadOnly = isPatient();

  // 🎤 Start Recording
  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioFile(new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" }));
      };

      mediaRecorder.start();
      setRecording(true);
      setStatusMessage(t("recording_started"));
    } catch (error) {
      console.error("Microphone access error:", error);
      // Improved microphone access error handling (Requirement 3.4)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
      } else if (error.name === 'NotFoundError') {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (error.name === 'NotReadableError') {
        setError("Microphone is already in use by another application. Please close other applications and try again.");
      } else {
        setError("Unable to access microphone. Please check your device settings and try again.");
      }
      setStatusMessage("");
    }
  };

  // 🛑 Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatusMessage(t("recording_stopped"));
    }
  };

  // 📋 Validate File Upload
  const validateAudioFile = (file) => {
    if (!file) {
      return { valid: false, error: "No file selected" };
    }

    // Check file format by MIME type
    const isValidMimeType = VALID_AUDIO_FORMATS.includes(file.type);
    
    // Check file format by extension (fallback for cases where MIME type is not set correctly)
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = VALID_EXTENSIONS.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return { 
        valid: false, 
        error: `Invalid file format. Please upload an audio file in one of these formats: ${VALID_EXTENSIONS.join(', ')}` 
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `File size (${fileSizeMB}MB) exceeds the maximum limit of 100MB` 
      };
    }

    return { valid: true, error: null };
  };

  // 📁 Handle File Selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const validation = validateAudioFile(file);
    
    // Enhanced file upload error handling (Requirements 4.3, 4.4)
    if (!validation.valid) {
      setError(validation.error);
      setAudioFile(null);
      setStatusMessage("");
      // Clear the file input
      event.target.value = null;
    } else {
      setError("");
      setAudioFile(file);
      setStatusMessage(`File selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    }
  };

  // 📤 Upload & Transcribe
  const handleTranscription = async () => {
    if (!audioFile) {
      setError("Please record or upload an audio file first");
      return;
    }

    // Validate file before transcription
    const validation = validateAudioFile(audioFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("Uploading file...");

    try {
      // Step 1️⃣ Upload file using presigned URL
      const uploadResult = await uploadFile(audioFile, (progress) => {
        setStatusMessage(`Uploading... ${Math.round(progress)}%`);
      });

      setStatusMessage("File uploaded successfully. Transcription starting...");
      
      // Step 2️⃣ Poll for transcription completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      let transcriptionData = null;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
        
        try {
          transcriptionData = await checkTranscriptionStatus(uploadResult.fileId);
          
          if (transcriptionData.status === 'completed') {
            setTranscript(transcriptionData.transcript || "Transcription completed successfully.");
            setStatusMessage("Transcription completed!");
            setError("");
            break;
          } else if (transcriptionData.status === 'failed') {
            throw new Error('Transcription job failed');
          } else {
            setStatusMessage(`Transcribing... (${attempts * 5}s)`);
          }
        } catch (statusError) {
          if (attempts >= maxAttempts) {
            throw statusError;
          }
          // Continue polling if it's just a temporary error
        }
      }
      
      if (attempts >= maxAttempts && (!transcriptionData || transcriptionData.status !== 'completed')) {
        throw new Error('Transcription timeout - please check back later');
      }
      
    } catch (error) {
      console.error("Transcription failed:", error);
      // Enhanced transcription error handling with retry option (Requirement 5.5)
      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        setError("Network error occurred. Please check your connection and try again.");
      } else if (error.message?.includes('File too large')) {
        setError("File is too large to process. Please use a smaller audio file.");
      } else if (error.message?.includes('Invalid file type')) {
        setError("Audio format not supported. Please use a different file format.");
      } else if (error.message?.includes('timeout')) {
        setError("Transcription is taking longer than expected. Please check back later or try a shorter recording.");
      } else {
        setError(error.message || "Transcription failed. Please try again or contact support if the problem persists.");
      }
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // 💾 Save transcript to cloud (optional extension)
  const saveTranscript = async () => {
    if (!transcript || transcript.trim() === "") {
      setError("Cannot save empty transcript. Please add content first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await post({
        apiName: "ClinicaVoiceAPI",
        path: "/save-transcript",
        options: { body: { transcript } },
      }).response;
      const data = await response.body.json();
      setStatusMessage(data.message || t("transcript_saved"));
    } catch (error) {
      console.error("Save failed:", error);
      // Enhanced save error handling (Requirement 6.5)
      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        setError("Network error. Your changes are preserved locally. Please try saving again when connected.");
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Session expired. Please log in again to save your changes.");
      } else {
        setError("Failed to save transcript. Your changes are preserved locally. Please try again.");
      }
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log("Load transcription for report:", id);
      // Fetch or highlight the transcription here
      // Mock loading transcript for demonstration
      setTranscript("This is a sample transcript for report " + id);
    }
  }, [id]);

  // Handle file passed from upload modal (Requirement 14.2, 14.5)
  useEffect(() => {
    if (location.state?.audioFile) {
      const file = location.state.audioFile;
      setAudioFile(file);
      setStatusMessage(`File ready: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      
      // Clear the navigation state to prevent re-setting on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t("loading")}...</Typography>
      </Box>
    );
  }

  // For patients: show read-only view if viewing a report
  if (isReadOnly && id) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" mb={3}>
          Medical Report (View Only)
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This report is managed by your clinician. You have view-only access.
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" mb={2}>
              Report Details
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={transcript}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiInputBase-input': {
                  cursor: 'default',
                },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard/reports")}
              sx={{ mt: 2 }}
            >
              Back to My Reports
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Prevent patients from accessing transcription creation
  if (isReadOnly && !id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Transcription creation is only available to clinicians.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  // Verify clinician access for creation (additional check beyond routing)
  if (!isClinician()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This feature is only available to clinicians.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={3}>
        {t("dashboard_transcribe")}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("transcribe_description")}
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            {/* Status and Error Messages */}
            {statusMessage && (
              <Typography variant="body2" color="text.secondary">
                🎙️ {statusMessage}
              </Typography>
            )}
            
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}

            {/* Recording Buttons */}
            <Stack direction="row" spacing={2}>
              {!recording ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                >
                  {t("start_recording")}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<StopIcon />}
                  onClick={stopRecording}
                >
                  {t("stop_recording")}
                </Button>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
              >
                {t("upload_audio")}
                <input
                  hidden
                  type="file"
                  accept=".webm,.mp3,.wav,.m4a,audio/webm,audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/mp4"
                  onChange={handleFileSelect}
                />
              </Button>
            </Stack>

            {/* Upload & Transcribe */}
            <Button
              variant="contained"
              color="primary"
              disabled={!audioFile || loading}
              onClick={handleTranscription}
            >
              {loading ? t("transcribing") : t("upload_and_transcribe")}
            </Button>

            {loading && <LinearProgress sx={{ width: "100%" }} />}
          </Stack>
        </CardContent>
      </Card>

      {/* Transcript Section */}
      {transcript && (
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" mb={2}>
              {t("transcript")}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              variant="outlined"
            />
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={saveTranscript}
              sx={{ mt: 2 }}
            >
              {t("save_transcript")}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
