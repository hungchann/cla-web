import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchForm } from "@/components/search-form";

describe("SearchForm", () => {
  it("renders search input", () => {
    render(<SearchForm />);
    expect(screen.getByPlaceholderText("Type to search...")).toBeInTheDocument();
  });

  it("forwards form props (onSubmit)", async () => {
    let submitted = false;
    render(
      <SearchForm
        onSubmit={(e) => {
          e.preventDefault();
          submitted = true;
        }}
      />,
    );
    screen.getByPlaceholderText("Type to search...").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    expect(submitted).toBe(true);
  });
});
