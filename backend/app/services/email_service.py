"""
Email service stub.

For development, this just prints emails to the console.
In production, replace `_send_email` with calls to SendGrid, AWS SES, Resend, etc.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Internal function — replace with real provider in production."""
    logger.info("=" * 60)
    logger.info(f"📧 EMAIL (DEV MODE)")
    logger.info(f"To:      {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body:")
    logger.info(body)
    logger.info("=" * 60)
    return True


def send_order_confirmation(
    to_email: str,
    customer_name: str,
    order_number: str,
    total_amount: float,
    items: list,
) -> bool:
    """Send order confirmation email."""
    items_text = "\n".join(
        f"  - {item['name']} × {item['quantity']} = ₹{item['line_total']:.2f}"
        for item in items
    )
    body = f"""Hi {customer_name},

Thank you for your order at Anjali Boutique! 🌸

Order Number: {order_number}
Total: ₹{total_amount:.2f}

Items:
{items_text}

We'll send you another email when your order ships.

— Team Anjali Boutique"""

    return _send_email(to_email, f"Order {order_number} confirmed", body)


def send_low_stock_alert(
    admin_email: str, product_name: str, current_stock: int
) -> bool:
    """Notify admin when product stock falls below threshold."""
    body = f"⚠️ Low stock: '{product_name}' has only {current_stock} units left."
    return _send_email(admin_email, f"Low stock alert: {product_name}", body)