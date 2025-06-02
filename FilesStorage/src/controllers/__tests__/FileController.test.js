/* eslint-disable no-undef */
import FileController from "../FileController.js";
import FileService from "../../services/FileService.js";
import { API_URL } from "../../constants.js";

jest.mock("../../services/FileService.js");

describe("FileController", () => {
  let controller;
  let mockRes;
  let saveStepFile;
  let convertStepToObj;
  let convertToGltf;
  let getFiles;
  let getFilePath;

  const mockStepFile = {
    name: "example.step",
    data: Buffer.from("some data"),
  };

  const mockMeshes = [{ mock: "mesh" }];
  const mockObjPath = "uploads/example_output/example.obj";
  const mockGltfPath = "uploads/example_output/example.gltf";

  beforeEach(() => {
    saveStepFile = jest.fn().mockResolvedValue(mockMeshes);
    convertStepToObj = jest.fn().mockResolvedValue(mockObjPath);
    convertToGltf = jest.fn().mockResolvedValue(mockGltfPath);
    getFiles = jest.fn();
    getFilePath = jest.fn();

    FileService.mockClear();
    FileService.mockImplementation(() => ({
      saveStepFile,
      convertStepToObj,
      convertToGltf,
      getFiles,
      getFilePath,
    }));

    controller = new FileController();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      sendFile: jest.fn(),
      json: jest.fn(),
    };
  });

  it.each([
    { description: "files is null", files: null },
    { description: "files is empty", files: {} },
  ])("should return 400 if $description", async ({ files }) => {
    const mockReq = { files };

    await controller.convertModel(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "No files were uploaded.",
    });

    expect(saveStepFile).not.toHaveBeenCalled();
    expect(convertStepToObj).not.toHaveBeenCalled();
    expect(convertToGltf).not.toHaveBeenCalled();
  });

  it("should process file and return 200 on success", async () => {
    const mockReq = { files: { stepFile: mockStepFile } };

    await controller.convertModel(mockReq, mockRes);

    expect(saveStepFile).toHaveBeenCalledWith(mockStepFile);
    expect(convertStepToObj).toHaveBeenCalledWith(mockMeshes, "example");
    expect(convertToGltf).toHaveBeenCalledWith(mockObjPath, "example");

    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Conversion complete.",
      paths: {
        gltfPath: mockGltfPath,
      },
    });
  });

  it("should return all gltf files", async () => {
    const mockReq = {};
    const mockGltfFiles = [
      {
        name: "Part1.gltf",
        size: 1804,
        date: "2025-04-24T09:43:11.729Z",
        url: `${API_URL}/files?fileName=Part1.gltf`,
      },
      {
        name: "RF__Volley_Ball.gltf",
        size: 1932,
        date: "2025-04-24T09:51:10.420Z",
        url: `${API_URL}/files?fileName=RF__Volley_Ball.gltf`,
      },
      {
        name: "sphere lattice (surface only)_.gltf",
        size: 1969,
        date: "2025-04-24T09:51:43.701Z",
        url: `${API_URL}/files?fileName=sphere lattice (surface only)_.gltf`,
      },
    ];

    getFiles.mockResolvedValue(mockGltfFiles);

    await controller.getFiles(mockReq, mockRes);

    expect(getFiles).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockGltfFiles);
  });

  it("should handle getFiles error and return 500", async () => {
    const mockReq = {};
    getFiles.mockRejectedValue(new Error("Test failure"));

    await controller.getFiles(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Failed to fetch files.",
    });
  });

  it("should get a provided gltf file", async () => {
    const mockReq = { query: { fileName: "Part1" } };
    const mockFilePath = "uploads/Part1/Part1.gltf";

    getFilePath.mockResolvedValue(mockFilePath);

    await controller.getFiles(mockReq, mockRes);

    expect(getFilePath).toHaveBeenCalledWith("Part1");
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.sendFile).toHaveBeenCalledWith(mockFilePath);
  });
});
