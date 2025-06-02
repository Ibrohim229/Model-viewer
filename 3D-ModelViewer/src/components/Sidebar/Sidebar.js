import React, { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { convertStepFile } from "../../services/ModelService";
import { useModelContext } from "../../context/ModelContext";

const Sidebar = ({ modelPath, onSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef();

  const { models, refreshModels } = useModelContext();

  const validateFile = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    return ext === "step" || ext === "stp";
  };

  const handleFile = (file) => {
    if (!validateFile(file)) {
      setError("Only .step or .stp files are allowed.");
      setSelectedFile(null);
    } else {
      setError("");
      setSelectedFile(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleChooseClick = () => {
    inputRef.current.click();
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await convertStepFile(selectedFile);
      setShowSuccess(true);
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      await refreshModels();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        px: 4,
        py: 2,
        boxShadow: 1,
        zIndex: 1,
        maxWidth: 300,
      }}
      alignItems={"center"}
    >
      <Box
        sx={{
          display: "flex",
          maxHeight: 500,
          overflowY: "auto",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3>Available Models</h3>
        <Grid container spacing={2} direction={"column"}>
          {models.map((model, index) => {
            const isActive = modelPath === model.url;
            return (
              <Button
                key={index}
                variant={isActive ? "contained" : "outlined"}
                onClick={() => onSelect(model.url)}
              >
                {model.name}
              </Button>
            );
          })}
        </Grid>
      </Box>

      <Box sx={{ width: "100%" }}>
        {loading && <LinearProgress sx={{ mt: 1, mb: 1 }} />}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!selectedFile || error || loading}
          onClick={handleConvert}
        >
          {loading ? "Converting..." : "Upload"}
        </Button>

        <Paper
          elevation={isDragging ? 6 : 2}
          sx={{
            padding: 2,
            marginTop: 1,
            border: isDragging ? "2px dashed #1976d2" : "2px dashed #ccc",
            background: isDragging ? "#e3f2fd" : "#fafafa",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleChooseClick}
        >
          <Typography
            variant="body1"
            color="textSecondary"
            noWrap
            sx={{
              maxWidth: "100%",
              display: "block",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {selectedFile ? selectedFile.name : "Drop or upload your file"}
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept=".step,.stp"
            style={{ display: "none" }}
            onChange={handleInputChange}
            aria-label="Drop or upload your file"
          />
        </Paper>
        {error && (
          <Typography
            color="error"
            variant="body1"
            sx={{ mb: 1, mt: 1, textAlign: "center" }}
          >
            {error}
          </Typography>
        )}
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{
            width: "100%",
          }}
        >
          File converted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sidebar;
