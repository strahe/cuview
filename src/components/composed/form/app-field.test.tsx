import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AppCheckboxField,
  AppField,
  AppSwitchField,
  CheckboxField,
  getFieldErrorMessages,
  TextField,
} from "./index";

describe("getFieldErrorMessages", () => {
  it("filters non-string errors and preserves messages", () => {
    expect(
      getFieldErrorMessages([undefined, "Required", { message: "Too short" }]),
    ).toEqual(["Required", "Too short"]);
  });
});

describe("AppField", () => {
  it("renders label, description, and error content around children", () => {
    render(
      <AppField
        description="Enter the Curio endpoint."
        errors={["Endpoint is required"]}
        htmlFor="endpoint"
        label="Endpoint"
      >
        <input id="endpoint" />
      </AppField>,
    );

    expect(screen.getByText("Endpoint")).toBeInTheDocument();
    expect(screen.getByText("Enter the Curio endpoint.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Endpoint is required");
  });
});

describe("AppCheckboxField", () => {
  it("renders checkbox fields with associated text content", () => {
    render(
      <AppCheckboxField
        control={
          <Checkbox
            aria-label="Enabled"
            checked
            id="enabled"
            onCheckedChange={() => {}}
          />
        }
        description="Turns the scheduler on."
        label="Enabled"
      />,
    );

    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Turns the scheduler on.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enabled" })).toBeChecked();
  });
});

describe("AppSwitchField", () => {
  it("renders switch fields with associated descriptions", () => {
    render(
      <AppSwitchField
        control={
          <Switch
            aria-label="Developer mode"
            checked
            id="developer-mode"
            onCheckedChange={() => {}}
          />
        }
        description="Exposes extra diagnostics."
        label="Developer mode"
      />,
    );

    expect(screen.getByText("Developer mode")).toBeInTheDocument();
    expect(screen.getByText("Exposes extra diagnostics.")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Developer mode" }),
    ).toBeChecked();
  });
});

describe("TextField", () => {
  it("binds input fields to TanStack-style field api", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    const handleChange = vi.fn();

    render(
      <TextField
        field={{
          form: { state: { submissionAttempts: 0 } },
          handleBlur,
          handleChange,
          name: "endpoint",
          state: {
            meta: { errors: [], isBlurred: false, isTouched: false },
            value: "http://localhost:4701",
          },
        }}
        label="Endpoint"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Endpoint" });
    await user.type(input, "/rpc");
    await user.tab();

    expect(handleChange).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});

describe("CheckboxField", () => {
  it("binds checkbox controls to TanStack-style field api", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CheckboxField
        field={{
          form: { state: { submissionAttempts: 0 } },
          handleBlur: () => {},
          handleChange,
          name: "enabled",
          state: {
            meta: { errors: [], isBlurred: false, isTouched: false },
            value: true,
          },
        }}
        label="Enabled"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Enabled" }));
    expect(handleChange).toHaveBeenCalled();
  });
});
