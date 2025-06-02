/* eslint-disable no-undef */
import fs from "fs";
import FileService from "../FileService.js";
import obj2gltf from "obj2gltf";
import occtimportjs from "occt-import-js";
import path from "path";
import { FileExtensions, API_URL } from "../../constants.js";

jest.mock("fs");
jest.mock("obj2gltf");
jest.mock("occt-import-js");

describe("FileService", () => {
  let service;

  const mockStepFile = {
    name: "testfile.step",
    data: Buffer.from("step data"),
    meshes: [
      {
        attributes: { position: { array: [1, 2, 3, 4, 5, 6] } },
        index: { array: [0, 1, 2] },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue(Buffer.from("step data"));
    occtimportjs.mockResolvedValue({
      ReadStepFile: () => ({
        success: true,
        meshes: mockStepFile.meshes,
      }),
    });
    service = new FileService();
  });

  it("should write STEP file and return meshes", async () => {
    const result = await service.saveStepFile(mockStepFile);
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      meshes: mockStepFile.meshes,
    });
  });

  it("should generate and write .obj file", async () => {
    const result = await service.convertStepToObj(mockStepFile, "testfile");
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(result).toContain("testfile.obj");
  });

  it("should convert OBJ to GLTF and write it", async () => {
    obj2gltf.mockResolvedValue({ some: "gltf" });
    const result = await service.convertToGltf("path/to.obj", "testfile");
    expect(obj2gltf).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("testfile.gltf"),
      expect.stringContaining('"some": "gltf"')
    );
    expect(result).toContain("testfile.gltf");
  });

  it("should return list of gltf files", async () => {
    const date = new Date("2025-04-24T12:00:00Z");
    const modelA = "ModelA";
    const modelB = "ModelB";

    fs.readdirSync.mockImplementation((dir) => {
      if (dir.endsWith("uploads")) {
        return [modelA, modelB];
      } else if (dir.endsWith(modelA)) {
        return [`${modelA}${FileExtensions.GLTF}`];
      } else if (dir.endsWith(modelB)) {
        return [`${modelB}${FileExtensions.GLTF}`];
      }
      return [];
    });

    fs.statSync.mockImplementation((fullPath) => ({
      isDirectory: () => !fullPath.endsWith(".gltf"),
      size: 1234,
      mtime: date,
    }));

    const result = await service.getFiles();

    expect(result).toEqual([
      {
        name: "ModelA.gltf",
        size: 1234,
        date: date,
        url: `${API_URL}/files?fileName=${modelA}`,
      },
      {
        name: "ModelB.gltf",
        size: 1234,
        date: date,
        url: `${API_URL}/files?fileName=${modelB}`,
      },
    ]);
  });

  it("should return the path of a specific GLTF file", async () => {
    const mockUploadsDir = "uploads";
    const mockFolderName = "ModelA";
    const mockFileName = `ModelA${FileExtensions.GLTF}`;
    const mockFilePath = path.join(
      mockUploadsDir,
      mockFolderName,
      mockFileName
    );

    service.uploadsDir = mockUploadsDir;
    fs.existsSync.mockImplementation((filePath) => {
      return (
        filePath === path.join(mockUploadsDir, mockFolderName) ||
        filePath === mockFilePath
      );
    });

    const result = await service.getFilePath("ModelA");

    expect(result).toBe(mockFilePath);
  });
});
