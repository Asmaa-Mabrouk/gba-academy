package sa.gba.academy.orders;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PricingTest {
    @Test
    void splitsVatInclusiveTotal() {
        // 115.00 SAR incl. VAT = 100.00 net + 15.00 VAT
        assertEquals(10000, Pricing.net(11500));
        assertEquals(1500, Pricing.vat(11500));
    }

    @Test
    void freeIsFree() {
        assertEquals(0, Pricing.net(0));
        assertEquals(0, Pricing.vat(0));
    }

    @Test
    void netPlusVatAlwaysEqualsTotal() {
        for (long t = 0; t < 5000; t += 7) assertEquals(t, Pricing.net(t) + Pricing.vat(t));
    }
}
