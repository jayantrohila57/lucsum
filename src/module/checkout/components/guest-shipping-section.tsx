"use client";

import Form from "@/shared/components/form/form";
import { FormSection } from "@/shared/components/form/form.helper";

export function GuestShippingSection() {
  return (
    <FormSection title="Shipping address" description="Where should we deliver your order?" required>
      <div className="grid gap-4 sm:grid-cols-2">
        <Form.Field
          name="body.guestShipping.fullName"
          label="Full name"
          type="text"
          required
          className="sm:col-span-2"
        />
        <Form.Field
          name="body.guestShipping.line1"
          label="Address line 1"
          type="text"
          required
          className="sm:col-span-2"
        />
        <Form.Field name="body.guestShipping.line2" label="Address line 2" type="text" className="sm:col-span-2" />
        <Form.Field name="body.guestShipping.city" label="City" type="text" required />
        <Form.Field name="body.guestShipping.state" label="State" type="text" required />
        <Form.Field name="body.guestShipping.postalCode" label="PIN code" type="text" required />
        <Form.Field name="body.guestShipping.country" label="Country" type="text" required />
        <Form.Field name="body.guestShipping.phone" label="Phone" type="text" className="sm:col-span-2" />
      </div>
    </FormSection>
  );
}
