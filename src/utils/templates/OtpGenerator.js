const GenerateOtpEmailTemplate = (otp) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body>
  <center>
    <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" 
      style="max-width:600px;margin:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji'!important">
      <tbody>
        <tr>
          <td align="center" style="padding:16px">
            <h2 style="margin-top:8px;margin-bottom:0;font-size:24px;font-weight:500;line-height:1.25;color:#24292f">
              Verify Your Email
            </h2>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0;">
            <table border="0" cellspacing="0" cellpadding="0" width="80%" 
              style="border:1px solid #e2e4e8;color:#242930;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:24px">
                    <h3 style="text-align:center;font-size:20px;font-weight:600;line-height:1.25;color:#24292f">
                      Your One-Time Password (OTP)
                    </h3>
                    <p style="margin-top:0;margin-bottom:10px;text-align:center">
                      Use the OTP below to complete your verification process.
                    </p>
                    <p style="margin:20px 0;text-align:center;font-size:28px;font-weight:bold;letter-spacing:4px;color:#07131C">
                      ${otp}
                    </p>
                    <p style="margin-top:0;margin-bottom:10px;text-align:center">
                      This OTP will expire in <strong>15 minutes</strong>. Please do not share it with anyone.
                    </p>
                    <p style="margin-top:20px;margin-bottom:10px;text-align:center">
                      Thanks,<br>The developer Team
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" 
      style="text-align:center!important;margin-top:20px;">
      <tbody>
        <tr>
          <td style="padding:16px">
            <p style="margin-top:0;margin-bottom:10px;color:#6a737d;font-size:14px">
              You're receiving this email because an OTP was requested for verification of your account.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </center>
</body>
</html>`;
};

export default GenerateOtpEmailTemplate;
