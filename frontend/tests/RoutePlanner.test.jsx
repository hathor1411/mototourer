import { render, fireEvent } from "@testing-library/react";
import RoutePlanner from "../src/components/RoutePlanner";

test("renders input fields", () => {
  const { getByPlaceholderText } = render(<RoutePlanner onPlanRoute={() => {}} onReverse={() => {}} />);
  expect(getByPlaceholderText(/Start/)).toBeInTheDocument();
  expect(getByPlaceholderText(/Ziel/)).toBeInTheDocument();
});

test("triggers onPlanRoute when submitted", () => {
  const mockPlan = vi.fn();
  const { getByPlaceholderText, getByText } = render(<RoutePlanner onPlanRoute={mockPlan} onReverse={() => {}} />);
  fireEvent.change(getByPlaceholderText(/Start/), { target: { value: "München" } });
  fireEvent.change(getByPlaceholderText(/Ziel/), { target: { value: "Hamburg" } });
  fireEvent.click(getByText(/Route berechnen/));
  expect(mockPlan).toHaveBeenCalled();
});
