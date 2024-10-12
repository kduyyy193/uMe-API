async function handleCashPayment(order) {
  order.isCheckout = true;
  order.paymentMethod = "CASH";
  await order.save();

  return { success: true, msg: "Checkout successful with CASH.", order };
}

module.exports = handleCashPayment;
