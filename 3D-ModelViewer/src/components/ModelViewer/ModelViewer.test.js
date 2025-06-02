import React from "react";
import { render } from "@testing-library/react";
import ModelViewer from "./ModelViewer";

describe("ModelViewer Component", () => {
  it.skip("renders without crashing", () => {
    const { container } = render(<ModelViewer modelPath="/mock/path.gltf" />);
    expect(container).toBeTruthy();
  });
});
