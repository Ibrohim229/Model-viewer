import fs from "fs";
import path from "path";
import occtimportjs from "occt-import-js";
import obj2gltf from "obj2gltf";
import { FileExtensions, UPLOAD_FOLDER_ROOT, API_URL } from "../constants.js";

export default class FileService {
  constructor() {
    this.initFileStructure();
  }

  initFileStructure() {
    this.uploadsDir = path.join(process.cwd(), UPLOAD_FOLDER_ROOT);
    !fs.existsSync(this.uploadsDir) &&
      fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  getOutputFolder(fileName) {
    const outputDir = path.join(process.cwd(), UPLOAD_FOLDER_ROOT, fileName);
    !fs.existsSync(outputDir) && fs.mkdirSync(outputDir, { recursive: true });
    return outputDir;
  }

  async saveStepFile(stepFile) {
    const stepFileName = stepFile.name;
    const stepPath = path.join(
      this.getOutputFolder(path.parse(stepFileName).name),
      stepFileName
    );

    try {
      fs.writeFileSync(stepPath, stepFile.data);
    } catch (error) {
      console.error("Error while writing STEP file:", error);
      throw new Error("Failed to write STEP file.");
    }

    const occt = await occtimportjs();
    let result;
    try {
      const fileBuffer = fs.readFileSync(stepPath);
      result = occt.ReadStepFile(fileBuffer, null);
    } catch (error) {
      console.error("Error while reading STEP file:", error);
      throw new Error("Failed to read STEP file.");
    }

    if (!result.success || !result.meshes?.length) {
      throw new Error("Failed to convert STEP to mesh.");
    }

    return result;
  }

  async convertStepToObj(stepFile, fileName) {
    const objPath = path.join(
      this.getOutputFolder(fileName),
      `${fileName}${FileExtensions.OBJ}`
    );

    const objLines = [];
    let vertexOffset = 1;

    for (const mesh of stepFile.meshes) {
      const positions = mesh.attributes.position.array;
      const indices = mesh.index.array;

      for (let i = 0; i < positions.length; i += 3) {
        objLines.push(
          `v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}`
        );
      }

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] + vertexOffset;
        const b = indices[i + 1] + vertexOffset;
        const c = indices[i + 2] + vertexOffset;
        objLines.push(`f ${a} ${b} ${c}`);
      }

      vertexOffset += positions.length / 3;
    }

    try {
      fs.writeFileSync(objPath, objLines.join("\n"));
    } catch (error) {
      console.error("Error while writing OBJ file:", error);
      throw new Error("Failed to write OBJ file.");
    }

    return objPath;
  }

  async convertToGltf(objPath, fileName) {
    const outputFolder = this.getOutputFolder(fileName);
    const gltfPath = path.join(
      this.getOutputFolder(fileName),
      `${fileName}${FileExtensions.GLTF}`
    );
    const gltfOptions = {
      binary: false,
      separate: false,
      outputDirectory: outputFolder,
    };

    const gltfData = await obj2gltf(objPath, gltfOptions);
    try {
      fs.writeFileSync(gltfPath, JSON.stringify(gltfData, null, 2));
    } catch (error) {
      console.error("Error while converting OBJ to GLTF:", error);
      throw new Error("Failed to convert OBJ to GLTF.");
    }

    return gltfPath;
  }

  async getFiles() {
    const modelFolders = fs.readdirSync(this.uploadsDir).filter((folder) => {
      const fullPath = path.join(this.uploadsDir, folder);
      return fs.statSync(fullPath).isDirectory();
    });

    const gltfFiles = [];

    for (const folder of modelFolders) {
      const folderPath = path.join(this.uploadsDir, folder);
      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        if (path.extname(file).toLowerCase() === FileExtensions.GLTF) {
          const filePath = path.join(folderPath, file);
          const stats = fs.statSync(filePath);

          gltfFiles.push({
            name: file,
            size: stats.size,
            date: stats.mtime,
            url: `${API_URL}/files?fileName=${folder}`,
          });
        }
      }
    }

    return gltfFiles;
  }

  async getFilePath(fileName) {
    const filePath = path.join(
      this.uploadsDir,
      fileName,
      `${fileName}${FileExtensions.GLTF}`
    );

    if (!fs.existsSync(filePath)) {
      throw new Error("GLTF file not found.");
    }

    return filePath;
  }
}
