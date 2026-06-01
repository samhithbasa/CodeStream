from flask import Flask, request, jsonify
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# ── Shared HTML email template ─────────────────────────────────────
def get_email_template(title, body_html):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f2f5;
      color: #333;
    }}
    .wrapper {{
      width: 100%;
      padding: 40px 20px;
      background-color: #f0f2f5;
    }}
    .container {{
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }}
    .header {{
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 36px 40px;
      text-align: center;
    }}
    .header .logo {{
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
    }}
    .header .logo span {{
      color: #4fc3f7;
    }}
    .header .tagline {{
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      margin-top: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }}
    .body {{
      padding: 40px;
    }}
    .body h2 {{
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 12px;
    }}
    .body p {{
      font-size: 15px;
      line-height: 1.7;
      color: #555;
      margin-bottom: 12px;
    }}
    .otp-box {{
      background: linear-gradient(135deg, #e8f4fd, #d1ecf1);
      border: 2px dashed #4fc3f7;
      border-radius: 12px;
      padding: 28px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-code {{
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0f3460;
      font-family: 'Courier New', monospace;
    }}
    .otp-label {{
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #0f3460, #1a6fd4);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      margin: 20px 0;
      letter-spacing: 0.5px;
    }}
    .btn-wrapper {{
      text-align: center;
      margin: 28px 0;
    }}
    .info-box {{
      background: #f8f9fa;
      border-left: 4px solid #4fc3f7;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 20px 0;
    }}
    .info-box p {{
      margin: 0;
      font-size: 14px;
      color: #444;
    }}
    .info-box strong {{
      color: #1a1a2e;
    }}
    .message-quote {{
      background: #f8f9fa;
      border-left: 4px solid #4fc3f7;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 16px 0;
      font-style: italic;
      color: #555;
      font-size: 14px;
      line-height: 1.7;
    }}
    .divider {{
      border: none;
      border-top: 1px solid #eee;
      margin: 28px 0;
    }}
    .warning {{
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #7a5c00;
      margin-top: 16px;
    }}
    .footer {{
      background: #f8f9fa;
      border-top: 1px solid #eee;
      padding: 24px 40px;
      text-align: center;
    }}
    .footer p {{
      font-size: 12px;
      color: #999;
      line-height: 1.6;
      margin: 0;
    }}
    .footer a {{
      color: #4fc3f7;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">Code<span>Stream</span></div>
        <div class="tagline">Your coding companion</div>
      </div>
      <div class="body">
        <h2>{title}</h2>
        {body_html}
      </div>
      <div class="footer">
        <p>&copy; 2026 CodeStream IDE. All rights reserved.</p>
        <p style="margin-top:6px">Building the future of coding, together.</p>
      </div>
    </div>
  </div>
</body>
</html>"""


# ── Core send function ─────────────────────────────────────────────
def send_email(to, subject, html):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"CodeStream <{os.environ['EMAIL_USER']}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 587) as server:
        server.login(os.environ["EMAIL_USER"], os.environ["EMAIL_PASS"])
        server.sendmail(os.environ["EMAIL_USER"], to, msg.as_string())


# ── Routes ─────────────────────────────────────────────────────────

@app.route("/send-otp-email", methods=["POST"])
def send_otp_email():
    data = request.json
    body = f"""
      <p>Thank you for joining CodeStream! Use the code below to verify your email address.</p>
      <div class="otp-box">
        <div class="otp-code">{data['otp']}</div>
        <div class="otp-label">One-time password</div>
      </div>
      <div class="warning">
        ⚠️ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
      </div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#999">
        If you didn't request this, you can safely ignore this email.
      </p>
    """
    html = get_email_template("Verify Your Email", body)
    send_email(data["to"], "Your OTP for Registration — CodeStream", html)
    return jsonify({"ok": True})


@app.route("/send-reset-email", methods=["POST"])
def send_reset_email():
    data = request.json
    body = f"""
      <p>We received a request to reset the password for your CodeStream account.
         Click the button below to choose a new password.</p>
      <div class="btn-wrapper">
        <a class="btn" href="{data['resetLink']}">Reset My Password</a>
      </div>
      <div class="info-box">
        <p>This link will expire in <strong>1 hour</strong>.</p>
      </div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#999">
        If you didn't request a password reset, no action is needed —
        your account is safe.
      </p>
    """
    html = get_email_template("Password Reset Request", body)
    send_email(data["to"], "Reset Your Password — CodeStream", html)
    return jsonify({"ok": True})


@app.route("/send-contact-email", methods=["POST"])
def send_contact_email():
    data = request.json
    body = f"""
      <p>Hello <strong>{data['name']}</strong>,</p>
      <p>Thank you for contacting us! We've received your message and will
         get back to you within <strong>24 hours</strong>.</p>
      <div class="info-box">
        <p><strong>Ticket ID:</strong> {data['ticketId']}</p>
        <p style="margin-top:6px"><strong>Subject:</strong> {data['subject']}</p>
      </div>
      <p style="margin-top:20px"><strong>Your message:</strong></p>
      <div class="message-quote">{data['message']}</div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#999">
        You can reply directly to this email to add more information to your ticket.
      </p>
    """
    html = get_email_template(f"Ticket Created: {data['ticketId']}", body)
    send_email(data["to"], f"Ticket Created: {data['ticketId']} — CodeStream", html)
    return jsonify({"ok": True})


@app.route("/send-ticket-update-email", methods=["POST"])
def send_ticket_update_email():
    data = request.json
    status = data.get("status", "")
    status_color = "#27ae60" if status == "resolved" else "#3498db"
    status_label = "Resolved ✓" if status == "resolved" else "In Progress"
    body = f"""
      <p>Hello <strong>{data['name']}</strong>,</p>
      <p>Your support ticket status has been updated.</p>
      <div class="info-box">
        <p><strong>Ticket ID:</strong> {data['ticketId']}</p>
        <p style="margin-top:6px"><strong>Subject:</strong> {data['subject']}</p>
        <p style="margin-top:6px"><strong>New Status:</strong>
           <span style="color:{status_color};font-weight:700">{status_label}</span>
        </p>
      </div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#999">
        If you have further questions, reply to this email.
      </p>
    """
    html = get_email_template(f"Ticket Update: {status_label}", body)
    send_email(data["to"], f"Ticket Update: {data['ticketId']} — {status_label}", html)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(port=5001, debug=True)