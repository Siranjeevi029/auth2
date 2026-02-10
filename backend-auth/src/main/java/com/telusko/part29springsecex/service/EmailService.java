package com.telusko.part29springsecex.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    @Value("${sendgrid.replyto.email:}")
    private String replyToEmail;

    @Value("${sendgrid.data.residency:}")
    private String dataResidency;

    @PostConstruct
    void logConfig() {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("SENDGRID_API_KEY is missing");
        } else {
            log.info("SENDGRID_API_KEY is set");
        }

        if (fromEmail == null || fromEmail.isBlank()) {
            log.error("SENDGRID_FROM_EMAIL is missing");
        } else {
            log.info("SendGrid from email: {}", fromEmail);
        }

        if (replyToEmail != null && !replyToEmail.isBlank()) {
            log.info("SendGrid reply-to email: {}", replyToEmail);
        }

        if (dataResidency != null && !dataResidency.isBlank()) {
            log.info("SendGrid data residency: {}", dataResidency);
        }
    }

    public void sendEmail(String to, String subject, String body) throws Exception {
        try {
            log.info("Attempting to send email to: {}", to);

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

            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Email sending failed for {}", to, e);
            throw e;
        }
    }
}