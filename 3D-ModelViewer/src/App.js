import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import ModelViewer from "./components/ModelViewer/ModelViewer";
import { Box } from "@mui/material";
import { ModelProvider } from "./context/ModelContext";

function App() {
  const [modelPath, setModelPath] = useState(null);

  return (
    <ModelProvider>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <Sidebar modelPath={modelPath} onSelect={setModelPath} />
        <ModelViewer modelPath={modelPath} />
      </Box>
    </ModelProvider>
  );
}

export default App;
