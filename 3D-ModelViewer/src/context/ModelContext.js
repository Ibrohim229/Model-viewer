import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getFiles } from "../services/ModelService";

const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
  const [models, setModels] = useState([]);

  const fetchModels = useCallback(async () => {
    try {
      const data = await getFiles();
      setModels(data);
    } catch (error) {
      console.error("Failed to fetch files: ", error.message);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <ModelContext.Provider value={{ models, refreshModels: fetchModels }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModelContext = () => useContext(ModelContext);
