import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
}

export async function sendInvitationEmail(email: string, token: string, name?: string) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${token}`;
  const logoUrl = `${process.env.NEXTAUTH_URL}/logo_login.png`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Intranet TN" <notice@tnoutsourcing.com>',
    to: email,
    subject: 'Bienvenido a la Intranet de TN Outsourcing',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="Telecom Networks" style="height: 60px; width: auto;" />
        </div>
        
        <h2 style="color: #1e293b; margin-bottom: 15px;">¡Hola ${name || 'compañero'}!</h2>
        
        <p style="color: #475569; line-height: 1.6;">Has sido invitado a unirte a la Intranet Corporativa de <strong>Telecom Networks Outsourcing</strong>.</p>
        
        <p style="color: #475569; line-height: 1.6;">Para completar tu registro y configurar tu contraseña oficial, haz clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Configurar mi cuenta
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 0.9rem; text-align: center;">Este enlace es válido por 24 horas.</p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        
        <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-bottom: 0;">
          Si no esperabas esta invitación, puedes ignorar este correo de forma segura.<br>
          © ${new Date().getFullYear()} Telecom Networks
        </p>
      </div>
    `,
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message || 'Error en SMTP' };
  }
}

export async function sendTimeOffEmail(params: {
  employeeName: string,
  projectName: string,
  typeLabel: string,
  timeDetails: string,
  reason: string,
  toEmails: string[]
}) {
  const { employeeName, projectName, typeLabel, timeDetails, reason, toEmails } = params;
  const logoUrl = `${process.env.NEXTAUTH_URL}/logo_login.png`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Intranet TN" <no-reply@tnoutsourcing.com>',
    to: toEmails.join(", "),
    subject: `NUEVA SOLICITUD DE: ${employeeName} - ${typeLabel}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="Telecom Networks" style="height: 60px; width: auto;" />
        </div>
        
        <h2 style="color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Nueva Solicitud de Ausencia</h2>
        
        <p style="color: #475569; font-size: 1.1rem;">Hola,</p>
        
        <p style="color: #475569; line-height: 1.6;">El empleado <strong>${employeeName}</strong> del departamento <strong>${projectName || "General"}</strong> ha creado una nueva solicitud que requiere tu atención.</p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #edf2f7;">
          <h3 style="margin-top: 0; color: #2563eb; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la Solicitud</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 120px;">Tipo:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Vigencia/Salida:</td>
              <td style="padding: 8px 0; color: #1e293b;">${timeDetails}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Motivo:</td>
              <td style="padding: 8px 0; color: #1e293b;">${reason || "Ninguno especificado"}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Gestionar en el Panel de Aprobaciones
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        
        <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-bottom: 0;">
          Enviado automáticamente por la Intranet Corporativa.<br>
          <strong>IT Telecom Support Team</strong>
        </p>
      </div>
    `,
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Notificación de tiempo libre enviada:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error enviando notificación de tiempo libre:', error);
    return { success: false, error };
  }
}

export async function sendFriendRequestEmail(email: string, senderName: string) {
  const socialUrl = `${process.env.NEXTAUTH_URL}/social`;
  const logoUrl = `${process.env.NEXTAUTH_URL}/logo_login.png`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Intranet TN" <no-reply@tnoutsourcing.com>',
    to: email,
    subject: `Nueva Solicitud de Amistad de ${senderName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="Telecom Networks" style="height: 60px; width: auto;" />
        </div>
        
        <h2 style="color: #1e293b; margin-bottom: 15px;">¡Hola!</h2>
        
        <p style="color: #475569; line-height: 1.6;"><strong>${senderName}</strong> quiere conectar contigo en la Intranet de Telecom Networks.</p>
        
        <p style="color: #475569; line-height: 1.6;">Ahora puedes chatear y compartir archivos con tus colegas a través del nuevo Chat Social.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${socialUrl}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Ver Solicitud
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        
        <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-bottom: 0;">
          Enviado automáticamente por la Intranet Corporativa.<br>
          © ${new Date().getFullYear()} Telecom Networks
        </p>
      </div>
    `,
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error enviando email social:', error);
    return { success: false, error };
  }
}
