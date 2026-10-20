package sa.gba.academy.orders;

/** Money rules in one place. Prices shown to learners already include 15% VAT. */
public final class Pricing {
    public static final double VAT_RATE = 0.15;

    private Pricing() {}

    /** Net amount (before VAT) from a VAT-inclusive total, in halalas. */
    public static long net(long totalInclVat) {
        return Math.round(totalInclVat / (1 + VAT_RATE));
    }

    public static long vat(long totalInclVat) {
        return totalInclVat - net(totalInclVat);
    }
}
