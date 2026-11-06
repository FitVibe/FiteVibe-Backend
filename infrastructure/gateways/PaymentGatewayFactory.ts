import { IPaymentGateway } from "@/domain/gateways/IPaymentGateway";
import { StripePaymentGateway } from "./StripePaymentGateway";

export class PaymentGatewayFactory {
    private static instances: Map<string, IPaymentGateway> = new Map();

    /**
     * Resolves the configured payment gateway instance based on PAYMENT_GATEWAY env variable.
     */
    public static getGateway(gatewayName?: string): IPaymentGateway {
        const selected = (gatewayName || process.env.PAYMENT_GATEWAY || 'stripe').toLowerCase().trim();

        if (this.instances.has(selected)) {
            return this.instances.get(selected)!;
        }

        switch (selected) {
            case 'stripe': {
                const gateway = new StripePaymentGateway();
                this.instances.set(selected, gateway);
                return gateway;
            }
            // Future gateways can be added here without modifying SubscriptionService:
            // case 'paypal':
            //     const paypalGateway = new PayPalPaymentGateway();
            //     this.instances.set(selected, paypalGateway);
            //     return paypalGateway;
            default:
                throw new Error(
                    `[PaymentGatewayFactory] Unsupported PAYMENT_GATEWAY: "${selected}". Currently supported: "stripe"`
                );
        }
    }
}
