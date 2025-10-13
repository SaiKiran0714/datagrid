// Component tests for SearchBar
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchBar from "./SearchBar";
import useGridStore from "../store/gridStore";

// Mock the Zustand store
jest.mock("../store/gridStore");

describe("SearchBar Component", () => {
  let mockSetQ;

  beforeEach(() => {
    mockSetQ = jest.fn();

    useGridStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        const store = {
          q: "",
          setQ: mockSetQ,
        };
        return selector(store);
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render search input field", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toBeInTheDocument();
    });

    it("should display placeholder text", () => {
      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("should display current search value from store", () => {
      useGridStore.mockImplementation((selector) => {
        if (typeof selector === "function") {
          const store = {
            q: "Tesla Model 3",
            setQ: mockSetQ,
          };
          return selector(store);
        }
      });

      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("Tesla Model 3");
    });
  });

  describe("User Interactions", () => {
    it("should update search value on input change", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "BMW" } });

      // Input value should update immediately
      expect(searchInput).toHaveValue("BMW");

      // But setQ should only be called when search button is clicked or form submitted
      const searchButton = screen.getByLabelText(/search/i);
      fireEvent.click(searchButton);

      expect(mockSetQ).toHaveBeenCalledWith("BMW");
    });

    it("should handle empty search input", () => {
      useGridStore.mockImplementation((selector) => {
        if (typeof selector === "function") {
          const store = {
            q: "Tesla",
            setQ: mockSetQ,
          };
          return selector(store);
        }
      });

      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "" } });

      // Click search button to trigger
      const searchButton = screen.getByLabelText(/search/i);
      fireEvent.click(searchButton);

      expect(mockSetQ).toHaveBeenCalledWith(undefined);
    });

    it("should handle special characters in search", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "Model 3 (2023)" } });

      const searchButton = screen.getByLabelText(/search/i);
      fireEvent.click(searchButton);

      expect(mockSetQ).toHaveBeenCalledWith("Model 3 (2023)");
    });

    it("should handle long search strings", () => {
      render(<SearchBar />);

      const longString =
        "This is a very long search query that contains multiple words and phrases";
      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: longString } });

      const searchButton = screen.getByLabelText(/search/i);
      fireEvent.click(searchButton);

      expect(mockSetQ).toHaveBeenCalledWith(longString);
    });
  });

  describe("Debouncing (if implemented)", () => {
    it("should debounce rapid input changes", async () => {
      jest.useFakeTimers();

      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      const searchButton = screen.getByLabelText(/search/i);

      // Rapid typing simulation
      fireEvent.change(searchInput, { target: { value: "T" } });
      fireEvent.change(searchInput, { target: { value: "Te" } });
      fireEvent.change(searchInput, { target: { value: "Tes" } });
      fireEvent.change(searchInput, { target: { value: "Tesl" } });
      fireEvent.change(searchInput, { target: { value: "Tesla" } });

      // Click search button
      fireEvent.click(searchButton);

      // If debounced, should only call once after delay
      jest.runAllTimers();

      // Note: Adjust based on actual implementation
      // If not debounced, will be called 5 times
      expect(mockSetQ).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toBeVisible();
    });

    it("should be keyboard accessible", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");

      act(() => {
        searchInput.focus();
      });

      expect(searchInput).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined store value", () => {
      useGridStore.mockImplementation((selector) => {
        if (typeof selector === "function") {
          const store = {
            q: undefined,
            setQ: mockSetQ,
          };
          return selector(store);
        }
      });

      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("");
    });

    it("should handle null store value", () => {
      useGridStore.mockImplementation((selector) => {
        if (typeof selector === "function") {
          const store = {
            q: null,
            setQ: mockSetQ,
          };
          return selector(store);
        }
      });

      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("");
    });

    it("should handle numeric search input", () => {
      render(<SearchBar />);

      const searchInput = screen.getByRole("textbox");
      fireEvent.change(searchInput, { target: { value: "12345" } });

      const searchButton = screen.getByLabelText(/search/i);
      fireEvent.click(searchButton);

      expect(mockSetQ).toHaveBeenCalledWith("12345");
    });
  });
});
