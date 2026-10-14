import { CartItemList } from "@/module/cart/components/cart-item-list";
import { CartSummary } from "@/module/cart/components/cart-summary";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PATH } from "@/shared/config/routes";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export const metadata = buildPageMetadata({
  title: "Cart",
  description: "Review items in your shopping cart and proceed to checkout.",
  canonicalPath: PATH.CART,
  ogType: "website",
});

export default function PublicCartPage() {
  return (
    <Shell>
      <Shell.Section>
        <Section title="Your cart" description="Guest checkout is available — sign in is optional.">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <CartItemList />
              </CardContent>
            </Card>
            <CartSummary />
          </div>
        </Section>
      </Shell.Section>
    </Shell>
  );
}
