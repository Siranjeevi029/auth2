package com.telusko.part29springsecex.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    @Value("${sendgrid.replyto.email:}")
    private String replyToEmail;

    @Value("${sendgrid.data.residency:}")
    private String dataResidency;

    public void sendEmail(String to, String subject, String body) throws Exception {
        try {
            System.out.println("Attempting to send email to: " + to);

            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException("SENDGRID_API_KEY is missing");
            }
            if (fromEmail == null || fromEmail.isBlank()) {
                throw new IllegalStateException("SENDGRID_FROM_EMAIL is missing or not verified");
            }

            Email from = new Email(fromEmail);
            Email recipient = new Email(to);
            Content content = new Content("text/plain", body);
            Mail mail = new Mail();
            mail.setFrom(from);
            mail.setSubject(subject);
            mail.addContent(content);

            Personalization personalization = new Personalization();
            personalization.addTo(recipient);
            mail.addPersonalization(personalization);

            if (replyToEmail != null && !replyToEmail.isBlank()) {
                mail.setReplyTo(new Email(replyToEmail));
            }

            SendGrid sg = new SendGrid(apiKey);
            if (dataResidency != null && !dataResidency.isBlank()) {
                sg.setDataResidency(dataResidency);
            }

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            int status = response.getStatusCode();
            if (status < 200 || status >= 300) {
                throw new IOException("SendGrid error: status=" + status + " body=" + response.getBody());
            }

            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Email sending failed for " + to + ": " + e.getMessage());
            throw e;
        }
    }
}
