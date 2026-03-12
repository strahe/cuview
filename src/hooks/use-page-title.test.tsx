import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePageTitle } from "@/hooks/use-page-title";

function TitleLayer({
  title,
  childTitle,
}: {
  title?: string;
  childTitle?: string;
}) {
  usePageTitle(title);

  return childTitle ? <NestedTitle title={childTitle} /> : null;
}

function NestedTitle({ title }: { title?: string }) {
  usePageTitle(title);
  return null;
}

describe("usePageTitle", () => {
  it("restores the previous title when nested title hooks unmount", () => {
    document.title = "Workspace";

    const view = render(<TitleLayer title="Storage" />);

    expect(document.title).toBe("Storage - Cuview");

    view.rerender(<TitleLayer title="Storage" childTitle="Storage Path" />);

    expect(document.title).toBe("Storage Path - Cuview");

    view.rerender(<TitleLayer title="Storage" />);

    expect(document.title).toBe("Storage - Cuview");

    view.unmount();

    expect(document.title).toBe("Workspace");
  });
});
