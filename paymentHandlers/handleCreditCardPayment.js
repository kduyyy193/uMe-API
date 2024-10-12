const stripe = require("stripe")("your-secret-key");

async function handleCreditCardPayment(order, amount, paymentToken) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "vnd",
      payment_method: paymentToken,
      confirm: true,
    });

    if (paymentIntent.status === "succeeded") {
      order.isCheckout = true;
      order.paymentMethod = "CREDIT_CARD";
      await order.save();

      return {
        success: true,
        msg: "Checkout successful with CREDIT_CARD.",
        order,
      };
    } else {
      return { success: false, msg: "Payment failed or not confirmed." };
    }
  } catch (error) {
    return { success: false, msg: "Stripe payment error", error };
  }
}

module.exports = handleCreditCardPayment;
