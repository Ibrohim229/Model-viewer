import path from "path";
import FileService from "../services/FileService.js";

export default class FileController {
  constructor() {
    this.convertModel = this.convertModel.bind(this);
    this.getFiles = this.getFiles.bind(this);
    this.fileService = new FileService();
  }

  async convertModel(req, res) {
    const stepFile = req.files?.stepFile;

    if (!stepFile) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const fileName = path.parse(stepFile.name).name;

    try {
      const savedStepFile = await this.fileService.saveStepFile(stepFile);
      const objPath = await this.fileService.convertStepToObj(
        savedStepFile,
        fileName
      );
      const gltfPath = await this.fileService.convertToGltf(objPath, fileName);

      return res.json({
        message: "Conversion complete.",
        paths: { gltfPath },
      });
    } catch (error) {
      console.error("Conversion error:", error);
      return res.status(500).json({
        error: `Conversion failed. Reason: ${error.message}`,
      });
    }
  }

  async getFiles(req, res) {
    const fileName = req.query?.fileName;

    try {
      if (fileName) {
        const filePath = await this.fileService.getFilePath(fileName);
        return res.status(200).sendFile(filePath);
      } else {
        const files = await this.fileService.getFiles();
        return res.status(200).json(files);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      return res.status(500).json({ error: "Failed to fetch files." });
    }
  }
}
