import { render } from "@testing-library/react";
import App from "./App";

// Mock axios to prevent ES module issues
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock AG Grid to simplify testing
jest.mock("ag-grid-react", () => ({
  AgGridReact: () => <div data-testid="ag-grid-mock">AG Grid</div>,
}));

test("renders app without crashing", () => {
  render(<App />);
  // Just verify the app renders without throwing
  expect(document.body).toBeInTheDocument();
});
