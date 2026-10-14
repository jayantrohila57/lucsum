import { describe, expect, it } from "vitest";
import { paiseFromInr, productPrimaryImageUrl, shopifyId, styleFromTags } from "../scripts/shopify-import.lib";

describe("shopify-import helpers", () => {
  it("parses Shopify GIDs", () => {
    expect(shopifyId("gid://shopify/Product/8736114966628")).toBe("8736114966628");
  });

  it("converts INR to paise", () => {
    expect(paiseFromInr("999.00")).toBe(99900);
    expect(paiseFromInr("899")).toBe(89900);
  });

  it("maps style tags", () => {
    expect(styleFromTags(["style-celestial-graphic", "colour-black"])).toBe("celestial-graphic");
    expect(styleFromTags(["other"])).toBeNull();
  });

  it("reads primary image from media nodes", () => {
    const url = productPrimaryImageUrl({
      media: {
        nodes: [{ image: { url: "https://cdn.shopify.com/example.png" } }],
      },
    });
    expect(url).toBe("https://cdn.shopify.com/example.png");
  });
});
