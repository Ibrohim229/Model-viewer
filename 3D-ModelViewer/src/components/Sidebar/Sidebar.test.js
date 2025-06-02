/* eslint-disable testing-library/prefer-presence-queries */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { useModelContext } from "../../context/ModelContext";
import { convertStepFile } from "../../services/ModelService";
import { API_URL } from "../../constants";

const MODELS = {
  model1: "model1.gltf",
  model2: "model2.gltf",
};

const FILES = {
  invalid_file: new File(["test file"], "invalid.txt"),
  valid_file: new File(["test file"], "valid.step"),
  empty_file: new File([""], "empty.step"),
};

jest.mock("../../context/ModelContext");
jest.mock("../../services/ModelService");

const mockRefreshModels = jest.fn();

beforeEach(() => {
  const date = new Date();
  useModelContext.mockReturnValue({
    models: [
      {
        date: date,
        name: MODELS.model1,
        size: 123,
        url: `${API_URL}/files?fileName=${MODELS.model1}`,
      },
      {
        date: date,
        name: MODELS.model2,
        size: 456,
        url: `${API_URL}/files?fileName=${MODELS.model2}`,
      },
    ],
    refreshModels: mockRefreshModels,
  });

  convertStepFile.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

const renderSidebar = ({ modelPath = "", onSelect = jest.fn() } = {}) => {
  render(<Sidebar modelPath={modelPath} onSelect={onSelect} />);
};

describe("Sidebar Component", () => {
  it("renders model list", () => {
    renderSidebar({
      modelPath: `${API_URL}/files?fileName=${MODELS.model1}`,
    });
    expect(screen.queryByText("Available Models")).not.toBeNull();
    expect(screen.queryByText(MODELS.model1)).not.toBeNull();
    expect(screen.queryByText(MODELS.model2)).not.toBeNull();
  });

  it("shows error for invalid file extension", () => {
    renderSidebar();
    const input = screen.getByLabelText("Drop or upload your file");
    fireEvent.change(input, {
      target: {
        files: [FILES.invalid_file],
      },
    });

    expect(
      screen.queryByText("Only .step or .stp files are allowed.")
    ).not.toBeNull();
  });

  it("triggers file conversion and refreshes model list", async () => {
    renderSidebar();
    const input = screen.getByLabelText("Drop or upload your file");

    fireEvent.change(input, { target: { files: [FILES.valid_file] } });

    const uploadBtn = await screen.findByText(/Upload|Converting.../i);
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(convertStepFile).toHaveBeenCalledWith(FILES.valid_file);
    });
    await waitFor(() => {
      expect(mockRefreshModels).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText("File converted successfully!")).not.toBeNull();
    });
  });

  it("displays error on conversion failure", async () => {
    convertStepFile.mockRejectedValue(new Error("Upload failed"));
    renderSidebar({
      modelPath: `${API_URL}?fileName=${MODELS.model1}`,
    });

    const input = screen.getByLabelText("Drop or upload your file");
    fireEvent.change(input, { target: { files: [FILES.empty_file] } });

    const uploadBtn = await screen.findByText(/Upload|Converting.../i);
    fireEvent.click(uploadBtn);

    expect(await screen.findByText("Upload failed")).not.toBeNull();
  });

  it("calls onSelect when a model button is clicked", () => {
    const mockSelect = jest.fn();
    renderSidebar({
      modelPath: `${API_URL}/files?fileName=${MODELS.model2}`,
      onSelect: mockSelect,
    });

    const modelBtn = screen.getByText(MODELS.model2);
    fireEvent.click(modelBtn);
    expect(mockSelect).toHaveBeenCalledWith(
      `${API_URL}/files?fileName=${MODELS.model2}`
    );
  });
});
