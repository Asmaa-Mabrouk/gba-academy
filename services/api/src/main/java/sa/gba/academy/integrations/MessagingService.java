package sa.gba.academy.integrations;

/** PORT: email / SMS / WhatsApp notifications (receipts, session reminders). */
public interface MessagingService {
    void send(String to, String templateKey, java.util.Map<String, String> params);
}
